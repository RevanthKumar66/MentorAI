import logging
import httpx
import json
import base64
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.services.email_classification_service import EmailClassificationService
from app.services.opportunity_detection_service import OpportunityDetectionService
from app.services.deadline_extraction_service import DeadlineExtractionService
from app.services.reply_draft_service import ReplyDraftService

logger = logging.getLogger("mentorai-os.services.email_sync_service")

class EmailSyncService:
    """Orchestrates fetching emails from Gmail API or mock service, classifies them, and runs AI agents."""

    def __init__(self):
        self.classifier = EmailClassificationService()
        self.opportunity_detector = OpportunityDetectionService()
        self.deadline_extractor = DeadlineExtractionService()
        self.reply_drafter = ReplyDraftService()

    async def sync_emails(self, db: AsyncSession, user_id: str) -> Dict[str, Any]:
        """Runs the email synchronization loop and AI processing pipeline for the user."""
        try:
            # 1. Retrieve connection and login email
            stmt = text("""
                SELECT provider, email, access_token, refresh_token 
                FROM calendar_connections 
                WHERE user_id = CAST(:user_id AS uuid)
            """)
            res = await db.execute(stmt, {"user_id": user_id})
            row = res.fetchone()

            stmt_user = text("SELECT email FROM users WHERE id = CAST(:user_id AS uuid)")
            res_user = await db.execute(stmt_user, {"user_id": user_id})
            row_user = res_user.fetchone()
            login_email = row_user[0] if row_user else None

            user_email = row[1] if row else login_email

            if not row:
                logger.info(f"No Google Workspace Connection found for user {user_id}. Proceeding with mock sync...")
                success, actions = await self._run_mock_sync(db, user_id, user_email)
                return {"success": success, "synced": success, "actions": actions}

            provider, email, access_token, refresh_token = row
            if provider != "google":
                logger.info(f"Workspace connection is not Google ({provider}). Skipping sync.")
                return {"success": False, "synced": False, "actions": []}

            # If it's a mock token, trigger mock sync
            if access_token.startswith("mock_"):
                logger.info(f"Mock token detected for user {user_id}. Running mock email sync...")
                success, actions = await self._run_mock_sync(db, user_id, user_email)
                return {"success": success, "synced": success, "actions": actions}

            # Otherwise, sync using the real Gmail API
            success, actions = await self._run_real_sync(db, user_id, access_token, refresh_token, user_email)
            return {"success": success, "synced": success, "actions": actions}

        except Exception as e:
            logger.error(f"Failed to sync emails: {str(e)}", exc_info=True)
            return {"success": False, "synced": False, "actions": []}

    async def _run_real_sync(
        self,
        db: AsyncSession,
        user_id: str,
        access_token: str,
        refresh_token: Optional[str],
        user_email: Optional[str]
    ) -> tuple[bool, list[dict]]:
        """Fetches and triages real emails from Google Gmail API."""
        headers = {"Authorization": f"Bearer {access_token}"}
        url = "https://www.googleapis.com/gmail/v1/users/me/threads"
        params = {"maxResults": 15}
        actions = []

        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(url, headers=headers, params=params)

                # Attempt token refresh on 401
                if res.status_code == 401 and refresh_token:
                    logger.info("Access token expired. Refreshing OAuth token...")
                    from app.modules.lifesaver.api import refresh_google_access_token
                    new_token = await refresh_google_access_token(db, user_id, refresh_token)
                    if new_token:
                        headers["Authorization"] = f"Bearer {new_token}"
                        res = await client.get(url, headers=headers, params=params)

                if res.status_code != 200:
                    logger.error(f"Gmail API list threads failed: {res.status_code} - {res.text}")
                    return False, []

                threads_data = res.json().get("threads", [])
                for thread in threads_data:
                    thread_id = thread.get("id")
                    
                    # Check if already processed
                    stmt_check = text("SELECT id FROM email_threads WHERE thread_id = :tid AND user_id = CAST(:uid AS uuid)")
                    check_res = await db.execute(stmt_check, {"tid": thread_id, "uid": user_id})
                    if check_res.fetchone():
                        continue  # skip already synced threads

                    # Fetch thread details
                    thread_url = f"https://www.googleapis.com/gmail/v1/users/me/threads/{thread_id}"
                    t_res = await client.get(thread_url, headers=headers)
                    if t_res.status_code != 200:
                        continue

                    thread_details = t_res.json()
                    messages = thread_details.get("messages", [])
                    if not messages:
                        continue

                    # Process last message in thread
                    last_msg = messages[-1]
                    snippet = last_msg.get("snippet", "")
                    
                    # Extract headers
                    headers_list = last_msg.get("payload", {}).get("headers", [])
                    subject = next((h.get("value") for h in headers_list if h.get("name").lower() == "subject"), "No Subject")
                    sender = next((h.get("value") for h in headers_list if h.get("name").lower() == "from"), "Unknown Sender")
                    date_str = next((h.get("value") for h in headers_list if h.get("name").lower() == "date"), None)

                    # Extract body text
                    body = self._extract_body(last_msg.get("payload", {})) or snippet

                    msg_date = datetime.now(timezone.utc)
                    if date_str:
                        try:
                            # Simple date parser fallback
                            import email.utils
                            parsed_date = email.utils.parsedate_to_datetime(date_str)
                            msg_date = parsed_date
                        except Exception:
                            pass

                    # Process email through AI classification & extraction pipeline
                    action = await self._process_email_pipeline(db, user_id, thread_id, subject, sender, snippet, body, msg_date, user_email)
                    if action:
                        actions.append(action)

            return True, actions

        except Exception as e:
            logger.error(f"Gmail API integration sync failed: {str(e)}", exc_info=True)
            return False, []

    def _extract_body(self, payload: Dict[str, Any]) -> str:
        """Recursively parses Gmail payload parts to extract plaintext body content."""
        mime_type = payload.get("mimeType", "")
        body_data = payload.get("body", {}).get("data", "")

        if mime_type == "text/plain" and body_data:
            try:
                return base64.urlsafe_b64decode(body_data.encode("UTF-8")).decode("UTF-8")
            except Exception:
                pass

        parts = payload.get("parts", [])
        for part in parts:
            extracted = self._extract_body(part)
            if extracted:
                return extracted

        return ""

    async def _run_mock_sync(self, db: AsyncSession, user_id: str, user_email: Optional[str]) -> tuple[bool, list[dict]]:
        """Injects high-quality mock data for testing Sprint 8 functionality."""
        logger.info(f"Injecting mock workspace emails for user {user_id}")
        actions = []

        mock_threads = [
            {
                "thread_id": "mock_thread_amazon_assessment",
                "subject": "Amazon SDE Online Assessment invitation",
                "sender": "Amazon Student Recruiting <recruitment@amazon.com>",
                "snippet": "Please complete your Amazon SDE Coding Assessment before June 28, 2026...",
                "body": "Hello candidate, we are pleased to invite you to the Amazon Software Development Engineer online coding assessment. This is a 90-minute assessment testing algorithms, data structures, and system design concepts. You MUST complete the test before Friday, June 28, 2026 at 11:59 PM PST. Link: https://hackerrank.com/amazon-sde-oa-candidate",
                "date": datetime.now(timezone.utc) - timedelta(hours=2)
            },
            {
                "thread_id": "mock_thread_google_interview",
                "subject": "Google Technical Interview Details",
                "sender": "Google Careers <staffing@google.com>",
                "snippet": "We are excited to schedule your Technical Interview for Monday, June 29, 2026...",
                "body": "Hi, thank you for your interest in Google. We have scheduled your 45-minute technical Google interview on Monday, June 29, 2026 at 10:00 AM PST. The interview will be hosted on Google Meet: https://meet.google.com/abc-defg-hij. Let us know if you have any questions.",
                "date": datetime.now(timezone.utc) - timedelta(hours=5)
            },
            {
                "thread_id": "mock_thread_tldr_newsletter",
                "subject": "TLDR Web Dev: Why Clean Code is a Trap",
                "sender": "TLDR Web Dev <newsletter@tldr.com>",
                "snippet": "A deep dive into clean coding patterns and performance, scaling with Rust...",
                "body": "Hey developers! Today we cover standard anti-patterns in TypeScript, scaling backend services using Rust, and how new LLM agents are changing coding workflows. Read more at https://tldr.com/article1",
                "date": datetime.now(timezone.utc) - timedelta(hours=14)
            },
            {
                "thread_id": "mock_thread_spam_deals",
                "subject": "Mega Sale: 90% OFF on courses TODAY ONLY",
                "sender": "Awesome Learning Center <promo@awesomelearning.com>",
                "snippet": "Get certified in AI and Web Development at 90% off. Claim your discount...",
                "body": "Hurry! Get all our certifications and training programs at a massive 90% discount. Click here to purchase now before the sale ends at midnight.",
                "date": datetime.now(timezone.utc) - timedelta(days=1)
            }
        ]

        for mock in mock_threads:
            # Check if thread exists
            stmt_check = text("SELECT id FROM email_threads WHERE thread_id = :tid AND user_id = CAST(:uid AS uuid)")
            check_res = await db.execute(stmt_check, {"tid": mock["thread_id"], "uid": user_id})
            if check_res.fetchone():
                continue

            action = await self._process_email_pipeline(
                db,
                user_id,
                mock["thread_id"],
                mock["subject"],
                mock["sender"],
                mock["snippet"],
                mock["body"],
                mock["date"],
                user_email
            )
            if action:
                actions.append(action)

        return True, actions

    async def _process_email_pipeline(
        self,
        db: AsyncSession,
        user_id: str,
        thread_id: str,
        subject: str,
        sender: str,
        snippet: str,
        body: str,
        msg_date: datetime,
        user_email: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Orchestrates the downstream processing: classification, opportunity, deadlines, triage, and reply drafts."""
        try:
            # 1. Classify Email
            classification = await self.classifier.classify_email(subject, sender, body)
            category = classification["category"]
            priority_score = classification["priority_score"]
            urgency_reason = classification["urgency_reason"]

            # 2. Insert into email_threads
            stmt_insert = text("""
                INSERT INTO email_threads (user_id, thread_id, subject, sender, snippet, body, category, priority_score, urgency_reason, is_read, last_message_date)
                VALUES (CAST(:user_id AS uuid), :thread_id, :subject, :sender, :snippet, :body, :category, :priority, :reason, false, :msg_date)
                RETURNING id
            """)
            res_insert = await db.execute(stmt_insert, {
                "user_id": user_id,
                "thread_id": thread_id,
                "subject": subject,
                "sender": sender,
                "snippet": snippet,
                "body": body,
                "category": category,
                "priority": priority_score,
                "reason": urgency_reason,
                "msg_date": msg_date
            })
            row_thread = res_insert.fetchone()
            if not row_thread:
                return None
            thread_uuid = str(row_thread[0])

            await db.commit()

            # 3. Trigger Opportunity Detection Agent
            opp_res = await self.opportunity_detector.detect_and_create_opportunity(
                db, user_id, thread_uuid, subject, body
            )

            # 4. Trigger Deadline Extraction Agent
            dl_res = await self.deadline_extractor.extract_and_create_deadline(
                db, user_id, thread_uuid, subject, body
            )

            # 5. Trigger AI Reply Drafting Agent
            await self.reply_drafter.create_reply_draft(
                db, user_id, thread_uuid, subject, sender, body, category
            )

            # 6. Apply Triage rules
            await self._apply_triage_rules(db, user_id, thread_uuid, category, subject)

            # 7. Real-Time Reminders / Notifications
            from app.services.notification_service import NotificationService
            notif_service = NotificationService(db)

            if opp_res:
                opp_type = opp_res.get("opportunity_type", "Career Opportunity")
                goal_title = opp_res.get("goal_title", "Preparation Goal")
                tasks_count = opp_res.get("tasks_count", 0)
                
                notif_title = f"New Opportunity: {opp_type}"
                notif_body = f"Momentum AI detected a new {opp_type} from your email ('{subject}'). A preparation goal '{goal_title}' was autonomously created with {tasks_count} checklist tasks so you don't miss it."
                
                await notif_service.create_notification(
                    user_id=user_id,
                    category="opportunity_detected",
                    title=notif_title,
                    body=notif_body,
                    channels=["in_app", "email"],
                    email_to=user_email
                )

            if dl_res:
                dl_title = dl_res.get("title", "Task")
                dl_date_str = dl_res.get("deadline_date")
                try:
                    dt = datetime.fromisoformat(dl_date_str.replace("Z", "+00:00"))
                    formatted_date = dt.strftime("%b %d, %Y at %I:%M %p")
                except Exception:
                    formatted_date = str(dl_date_str)

                notif_title = "Critical Deadline Reminder"
                notif_body = f"Momentum AI extracted a critical deadline from your email ('{subject}'). Autonomously generated task: '{dl_title}' (Due: {formatted_date})."
                
                await notif_service.create_notification(
                    user_id=user_id,
                    category="critical_deadline",
                    title=notif_title,
                    body=notif_body,
                    channels=["in_app", "email"],
                    email_to=user_email
                )

            # 8. Log sync log
            stmt_log = text("""
                INSERT INTO email_activity_logs (user_id, action_type, description, email_thread_id)
                VALUES (CAST(:user_id AS uuid), 'sync', :desc, CAST(:thread_uuid AS uuid))
            """)
            await db.execute(stmt_log, {
                "user_id": user_id,
                "desc": f"Synchronized and triaged thread: '{subject}' (Category: {category}, Priority: {priority_score})",
                "thread_uuid": thread_uuid
            })
            await db.commit()

            return {
                "subject": subject,
                "sender": sender,
                "category": category,
                "priority_score": priority_score,
                "urgency_reason": urgency_reason,
                "opportunity_detected": opp_res is not None,
                "opp_details": opp_res,
                "deadline_extracted": dl_res is not None,
                "dl_details": dl_res,
                "draft_created": True
            }

        except Exception as e:
            logger.error(f"Error in processing email pipeline for thread {thread_id}: {str(e)}", exc_info=True)
            await db.rollback()
            return None

    async def _apply_triage_rules(
        self,
        db: AsyncSession,
        user_id: str,
        thread_uuid: str,
        category: str,
        subject: str
    ):
        """Applies configured triage rules (e.g. auto archive, delete, label) onto new threads."""
        try:
            # Query rules
            stmt_rules = text("""
                SELECT id, rule_name, action 
                FROM email_triage_rules 
                WHERE user_id = CAST(:user_id AS uuid) 
                  AND category_filter = :category 
                  AND is_active = true
            """)
            res_rules = await db.execute(stmt_rules, {"user_id": user_id, "category": category})
            rules = res_rules.fetchall()

            async with db.begin_nested():
                for rule in rules:
                    rule_id, rule_name, action = rule

                    if action == "auto_archive":
                        stmt_archive = text("""
                            UPDATE email_threads 
                            SET is_read = true, updated_at = now() 
                            WHERE id = CAST(:thread_uuid AS uuid)
                        """)
                        await db.execute(stmt_archive, {"thread_uuid": thread_uuid})
                        # Add label "ARCHIVED"
                        stmt_label = text("""
                            INSERT INTO email_labels (user_id, email_thread_id, label_name)
                            VALUES (CAST(:user_id AS uuid), CAST(:thread_uuid AS uuid), 'ARCHIVED')
                        """)
                        await db.execute(stmt_label, {"user_id": user_id, "thread_uuid": thread_uuid})

                    elif action == "auto_delete":
                        stmt_delete = text("""
                            DELETE FROM email_threads 
                            WHERE id = CAST(:thread_uuid AS uuid)
                        """)
                        await db.execute(stmt_delete, {"thread_uuid": thread_uuid})
                        # Log activity
                        stmt_log = text("""
                            INSERT INTO email_activity_logs (user_id, action_type, description)
                            VALUES (CAST(:user_id AS uuid), 'triage_applied', :desc)
                        """)
                        await db.execute(stmt_log, {
                            "user_id": user_id,
                            "desc": f"Triage Rule '{rule_name}' applied: Auto-deleted thread '{subject}'"
                        })
                        break # thread deleted, stop further rules

                    elif action == "auto_label":
                        stmt_label = text("""
                            INSERT INTO email_labels (user_id, email_thread_id, label_name)
                            VALUES (CAST(:user_id AS uuid), CAST(:thread_uuid AS uuid), :label)
                        """)
                        await db.execute(stmt_label, {"user_id": user_id, "thread_uuid": thread_uuid, "label": category.upper()})

                    elif action == "auto_star":
                        stmt_label = text("""
                            INSERT INTO email_labels (user_id, email_thread_id, label_name)
                            VALUES (CAST(:user_id AS uuid), CAST(:thread_uuid AS uuid), 'STARRED')
                        """)
                        await db.execute(stmt_label, {"user_id": user_id, "thread_uuid": thread_uuid})

                    elif action == "mark_read":
                        stmt_read = text("""
                            UPDATE email_threads 
                            SET is_read = true, updated_at = now() 
                            WHERE id = CAST(:thread_uuid AS uuid)
                        """)
                        await db.execute(stmt_read, {"thread_uuid": thread_uuid})

                    # Log activity log
                    stmt_log = text("""
                        INSERT INTO email_activity_logs (user_id, action_type, description, email_thread_id)
                        VALUES (CAST(:user_id AS uuid), 'triage_applied', :desc, CAST(:thread_uuid AS uuid))
                    """)
                    await db.execute(stmt_log, {
                        "user_id": user_id,
                        "desc": f"Applied Triage Rule '{rule_name}' ({action}) on '{subject}'",
                        "thread_uuid": thread_uuid
                    })

        except Exception as e:
            logger.error(f"Error applying triage rules for thread {thread_uuid}: {str(e)}", exc_info=True)

