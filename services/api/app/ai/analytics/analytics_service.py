import uuid
from datetime import datetime, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.role_usage import RoleUsage
from app.models.chat import ChatSession, ChatMessage
from app.models.document import Document
from typing import Dict, Any, List

class AnalyticsService:
    @staticmethod
    async def track_message(
        db: AsyncSession,
        user_id: uuid.UUID,
        role: str,
        tokens_used: int,
        is_new_session: bool = False
    ) -> RoleUsage:
        """Update or create a RoleUsage record for a user and role."""
        # Find existing role usage
        query = select(RoleUsage).where(
            RoleUsage.user_id == user_id,
            RoleUsage.role == role
        )
        result = await db.execute(query)
        role_usage = result.scalar_one_or_none()
        
        if not role_usage:
            role_usage = RoleUsage(
                user_id=user_id,
                role=role,
                messages_count=1,
                tokens_used=tokens_used,
                sessions_count=1,
                last_used_at=datetime.utcnow()
            )
            db.add(role_usage)
        else:
            role_usage.messages_count += 1
            role_usage.tokens_used += tokens_used
            if is_new_session:
                role_usage.sessions_count += 1
            role_usage.last_used_at = datetime.utcnow()
            
        await db.commit()
        await db.refresh(role_usage)
        return role_usage

    @staticmethod
    async def get_user_analytics(
        db: AsyncSession,
        user_id: uuid.UUID
    ) -> Dict[str, Any]:
        """Compile comprehensive analytics reports for a user."""
        # 1. Fetch all role usages
        query_role = select(RoleUsage).where(RoleUsage.user_id == user_id)
        res_role = await db.execute(query_role)
        usages = res_role.scalars().all()
        
        role_data = []
        total_messages = 0
        total_tokens = 0
        for u in usages:
            role_data.append({
                "role": u.role,
                "messages_count": u.messages_count,
                "tokens_used": u.tokens_used,
                "sessions_count": u.sessions_count,
                "last_used_at": u.last_used_at.isoformat() if u.last_used_at else None
            })
            total_messages += u.messages_count
            total_tokens += u.tokens_used
            
        # 2. Count total documents
        query_docs = select(func.count(Document.id)).where(
            Document.user_id == user_id,
            Document.is_deleted == False
        )
        res_docs = await db.execute(query_docs)
        total_documents = res_docs.scalar() or 0
        
        # 3. Weekly activity (message counts grouped by day for last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        query_weekly = select(
            func.date(ChatMessage.created_at).label("day"),
            func.count(ChatMessage.id).label("count")
        ).join(
            ChatSession, ChatSession.id == ChatMessage.session_id
        ).where(
            ChatSession.user_id == user_id,
            ChatMessage.created_at >= seven_days_ago,
            ChatMessage.role == "user"
        ).group_by(
            func.date(ChatMessage.created_at)
        ).order_by(
            "day"
        )
        
        res_weekly = await db.execute(query_weekly)
        weekly_rows = res_weekly.all()
        weekly_activity = [{"date": str(r.day), "count": r.count} for r in weekly_rows]
        
        return {
            "total_messages": total_messages,
            "total_tokens": total_tokens,
            "total_documents": total_documents,
            "roles_breakdown": role_data,
            "weekly_activity": weekly_activity
        }
