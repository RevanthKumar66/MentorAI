import logging
import json
import asyncio
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.llm.providers.factory import LLMProviderFactory
from app.services.agent_context_service import AgentContextService
from app.services.notification_service import NotificationService

logger = logging.getLogger("mentorai-os.services.agent_monitoring_service")

class AgentMonitoringService:
    """Monitors user context in real time, emits signals, triggers notifications, and acts autonomously."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.context_service = AgentContextService(db)
        self.notif_service = NotificationService(db)

    async def evaluate_user_productivity(self, user_id: str, email: Optional[str] = None) -> Dict[str, Any]:
        """Runs the monitoring loop: analyzes context, generates signals, delivers alerts, and runs AI triggers."""
        try:
            # 1. Fetch user context
            context = await self.context_service.get_user_context(user_id)
            goals = context.get("goals", [])
            tasks = context.get("tasks", [])
            events = context.get("calendar_events", [])
            risks = context.get("risks", [])
            
            signals = []
            activity_entries = []
            now = datetime.now()
            today = date.today()

            # Rule 1: Detect Missed Tasks
            missed_tasks = []
            for t in tasks:
                if t.get("status") != "completed" and t.get("due_date"):
                    try:
                        due_date_clean = t["due_date"].replace("Z", "+00:00")
                        due = datetime.fromisoformat(due_date_clean).date() if "T" in due_date_clean else date.fromisoformat(due_date_clean)
                        if due < today:
                            missed_tasks.append(t)
                    except Exception:
                        pass
            
            if missed_tasks:
                signals.append({
                    "signal_type": "deadline_approaching",
                    "severity": "high",
                    "title": f"{len(missed_tasks)} Overdue Tasks Detected",
                    "description": f"You have {len(missed_tasks)} tasks that are past their due dates. Consider rescheduling them to avoid goal failure.",
                    "metadata": {"task_ids": [t["id"] for t in missed_tasks]}
                })
                # Check for escalation: if there was a notification in the last 24h and tasks are still pending, escalate
                escalate_check = text("""
                    SELECT id FROM agent_notifications 
                    WHERE user_id = :user_id AND category = 'missed_task' AND sent_at > NOW() - INTERVAL '1 day'
                """)
                res_esc = await self.db.execute(escalate_check, {"user_id": user_id})
                if res_esc.fetchone():
                    # Send escalation alert!
                    await self.notif_service.create_notification(
                        user_id=user_id,
                        category="critical_deadline",
                        title="⚠️ Critical Productivity Escalation",
                        body=f"Attention: Missed tasks remain unresolved. Let's schedule a focus block to execute '{missed_tasks[0]['title']}' immediately.",
                        channels=["in_app", "email"],
                        email_to=email
                    )
                else:
                    await self.notif_service.create_notification(
                        user_id=user_id,
                        category="missed_task",
                        title="Missed Tasks Alert",
                        body=f"Momentum AI detected that you missed your deadline for: '{missed_tasks[0]['title']}'. Let's reschedule.",
                        channels=["in_app"]
                    )

            # Rule 2: Goal Risk Increased
            high_risk_goals = [r for r in risks if r["risk_score"] > 70]
            for rg in high_risk_goals:
                signals.append({
                    "signal_type": "goal_risk_increased",
                    "severity": "critical",
                    "title": "Goal Completion Risk Elevated",
                    "description": f"The goal '{rg.get('forecast_summary', '')}' has high execution risk ({rg['risk_score']}%). A recovery plan is recommended.",
                    "metadata": {"goal_id": rg["goal_id"], "risk_score": rg["risk_score"]}
                })
                
                # Check if recovery plan exists
                rec_check = text("SELECT id FROM lifesaver_recovery_plans WHERE goal_id = :goal_id AND user_id = :user_id")
                res_rec = await self.db.execute(rec_check, {"goal_id": rg["goal_id"], "user_id": user_id})
                if not res_rec.fetchone():
                    # Autonomously generate recovery plan!
                    await self.notif_service.create_notification(
                        user_id=user_id,
                        category="recovery_plan",
                        title="Recovery Plan Suggested",
                        body=f"Your goal completion probability is dropping. Generate a recovery plan for '{rg['goal_id']}' now.",
                        channels=["in_app", "email"],
                        email_to=email
                    )

            # Rule 3: Calendar Conflicts
            conflicts = []
            for ev in events:
                ev_start_str = ev.get("start_time")
                if not ev_start_str:
                    continue
                try:
                    ev_start = datetime.fromisoformat(ev_start_str.replace("Z", "+00:00"))
                    for t in tasks:
                        if t.get("status") != "completed" and t.get("due_date"):
                            t_due_str = t["due_date"].replace("Z", "+00:00")
                            t_due = datetime.fromisoformat(t_due_str) if "T" in t_due_str else datetime.combine(date.fromisoformat(t_due_str), datetime.min.time())
                            # Simple conflict: due date/time overlaps event time
                            if abs((t_due - ev_start).total_seconds()) < 1800: # 30 min window
                                conflicts.append((t, ev))
                except Exception:
                    pass

            if conflicts:
                signals.append({
                    "signal_type": "calendar_conflict",
                    "severity": "medium",
                    "title": "Calendar Conflict Detected",
                    "description": f"Task '{conflicts[0][0]['title']}' overlaps with calendar event '{conflicts[0][1]['title']}'.",
                    "metadata": {"task_id": conflicts[0][0]["id"], "event_title": conflicts[0][1]["title"]}
                })

            # Save signals to DB
            for sig in signals:
                stmt_sig = text("""
                    INSERT INTO agent_signals (user_id, signal_type, severity, title, description, status, metadata)
                    VALUES (:user_id, :signal_type, :severity, :title, :description, 'active', :metadata)
                """)
                await self.db.execute(stmt_sig, {
                    "user_id": user_id,
                    "signal_type": sig["signal_type"],
                    "severity": sig["severity"],
                    "title": sig["title"],
                    "description": sig["description"],
                    "metadata": json.dumps(sig["metadata"])
                })
                
                # Activity log
                stmt_act = text("""
                    INSERT INTO agent_activity_logs (user_id, activity_type, description, metadata)
                    VALUES (:user_id, :activity_type, :description, :metadata)
                """)
                await self.db.execute(stmt_act, {
                    "user_id": user_id,
                    "activity_type": "risk_alert_generated" if sig["signal_type"] == "goal_risk_increased" else "calendar_conflict_detected",
                    "description": sig["title"],
                    "metadata": json.dumps(sig["metadata"])
                })

            await self.db.commit()

            # 4. Trigger Autonomous AI Actions
            await self._run_context_triggers(user_id, context, email)

            return {
                "success": True,
                "signals_count": len(signals),
                "signals": signals
            }

        except Exception as e:
            logger.error(f"Error evaluating user productivity: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    async def _run_context_triggers(self, user_id: str, context: Dict[str, Any], email: Optional[str] = None):
        """AI-powered context triggers: Interview -> Prep Goal, Exam -> Study Plan, etc."""
        events = context.get("calendar_events", [])
        tasks = context.get("tasks", [])
        goals = context.get("goals", [])
        
        # Build prompt listing the events
        events_str = "\n".join(
            f"- Event: {e['title']} (Start: {e['start_time']}, Location: {e['location']})"
            for e in events
        )

        prompt = f"""
