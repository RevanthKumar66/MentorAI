import logging
from datetime import datetime, date
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

logger = logging.getLogger("mentorai-os.services.agent_context_service")

class AgentContextService:
    """Aggregates all user-specific productivity data, calendar events, and execution history."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_context(self, user_id: str) -> Dict[str, Any]:
        """Gathers goals, tasks, calendar, risks, focus history, and activity for the user."""
        try:
            # 1. Fetch Goals
            goals_query = text("""
                SELECT id, title, category, target_date, hours_per_day, experience_level, goal_health, risk_score 
                FROM lifesaver_goals 
                WHERE user_id = :user_id AND (status = 'active' OR status IS NULL)
            """)
            goals_res = await self.db.execute(goals_query, {"user_id": user_id})
            goals = [
                {
                    "id": str(r[0]),
                    "title": r[1],
                    "category": r[2],
                    "target_date": r[3].isoformat() if isinstance(r[3], (datetime, date)) else r[3],
                    "hours_per_day": r[4],
                    "experience_level": r[5],
                    "goal_health": r[6],
                    "risk_score": float(r[7]) if r[7] is not None else 0.0
                }
                for r in goals_res.fetchall()
            ]

            # 2. Fetch Tasks
            tasks_query = text("""
                SELECT id, goal_id, title, description, priority, status, due_date 
                FROM lifesaver_tasks 
                WHERE user_id = :user_id
            """)
            tasks_res = await self.db.execute(tasks_query, {"user_id": user_id})
            tasks = [
                {
                    "id": str(r[0]),
                    "goal_id": str(r[1]) if r[1] else None,
                    "title": r[2],
                    "description": r[3],
                    "priority": r[4],
                    "status": r[5],
                    "due_date": r[6].isoformat() if isinstance(r[6], (datetime, date)) else r[6]
                }
                for r in tasks_res.fetchall()
            ]

            # 3. Fetch Calendar Connection and Events
            conn_query = text("""
                SELECT provider, email, last_sync_at 
                FROM calendar_connections 
                WHERE user_id = :user_id
            """)
            conn_res = await self.db.execute(conn_query, {"user_id": user_id})
            conn_row = conn_res.fetchone()
            calendar_connection = None
            if conn_row:
                calendar_connection = {
                    "provider": conn_row[0],
                    "email": conn_row[1],
                    "last_sync_at": conn_row[2].isoformat() if conn_row[2] else None
                }

            events_query = text("""
                SELECT title, description, start_time, end_time, location, status 
                FROM calendar_events 
                WHERE user_id = :user_id AND end_time >= NOW() - INTERVAL '1 day'
                ORDER BY start_time ASC
                LIMIT 50
            """)
            events_res = await self.db.execute(events_query, {"user_id": user_id})
            calendar_events = [
                {
                    "title": r[0],
                    "description": r[1],
                    "start_time": r[2].isoformat() if r[2] else None,
                    "end_time": r[3].isoformat() if r[3] else None,
                    "location": r[4],
                    "status": r[5]
                }
                for r in events_res.fetchall()
            ]

            # 4. Fetch Goal Risks and Recovery Plans
            risks_query = text("""
                SELECT goal_id, risk_score, risk_level, completion_probability, forecast_summary 
                FROM lifesaver_goal_risk 
                WHERE user_id = :user_id
            """)
            risks_res = await self.db.execute(risks_query, {"user_id": user_id})
            risks = [
                {
                    "goal_id": str(r[0]),
                    "risk_score": float(r[1]),
                    "risk_level": r[2],
                    "completion_probability": float(r[3]),
                    "forecast_summary": r[4]
                }
                for r in risks_res.fetchall()
            ]

            # 5. Fetch Average Focus Score (from coaching logs)
            coaching_query = text("""
                SELECT focus_score 
                FROM lifesaver_coaching_logs 
                WHERE user_id = :user_id AND focus_score IS NOT NULL 
                ORDER BY created_at DESC 
                LIMIT 10
            """)
            coaching_res = await self.db.execute(coaching_query, {"user_id": user_id})
            focus_scores = [r[0] for r in coaching_res.fetchall()]
            avg_focus_score = round(sum(focus_scores) / len(focus_scores)) if focus_scores else 75

            # 6. Fetch Recent Activity Logs
            activity_query = text("""
                SELECT activity_type, description, timestamp 
                FROM agent_activity_logs 
                WHERE user_id = :user_id 
                ORDER BY timestamp DESC 
                LIMIT 20
            """)
            activity_res = await self.db.execute(activity_query, {"user_id": user_id})
            activity_feed = [
                {
                    "activity_type": r[0],
                    "description": r[1],
                    "timestamp": r[2].isoformat() if r[2] else None
                }
                for r in activity_res.fetchall()
            ]

            # 7. Fetch Recent Notifications
            notif_query = text("""
                SELECT id, category, title, body, status, sent_at 
                FROM agent_notifications 
                WHERE user_id = :user_id 
                ORDER BY sent_at DESC 
                LIMIT 20
            """)
            notif_res = await self.db.execute(notif_query, {"user_id": user_id})
            recent_notifications = [
                {
                    "id": str(r[0]),
                    "category": r[1],
                    "title": r[2],
                    "body": r[3],
                    "status": r[4],
                    "sent_at": r[5].isoformat() if r[5] else None
                }
                for r in notif_res.fetchall()
            ]

            return {
                "goals": goals,
                "tasks": tasks,
                "calendar_connection": calendar_connection,
                "calendar_events": calendar_events,
                "risks": risks,
                "focus_score": avg_focus_score,
                "activity_feed": activity_feed,
                "recent_notifications": recent_notifications,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error compiling user context: {str(e)}", exc_info=True)
            raise e
