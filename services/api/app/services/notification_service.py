import logging
import json
import httpx
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.config import settings

logger = logging.getLogger("mentorai-os.services.notification_service")

class NotificationService:
    """Manages multi-channel user alerts (In-App notifications and real-time email delivery)."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_notification(
        self,
        user_id: str,
        category: str,
        title: str,
        body: str,
        channels: List[str] = ["in_app"],
        email_to: Optional[str] = None
    ) -> Dict[str, Any]:
        """Creates a database notification and triggers downstream channels like Email."""
        try:
            now = datetime.now()
            
            # 1. Insert to agent_notifications table
            stmt = text("""
                INSERT INTO agent_notifications (user_id, category, title, body, channels, status, sent_at)
                VALUES (CAST(:user_id AS uuid), :category, :title, :body, :channels, 'unread', :now)
                RETURNING id, category, title, body, status, sent_at
            """)
            
            channels_json = json.dumps(channels)
            res = await self.db.execute(stmt, {
                "user_id": user_id,
                "category": category,
                "title": title,
                "body": body,
                "channels": channels_json,
                "now": now
            })
            row = res.fetchone()
            
            notif_id = str(row[0]) if row else None
            
            # Log agent activity feed for the sent notification
            log_stmt = text("""
                INSERT INTO agent_activity_logs (user_id, activity_type, description, metadata, timestamp)
                VALUES (CAST(:user_id AS uuid), :activity_type, :description, :metadata, :now)
            """)
            await self.db.execute(log_stmt, {
                "user_id": user_id,
                "activity_type": "notification_sent",
                "description": f"Notification Sent: {title}",
                "metadata": json.dumps({"notification_id": notif_id, "category": category}),
                "now": now
            })
            
            await self.db.commit()

            # 2. Process Email Channel if requested
            if "email" in channels and email_to:
                # We do this asynchronously to prevent API hangs
                await self.send_email_notification(notif_id, user_id, email_to, title, body)

            return {
                "id": notif_id,
                "category": category,
                "title": title,
                "body": body,
                "status": "unread",
                "sent_at": now.isoformat()
            }

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to create notification: {str(e)}", exc_info=True)
            raise e

    async def send_email_notification(
        self,
        notification_id: str,
        user_id: str,
        email_to: str,
        subject: str,
        body_text: str
    ) -> bool:
        """Delivers real-time email notifications using Resend API if API Key is configured."""
        resend_key = getattr(settings, "RESEND_API_KEY", None)
        
        # Look for environment variable directly if not on settings object
        if not resend_key:
            import os
            resend_key = os.getenv("RESEND_API_KEY")

        if not resend_key:
            logger.warning(f"[EMAIL MOCK] No RESEND_API_KEY set. Logged email to '{email_to}': Subject: '{subject}', Body: '{body_text}'")
            # Update database email sent timestamp anyway to represent mock success
            await self._update_email_status(notification_id)
            return True

        # Construct Email HTML content matching the gorgeous design specification
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {{
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0f172a;
              background-color: #f8fafc;
              margin: 0;
              padding: 24px;
            }}
            .card {{
              background-color: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 32px;
              max-width: 550px;
              margin: 0 auto;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            }}
            .logo {{
              font-weight: 700;
              font-size: 18px;
              color: #09090b;
              margin-bottom: 24px;
              display: flex;
              align-items: center;
              gap: 8px;
            }}
            .title {{
              font-size: 20px;
              font-weight: 600;
              color: #0f172a;
              margin-bottom: 12px;
            }}
            .body {{
              font-size: 14px;
              line-height: 1.6;
              color: #334155;
              margin-bottom: 28px;
            }}
            .button {{
              display: inline-block;
              background-color: #09090b;
              color: #ffffff !important;
              font-size: 13px;
              font-weight: 600;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 8px;
            }}
            .footer {{
              font-size: 11px;
              color: #64748b;
              margin-top: 32px;
              text-align: center;
            }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">⚡ Momentum AI</div>
            <div class="title">{subject}</div>
            <div class="body">
              {body_text.replace('\n', '<br>')}
            </div>
            <div style="text-align: center;">
              <a href="{getattr(settings, 'NEXT_PUBLIC_APP_URL', 'http://localhost:3000')}/lifesaver/agent" class="button">Open Momentum AI</a>
            </div>
            <div class="footer">
              This is an autonomous productivity alert generated by your Chief of Staff Mentor.
            </div>
          </div>
        </body>
        </html>
        """

        payload = {
            "from": "Momentum AI <notifications@resend.dev>",
            "to": email_to,
            "subject": subject,
            "html": html_content
        }

        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {resend_key}",
                        "Content-Type": "application/json"
                    },
                    json=payload,
                    timeout=10.0
                )
                if res.status_code in [200, 201, 202]:
                    logger.info(f"Resend email sent successfully to {email_to}")
                    await self._update_email_status(notification_id)
                    return True
                else:
                    logger.error(f"Resend API returned error status {res.status_code}: {res.text}")
                    return False
        except Exception as e:
            logger.error(f"Exception during email sending via Resend: {str(e)}", exc_info=True)
            return False

    async def _update_email_status(self, notification_id: Optional[str]):
        """Saves email sent timestamp in db."""
        if not notification_id:
            return
        try:
            stmt = text("""
                UPDATE agent_notifications 
                SET email_sent_at = :now, updated_at = :now 
                WHERE id = :id
            """)
            await self.db.execute(stmt, {"now": datetime.now(), "id": notification_id})
            await self.db.commit()
        except Exception as e:
            logger.error(f"Failed to update notification email status: {str(e)}")