You are the AI Chief of Staff. Analyze the user's upcoming calendar events and determine if we should autonomously trigger one of the following productivity actions:
1. "Interview Prep": If an interview (e.g. Amazon, Google, Coding Interview) is detected in the next 14 days and the user doesn't already have an active interview preparation goal.
2. "Meeting Prep Checklist": If an important client, standup, or design review meeting is scheduled and there's no preparation checklist.
3. "Study Plan": If an exam, mid-term, test, or certification is coming up.
4. "Bill Payment Task": If a bill payment, credit card, utility, or subscription payment is mentioned.
5. "Job Submission Checklist": If a job application deadline is listed.

Upcoming Calendar Events:
{events_str if events else "No upcoming events."}

Active Goals:
{', '.join([g['title'] for g in goals]) if goals else "None."}

Return a valid JSON list of objects representing autonomous actions to execute. Each object must have:
- "trigger_type": "interview_prep", "meeting_prep", "study_plan", "bill_payment", or "job_submission"
- "goal_title": string (the goal to create, if applicable, e.g. "Google Interview Preparation")
- "tasks": a list of task objects to create. Each task object has:
  - "title": string (e.g. "Solve Binary Search Practice", "Draft presentation slides", "Pay Internet Bill")
  - "description": string
  - "priority": "high", "medium", or "low"
  - "days_offset": integer (due date offset in days from today, e.g., 2, 3)

