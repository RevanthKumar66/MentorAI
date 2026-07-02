import logging
import json
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.llm.providers.factory import LLMProviderFactory

logger = logging.getLogger("mentorai-os.services.reply_draft_service")

class ReplyDraftService:
    """Uses Gemini to generate draft replies for recruiter communications and meeting requests."""

    def __init__(self):
        self.provider = LLMProviderFactory.get_provider()

    async def create_reply_draft(
        self,
        db: AsyncSession,
        user_id: str,
        email_thread_id: str,
        subject: str,
        sender: str,
        body: str,
        category: str,
        force: bool = False
    ) -> Optional[Dict[str, Any]]:
        """Generates a professional response draft, inserts it into email_drafts, and logs the action."""
        
        # Skip spam, promotions, newsletters, and low priority categories unless forced
        if not force and category in ["Spam", "Promotion", "Newsletter", "Other"]:
            logger.info(f"Skipping draft reply generation for category '{category}'")
            return None

        prompt = f"""
You are a highly professional Chief of Staff assistant. Your task is to draft a polished response to the following email:
- Subject: {subject}
- From: {sender}
- Email Body: {body}
- Category: {category}

Generate an appropriate response draft. Guidelines:
- For 'Interview' or 'Meeting': Acknowledge receipt, express enthusiasm, and confirm availability or propose scheduling slots (simulate standard availability).
- For 'Assessment' or 'Assignment': Acknowledge receipt, confirm you will take it before the deadline, and thank them.
- For 'Job Opportunity': Show interest in the role, highlight that you look forward to discussing further, and offer to share resumes/portfolios.
- For 'Other', 'Newsletter', 'Promotion', or any other category: Write a polite, professional acknowledgement reply appropriate to the email content.
- Use a professional, confident, yet humble tone.

Return a STRICT JSON response with the following keys:
1. "reply_subject": String (A suitable response subject line, usually "Re: " + original subject).
2. "reply_body": String (The full body text of the response, including salutations and professional signature placeholder like "[Your Name]").
3. "recipient": String (The exact email address to reply to, extracted from '{sender}'. If no email address is visible, return the sender string as-is).

Ensure the response is STRICT valid JSON with NO markdown fences.
"""
        try:
            res_llm = await self.provider.generate(
                messages=[{"role": "user", "content": prompt}],
                model="gemini-2.0-flash",
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

            parsed = json.loads(text_resp)
            reply_subject = parsed.get("reply_subject", f"Re: {subject}")
            reply_body = parsed.get("reply_body")
            recipient = parsed.get("recipient", sender)

            if not reply_body:
                return None

            draft_id = None

            async with db.begin_nested():
                # 1. Insert into email_drafts
                stmt_draft = text("""
                    INSERT INTO email_drafts (user_id, email_thread_id, subject, recipient, draft_body, status)
                    VALUES (CAST(:user_id AS uuid), CAST(:email_thread_id AS uuid), :subject, :recipient, :body, 'pending')
                    RETURNING id
                """)
                res_draft = await db.execute(stmt_draft, {
                    "user_id": user_id,
                    "email_thread_id": email_thread_id,
                    "subject": reply_subject,
                    "recipient": recipient,
                    "body": reply_body
                })
                row_draft = res_draft.fetchone()
                draft_id = str(row_draft[0]) if row_draft else None

                # 2. Log activity
                stmt_log = text("""
                    INSERT INTO agent_activity_logs (user_id, activity_type, description, metadata)
                    VALUES (CAST(:user_id AS uuid), 'draft_created', :desc, :meta)
                """)
                await db.execute(stmt_log, {
                    "user_id": user_id,
                    "desc": f"Generated AI reply draft for email thread '{subject}' from '{sender}'.",
                    "meta": json.dumps({"draft_id": draft_id, "recipient": recipient})
                })

            return {
                "draft_id": draft_id,
                "recipient": recipient,
                "subject": reply_subject,
                "body": reply_body
            }

        except Exception as e:
            logger.error(f"Error creating reply draft: {str(e)}", exc_info=True)
            return None
