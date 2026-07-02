import logging
import json
from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.llm.providers.factory import LLMProviderFactory

logger = logging.getLogger("mentorai-os.services.opportunity_detection_service")

class OpportunityDetectionService:
    """Uses Gemini to detect career/academic opportunities, and provisions goals and roadmaps."""

    def __init__(self):
        self.provider = LLMProviderFactory.get_provider()

    async def detect_and_create_opportunity(
        self,
        db: AsyncSession,
        user_id: str,
        email_thread_id: str,
        subject: str,
        body: str
    ) -> Optional[Dict[str, Any]]:
        """Scans email contents for opportunities, saving them and provisioning goals + task checklists."""
        prompt = f"""
You are an advanced AI Opportunity Detection Agent. Analyze this email details:
- Subject: {subject}
- Body: {body}

Determine if this email represents a concrete career, learning, or academic opportunity. This includes:
- Job Interview Invitations
- Coding Assessments (HackerRank, LeetCode, Codility, etc.)
- Job Applications acknowledgment or recruiter follow-ups
- Hackathons
- Conference invitations or Networking Events
- Certification programs or scholarships

If it IS an opportunity, construct a preparation roadmap.
Return a STRICT JSON response with the following keys:
1. "is_opportunity": Boolean (true if an opportunity is found, false otherwise).
2. "opportunity_type": String (one of: Job Opportunity, Interview, Assessment, Hackathon, Scholarship, Learning Program, Event, Other).
3. "company": String or null (e.g. "Google", "Amazon").
4. "role": String or null (e.g. "Software Engineer", "Frontend Developer").
5. "priority": Integer (1-100 score of relevance and urgency).
6. "goal_title": String (A professional goal name, e.g. "Prepare for Google Software Engineer Interview").
7. "suggested_action": String (Short action summary, e.g., "Create Goal & Generate Preparation Plan").
8. "confidence_score": Integer (1-100 accuracy metric).
9. "roadmap_tasks": An array of objects for tasks. Each task object must have:
   - "title": String (Concise task name, e.g. "Review Graph Algorithms").
   - "description": String (Brief task description).
   - "priority": String ("high", "medium", or "low").
   - "days_offset": Integer (Suggested due date offset in days from today, e.g., 2, 4, 7).

Ensure the response is STRICT valid JSON with NO markdown fences.
"""
        try:
            res_llm = await self.provider.generate(
                messages=[{"role": "user", "content": prompt}],
                model="gemini-2.0-flash",
                temperature=0.2
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

            parsed = json.loads(text_resp)
            if not parsed.get("is_opportunity"):
                return None

            goal_title = parsed.get("goal_title", f"Prepare for {subject}")
            opp_type = parsed.get("opportunity_type", "Job Opportunity")

            goal_id = None
            opp_id = None
            tasks_created = []

            async with db.begin_nested():
                # 1. Create/Retrieve Goal
                stmt_check_goal = text("SELECT id FROM lifesaver_goals WHERE user_id = CAST(:user_id AS uuid) AND title = :title")
                res_goal_check = await db.execute(stmt_check_goal, {"user_id": user_id, "title": goal_title})
                row_goal = res_goal_check.fetchone()

                if row_goal:
                    goal_id = str(row_goal[0])
                else:
                    stmt_goal = text("""
                        INSERT INTO lifesaver_goals (user_id, title, category, target_date, status, goal_health, risk_score)
                        VALUES (CAST(:user_id AS uuid), :title, :category, :target, 'active', 'ON_TRACK', 0)
                        RETURNING id
                    """)
                    # Set target date to 14 days from now
                    target_date = (date.today() + timedelta(days=14)).isoformat()
                    category = "Career" if opp_type in ["Job Opportunity", "Interview", "Assessment"] else "Learning"
                    
                    res_goal = await db.execute(stmt_goal, {
                        "user_id": user_id,
                        "title": goal_title,
                        "category": category,
                        "target": target_date
                    })
                    row_g = res_goal.fetchone()
                    if row_g:
                        goal_id = str(row_g[0])

                # 2. Insert into email_opportunities
                stmt_opp = text("""
                    INSERT INTO email_opportunities (user_id, email_thread_id, opportunity_type, company, role, priority, status, goal_id, suggested_action, confidence_score)
                    VALUES (CAST(:user_id AS uuid), CAST(:email_thread_id AS uuid), :opp_type, :company, :role, :priority, 'detected', CAST(:goal_id AS uuid), :suggested_action, :confidence)
                    RETURNING id
                """)
                res_opp = await db.execute(stmt_opp, {
                    "user_id": user_id,
                    "email_thread_id": email_thread_id,
                    "opp_type": opp_type,
                    "company": parsed.get("company"),
                    "role": parsed.get("role"),
                    "priority": int(parsed.get("priority", 50)),
                    "goal_id": goal_id,
                    "suggested_action": parsed.get("suggested_action"),
                    "confidence": int(parsed.get("confidence_score", 100))
                })
                row_opp = res_opp.fetchone()
                opp_id = str(row_opp[0]) if row_opp else None

                # 3. Create roadmap tasks under the goal
                roadmap_tasks = parsed.get("roadmap_tasks", [])
                for idx, t in enumerate(roadmap_tasks):
                    task_title = t.get("title", f"Preparation Step {idx+1}")
                    task_desc = t.get("description", "")
                    task_priority = t.get("priority", "medium")
                    days_offset = int(t.get("days_offset", 3))
                    due_date = datetime.now() + timedelta(days=days_offset)

                    # Check if task already exists
                    stmt_check_task = text("SELECT id FROM lifesaver_tasks WHERE user_id = CAST(:user_id AS uuid) AND goal_id = CAST(:goal_id AS uuid) AND title = :title")
                    res_t_check = await db.execute(stmt_check_task, {"user_id": user_id, "goal_id": goal_id, "title": task_title})
                    if res_t_check.fetchone():
                        continue

                    stmt_task = text("""
                        INSERT INTO lifesaver_tasks (user_id, goal_id, title, description, priority, status, due_date)
                        VALUES (CAST(:user_id AS uuid), CAST(:goal_id AS uuid), :title, :description, :priority, 'pending', :due_date)
                        RETURNING id
                    """)
                    res_t = await db.execute(stmt_task, {
                        "user_id": user_id,
                        "goal_id": goal_id,
                        "title": task_title,
                        "description": task_desc,
                        "priority": task_priority,
                        "due_date": due_date
                    })
                    row_t = res_t.fetchone()
                    if row_t:
                        tasks_created.append(str(row_t[0]))

                # 4. Log Activity log
                stmt_log = text("""
                    INSERT INTO agent_activity_logs (user_id, activity_type, description, metadata)
                    VALUES (CAST(:user_id AS uuid), 'opportunity_detected', :desc, :meta)
                """)
                await db.execute(stmt_log, {
                    "user_id": user_id,
                    "desc": f"Detected opportunity: {opp_type} from '{parsed.get('company', 'Recruiter')}'. Created goal '{goal_title}' with {len(tasks_created)} preparation tasks.",
                    "meta": json.dumps({"opportunity_id": opp_id, "goal_id": goal_id, "tasks_created": tasks_created})
                })

            return {
                "opportunity_id": opp_id,
                "goal_id": goal_id,
                "goal_title": goal_title,
                "opportunity_type": opp_type,
                "tasks_count": len(tasks_created)
            }

        except Exception as e:
            logger.error(f"Error in opportunity detection: {str(e)}", exc_info=True)
            return None