Return ONLY the raw JSON list. If no triggers match, return []. Do not wrap in markdown tags.
"""
        provider = LLMProviderFactory.get_provider()
        try:
            res_llm = await provider.generate(
                messages=[{"role": "user", "content": prompt}],
                model="gemini-2.5-flash",
                temperature=0.2
            )
            text_resp = res_llm.get("text", "").strip()
            
            # Simple cleanup
            if text_resp.startswith("```"):
                parts = text_resp.split("```")
                for part in parts:
                    cleaned = part.strip()
                    if cleaned.startswith("json"):
                        cleaned = cleaned[4:].strip()
                    if cleaned.startswith("[") and cleaned.endswith("]"):
                        text_resp = cleaned
                        break

            actions = json.loads(text_resp)
            if not isinstance(actions, list):
                actions = []

            for action in actions:
                trigger_type = action.get("trigger_type")
                goal_title = action.get("goal_title")
                action_tasks = action.get("tasks", [])

                if not action_tasks:
                    continue

                goal_id = None
                if goal_title:
                    # Check if goal already exists
                    exist_query = text("SELECT id FROM lifesaver_goals WHERE user_id = :user_id AND title = :title")
                    res_exist = await self.db.execute(exist_query, {"user_id": user_id, "title": goal_title})
                    row = res_exist.fetchone()
                    if row:
                        goal_id = str(row[0])
                    else:
                        # Insert goal
                        stmt_goal = text("""
                            INSERT INTO lifesaver_goals (user_id, title, category, target_date, status, goal_health, risk_score)
                            VALUES (:user_id, :title, 'Career', :target, 'active', 'ON_TRACK', 0)
                            RETURNING id
                        """)
                        target = (date.today() + timedelta(days=14)).isoformat()
                        res_goal = await self.db.execute(stmt_goal, {"user_id": user_id, "title": goal_title, "target": target})
                        row_goal = res_goal.fetchone()
                        if row_goal:
                            goal_id = str(row_goal[0])
                        
                        # Log activity feed
                        stmt_log = text("""
                            INSERT INTO agent_activity_logs (user_id, activity_type, description, metadata)
                            VALUES (:user_id, 'task_generated', :desc, :meta)
                        """)
                        await self.db.execute(stmt_log, {
                            "user_id": user_id,
                            "desc": f"Autonomously generated goal: '{goal_title}'",
                            "meta": json.dumps({"goal_title": goal_title, "trigger_type": trigger_type})
                        })

                # Create tasks
                for t in action_tasks:
                    # Check if task already exists
                    task_exist = text("SELECT id FROM lifesaver_tasks WHERE user_id = :user_id AND title = :title")
                    res_t_exist = await self.db.execute(task_exist, {"user_id": user_id, "title": t["title"]})
                    if res_t_exist.fetchone():
                        continue

                    stmt_task = text("""
                        INSERT INTO lifesaver_tasks (user_id, goal_id, title, description, priority, status, due_date)
                        VALUES (:user_id, :goal_id, :title, :description, :priority, 'pending', :due)
                    """)
                    due_date = (date.today() + timedelta(days=t.get("days_offset", 1))).isoformat()
                    await self.db.execute(stmt_task, {
                        "user_id": user_id,
                        "goal_id": goal_id,
                        "title": t["title"],
                        "description": t["description"],
                        "priority": t["priority"],
                        "due": due_date
                    })

                    # Log activity feed
                    stmt_log_t = text("""
                        INSERT INTO agent_activity_logs (user_id, activity_type, description, metadata)
                        VALUES (:user_id, 'task_generated', :desc, :meta)
                    """)
                    await self.db.execute(stmt_log_t, {
                        "user_id": user_id,
                        "desc": f"Autonomously scheduled task: '{t['title']}'",
                        "meta": json.dumps({"task_title": t["title"], "trigger_type": trigger_type})
                    })

                # Notify user of autonomous generation
                await self.notif_service.create_notification(
                    user_id=user_id,
                    category="interview" if trigger_type == "interview_prep" else "task",
                    title=f"Autonomous Setup: {goal_title or action_tasks[0]['title']}",
                    body=f"Momentum AI detected a {trigger_type.replace('_', ' ')} trigger on your calendar. I've automatically provisioned the relevant items.",
                    channels=["in_app", "email"],
                    email_to=email
                )

            await self.db.commit()

        except Exception as e:
            logger.error(f"Error in autonomous trigger evaluation: {str(e)}", exc_info=True)
            await self.db.rollback()
