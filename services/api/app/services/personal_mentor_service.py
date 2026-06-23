import logging
import json
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.llm.providers.factory import LLMProviderFactory
from app.services.agent_context_service import AgentContextService

logger = logging.getLogger("mentorai-os.services.personal_mentor_service")

class PersonalMentorService:
    """Delivers daily briefings, evening reflection analysis, weekly reviews, and personalized coaching messages."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.context_service = AgentContextService(db)

    async def get_or_generate_daily_briefing(self, user_id: str, briefing_type: str = "morning") -> Dict[str, Any]:
        """Gets or generates today's daily briefing (morning / evening)."""
        try:
            today = date.today()
            # 1. Check if briefing already exists in db
            stmt = text("""
                SELECT briefing_data, briefing_text, created_at 
                FROM daily_briefings 
                WHERE user_id = :user_id AND briefing_date = :today AND briefing_type = :b_type
                LIMIT 1
            """)
            res = await self.db.execute(stmt, {"user_id": user_id, "today": today, "b_type": briefing_type})
            row = res.fetchone()
            if row:
                return {
                    "briefing_data": row[0] if isinstance(row[0], dict) else json.loads(row[0]),
                    "briefing_text": row[1],
                    "created_at": row[2].isoformat()
                }

            # 2. Compile context
            context = await self.context_service.get_user_context(user_id)
            
            # 3. Call LLM to generate briefing
            provider = LLMProviderFactory.get_provider()
            
            if briefing_type == "morning":
                prompt = f"""
You are the user's Personal AI Mentor. Generate a morning briefing.
Current context:
- Focus score: {context['focus_score']}/100
- Active Goals: {json.dumps(context['goals'])}
- Tasks due soon or overdue: {json.dumps([t for t in context['tasks'] if t['status'] != 'completed'])}
- Today's calendar events: {json.dumps(context['calendar_events'])}

Format the response as a strict JSON object with these keys:
- "mission": A high-impact 1-sentence focus mission for today.
- "priority_tasks": 2-3 most critical tasks to complete today.
- "warnings": List of risk warnings (overdue items, scheduling conflicts).
- "briefing_text": A beautiful 3-4 sentence mentoring message starting with "Good morning. Today we focus on...".

Return ONLY the raw JSON. Do not include markdown backticks.
"""
            else:
                prompt = f"""
You are the user's Personal AI Mentor. Generate an evening briefing/reflection.
Current context:
- Tasks: {json.dumps(context['tasks'])}
- Focus score: {context['focus_score']}/100

Format the response as a strict JSON object with these keys:
- "reflection": 1-2 sentences summarizing today's performance.
- "completed_count": Number of tasks completed today.
- "missed_tasks": Tasks that remained overdue.
- "tomorrow_recommendations": 2-3 specific tasks to schedule first tomorrow.
- "briefing_text": A beautiful 3-4 sentence coaching message starting with "Good evening. Reflecting on today...".

Return ONLY the raw JSON. Do not include markdown backticks.
"""
            
            res_llm = await provider.generate(
                messages=[{"role": "user", "content": prompt}],
                model="gemini-2.5-flash",
                temperature=0.3
            )
            text_resp = res_llm.get("text", "").strip()
            
            # simple cleanup
            if "```" in text_resp:
                parts = text_resp.split("```")
                for part in parts:
                    cleaned = part.strip()
                    if cleaned.startswith("json"):
                        cleaned = cleaned[4:].strip()
                    if cleaned.startswith("{") and cleaned.endswith("}"):
                        text_resp = cleaned
                        break

            briefing_data = json.loads(text_resp)
            briefing_text = briefing_data.get("briefing_text", "Keep working on your goals to maintain momentum.")

            # Save to db
            stmt_insert = text("""
                INSERT INTO daily_briefings (user_id, briefing_date, briefing_type, briefing_data, briefing_text)
                VALUES (:user_id, :today, :b_type, :b_data, :b_text)
            """)
            await self.db.execute(stmt_insert, {
                "user_id": user_id,
                "today": today,
                "b_type": briefing_type,
                "b_data": json.dumps(briefing_data),
                "b_text": briefing_text
            })
            
            # Log agent activity
            stmt_log = text("""
                INSERT INTO agent_activity_logs (user_id, activity_type, description, metadata)
                VALUES (:user_id, :act_type, :description, :metadata)
            """)
            await self.db.execute(stmt_log, {
                "user_id": user_id,
                "act_type": "daily_briefing",
                "description": f"Generated {briefing_type.capitalize()} Briefing",
                "metadata": json.dumps({"briefing_type": briefing_type})
            })

            await self.db.commit()

            return {
                "briefing_data": briefing_data,
                "briefing_text": briefing_text,
                "created_at": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error creating briefing: {str(e)}", exc_info=True)
            # Safe fallback briefing
            fallback_data = {
                "mission": "Clear outstanding checkpoints.",
                "priority_tasks": ["Daily standup", "Focus sessions"],
                "warnings": [],
                "reflection": "Steady progress.",
                "completed_count": 0,
                "missed_tasks": [],
                "tomorrow_recommendations": []
            }
            return {
                "briefing_data": fallback_data,
                "briefing_text": "Keep moving toward your targets. Your mentor is analyzing your trajectory.",
                "created_at": datetime.now().isoformat()
            }

    async def get_or_generate_weekly_review(self, user_id: str) -> Dict[str, Any]:
        """Retrieves or generates the weekly productivity report."""
        try:
            today = date.today()
            week_start = today - timedelta(days=today.weekday())
            week_end = week_start + timedelta(days=6)

            # Check db
            stmt = text("""
                SELECT focus_score, goal_progress, task_completion_rate, risk_trends, recovery_success_rate, calendar_utilization, deep_work_hours, report_text, created_at 
                FROM weekly_reports 
                WHERE user_id = :user_id AND week_start_date = :w_start
                LIMIT 1
            """)
            res = await self.db.execute(stmt, {"user_id": user_id, "w_start": week_start})
            row = res.fetchone()
            if row:
                return {
                    "focus_score": row[0],
                    "goal_progress": row[1] if isinstance(row[1], dict) else json.loads(row[1]),
                    "task_completion_rate": row[2],
                    "risk_trends": row[3] if isinstance(row[3], dict) else json.loads(row[3]),
                    "recovery_success_rate": row[4],
                    "calendar_utilization": row[5],
                    "deep_work_hours": float(row[6]),
                    "report_text": row[7],
                    "created_at": row[8].isoformat()
                }

            # Generate new report
            context = await self.context_service.get_user_context(user_id)
            tasks = context.get("tasks", [])
            completed_tasks = [t for t in tasks if t["status"] == "completed"]
            total_tasks = len(tasks)
            completion_rate = round((len(completed_tasks) / total_tasks * 100) if total_tasks > 0 else 80)
            focus_score = context.get("focus_score", 75)

            provider = LLMProviderFactory.get_provider()
            prompt = f"""
You are the user's Personal AI Mentor. Generate a weekly review.
Current stats:
- Focus score: {focus_score}/100
- Task completion rate: {completion_rate}%
- Goals in progress: {json.dumps(context['goals'])}

Format the response as a strict JSON object with these keys:
- "recovery_success_rate": integer percentage (e.g. 85)
- "calendar_utilization": integer percentage (e.g. 70)
- "deep_work_hours": number (e.g. 15.5)
- "report_text": A beautiful, motivating 4-5 sentence productivity summary outlining their achievements, consistency, and targets.

Return ONLY the raw JSON. Do not include markdown backticks.
"""
            res_llm = await provider.generate(
                messages=[{"role": "user", "content": prompt}],
                model="gemini-2.5-flash",
                temperature=0.3
            )
            text_resp = res_llm.get("text", "").strip()

            if "```" in text_resp:
                parts = text_resp.split("```")
                for part in parts:
                    cleaned = part.strip()
                    if cleaned.startswith("json"):
                        cleaned = cleaned[4:].strip()
                    if cleaned.startswith("{") and cleaned.endswith("}"):
                        text_resp = cleaned
                        break

            data = json.loads(text_resp)
            report_text = data.get("report_text", "Excellent consistency this week. Keep up the deep work hours.")

            # Save report
            stmt_insert = text("""
                INSERT INTO weekly_reports (user_id, week_start_date, week_end_date, focus_score, goal_progress, task_completion_rate, risk_trends, recovery_success_rate, calendar_utilization, deep_work_hours, report_text)
                VALUES (:user_id, :w_start, :w_end, :f_score, :g_prog, :tc_rate, :r_trends, :rec_rate, :cal_util, :dw_hours, :report_text)
            """)
            
            goal_prog = json.dumps([{"goal": g["title"], "progress": 100 - int(g["risk_score"])} for g in context["goals"]])
            risk_trends = json.dumps([{"day": "Mon", "risk": 20}, {"day": "Wed", "risk": 40}, {"day": "Fri", "risk": 15}])

            await self.db.execute(stmt_insert, {
                "user_id": user_id,
                "w_start": week_start,
                "w_end": week_end,
                "f_score": focus_score,
                "g_prog": goal_prog,
                "tc_rate": completion_rate,
                "r_trends": risk_trends,
                "rec_rate": data.get("recovery_success_rate", 85),
                "cal_util": data.get("calendar_utilization", 70),
                "dw_hours": data.get("deep_work_hours", 12.0),
                "report_text": report_text
            })
            
            # Log agent activity
            stmt_log = text("""
                INSERT INTO agent_activity_logs (user_id, activity_type, description, metadata)
                VALUES (:user_id, 'weekly_review', :desc, :meta)
            """)
            await self.db.execute(stmt_log, {
                "user_id": user_id,
                "desc": "Generated Weekly Productivity Report",
                "meta": json.dumps({"week_start": week_start.isoformat()})
            })

            await self.db.commit()

            return {
                "focus_score": focus_score,
                "goal_progress": json.loads(goal_prog),
                "task_completion_rate": completion_rate,
                "risk_trends": json.loads(risk_trends),
                "recovery_success_rate": data.get("recovery_success_rate", 85),
                "calendar_utilization": data.get("calendar_utilization", 70),
                "deep_work_hours": data.get("deep_work_hours", 12.0),
                "report_text": report_text,
                "created_at": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error creating weekly report: {str(e)}", exc_info=True)
            return {
                "focus_score": 70,
                "goal_progress": [],
                "task_completion_rate": 80,
                "risk_trends": [],
                "recovery_success_rate": 80,
                "calendar_utilization": 65,
                "deep_work_hours": 10.0,
                "report_text": "Good work this week. Let's focus on setting and hitting early milestones next week.",
                "created_at": datetime.now().isoformat()
            }

    async def get_or_generate_mentor_coaching(self, user_id: str) -> Dict[str, Any]:
        """Generates a daily coaching / motivational message."""
        try:
            # Check db for today's daily coaching message
            today = date.today()
            stmt = text("""
                SELECT message, category, created_at 
                FROM mentor_messages 
                WHERE user_id = :user_id AND category = 'daily_coaching' AND created_at >= NOW() - INTERVAL '1 day'
                ORDER BY created_at DESC 
                LIMIT 1
            """)
            res = await self.db.execute(stmt, {"user_id": user_id})
            row = res.fetchone()
            if row:
                return {
                    "message": row[0],
                    "category": row[1],
                    "created_at": row[2].isoformat()
                }

            # Generate new message
            context = await self.context_service.get_user_context(user_id)
            
            provider = LLMProviderFactory.get_provider()
            prompt = f"""
You are the user's Personal AI Mentor. Generate a beautiful, daily coaching reflection to motivate the user.
Context:
- User's Focus score: {context['focus_score']}/100
- Goals: {[g['title'] for g in context['goals']]}

Format your response as a single JSON object containing:
- "message": A 4-5 sentence coaching reflection. Make it feel extremely premium, warm, personal, and encouraging (e.g. "Good Evening Revanth. You completed 85% of today's mission. Strong progress. Your consistency improved by 12% this week... Keep your focus blocks uninterrupted.").

Return ONLY the raw JSON. Do not include markdown backticks.
"""
            res_llm = await provider.generate(
                messages=[{"role": "user", "content": prompt}],
                model="gemini-2.5-flash",
                temperature=0.4
            )
            text_resp = res_llm.get("text", "").strip()

            if "```" in text_resp:
                parts = text_resp.split("```")
                for part in parts:
                    cleaned = part.strip()
                    if cleaned.startswith("json"):
                        cleaned = cleaned[4:].strip()
                    if cleaned.startswith("{") and cleaned.endswith("}"):
                        text_resp = cleaned
                        break

            data = json.loads(text_resp)
            message = data.get("message", "Keep focus blocks uninterrupted and work steadily toward your targets.")

            # Save to db
            stmt_insert = text("""
                INSERT INTO mentor_messages (user_id, message, category)
                VALUES (:user_id, :msg, 'daily_coaching')
            """)
            await self.db.execute(stmt_insert, {"user_id": user_id, "msg": message})
            await self.db.commit()

            return {
                "message": message,
                "category": "daily_coaching",
                "created_at": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error generating mentor coaching: {str(e)}", exc_info=True)
            return {
                "message": "Consistency is key. Tackle your priority tasks first thing tomorrow and keep focus blocks uninterrupted.",
                "category": "daily_coaching",
                "created_at": datetime.now().isoformat()
            }
