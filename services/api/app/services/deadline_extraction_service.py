import logging
import json
from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.llm.providers.factory import LLMProviderFactory

logger = logging.getLogger("mentorai-os.services.deadline_extraction_service")

class DeadlineExtractionService:
    """Uses Gemini to extract deadlines from emails and create corresponding workspace tasks."""

    def __init__(self):
        self.provider = LLMProviderFactory.get_provider()

    async def extract_and_create_deadline(
        self,
        db: AsyncSession,
        user_id: str,
        email_thread_id: str,
        subject: str,
        body: str
    ) -> Optional[Dict[str, Any]]:
        """Parses email content, saves structured deadlines, and generates lifesaver tasks."""
        current_time_str = datetime.now().isoformat()
        prompt = f"""
You are an expert deadline extraction agent. Analyze the email thread details below:
- Subject: {subject}
- Body: {body}
- Today's date/time: {current_time_str}

Extract any specific submission deadlines, payment due dates, interview timings, assessment windows, or event dates mentioned in the email.
Provide your response in a structured format. Convert relative dates (e.g. "by Friday", "in 3 days") into concrete ISO 8601 datetime strings relative to today's date ({current_time_str}).

Return a STRICT JSON response with the following keys:
1. "has_deadline": Boolean (true if a clear deadline or scheduled event time exists, false otherwise).
2. "title": String (A concise title for the deadline task, e.g. "Amazon Assessment Deadline").
3. "description": String (A short description of what needs to be done).
4. "deadline_date": String in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ) or null if none.
5. "location": String or null.
6. "meeting_link": String or null (URL for HackerRank, Zoom, Google Meet, etc.).

Ensure the response is STRICT valid JSON with NO markdown fences.
"""
        try:
            res_llm = await self.provider.generate(
                messages=[{"role": "user", "content": prompt}],
                model="gemini-2.0-flash",
                temperature=0.1
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
            if not parsed.get("has_deadline") or not parsed.get("deadline_date"):
                return None

            deadline_date_str = parsed.get("deadline_date")
            # Parse ISO datetime
            try:
                # Replace Z with +00:00 for python's fromisoformat
                cleaned_dt = deadline_date_str.replace("Z", "+00:00")
                deadline_dt = datetime.fromisoformat(cleaned_dt)
            except Exception:
                deadline_dt = datetime.now() + timedelta(days=2) # default fallback

            task_title = parsed.get("title", f"Deadline: {subject}")
            task_desc = parsed.get("description", f"Extracted from email: {subject}")
            task_id = None
            dl_id = None

            async with db.begin_nested():
                # 1. Create the task in lifesaver_tasks first
                stmt_task = text("""
                    INSERT INTO lifesaver_tasks (user_id, title, description, priority, status, due_date)
                    VALUES (CAST(:user_id AS uuid), :title, :description, 'high', 'pending', :due_date)
                    RETURNING id
                """)
                res_task = await db.execute(stmt_task, {
                    "user_id": user_id,
                    "title": task_title,
                    "description": task_desc,
                    "due_date": deadline_dt
                })
                row_task = res_task.fetchone()
                task_id = str(row_task[0]) if row_task else None

                # 2. Insert into email_deadlines
                stmt_deadline = text("""
                    INSERT INTO email_deadlines (user_id, email_thread_id, title, description, deadline_date, location, meeting_link, status, task_id)
                    VALUES (CAST(:user_id AS uuid), CAST(:email_thread_id AS uuid), :title, :description, :deadline_date, :location, :meeting_link, 'task_created', CAST(:task_id AS uuid))
                    RETURNING id
                """)
                res_dl = await db.execute(stmt_deadline, {
                    "user_id": user_id,
                    "email_thread_id": email_thread_id,
                    "title": task_title,
                    "description": task_desc,
                    "deadline_date": deadline_dt,
                    "location": parsed.get("location"),
                    "meeting_link": parsed.get("meeting_link"),
                    "task_id": task_id
                })
                row_dl = res_dl.fetchone()
                dl_id = str(row_dl[0]) if row_dl else None

                # 3. Log agent activity for task creation
                stmt_log = text("""
                    INSERT INTO agent_activity_logs (user_id, activity_type, description, metadata)
                    VALUES (CAST(:user_id AS uuid), 'task_generated', :desc, :meta)
                """)
                await db.execute(stmt_log, {
                    "user_id": user_id,
                    "desc": f"Autonomously created task '{task_title}' from email deadline.",
                    "meta": json.dumps({"task_id": task_id, "deadline_id": dl_id})
                })

            return {
                "deadline_id": dl_id,
                "task_id": task_id,
                "title": task_title,
                "deadline_date": deadline_dt.isoformat()
            }

        except Exception as e:
            logger.error(f"Error extracting deadline: {str(e)}", exc_info=True)
            return None
