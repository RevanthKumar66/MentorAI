import logging
from datetime import datetime, timedelta
from typing import Optional
import uuid
from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.database.session import get_async_db
from app.models.user import User
from app.models.user_settings import UserSettings
from app.modules.auth.dependencies import get_current_user
from app.common.responses import success_response, error_response
from app.modules.documents.schemas import UserSettingsResponse

logger = logging.getLogger("mentorai-os.billing.api")

router = APIRouter(prefix="/billing", tags=["Billing"])

class CheckoutPayload(BaseModel):
    plan_id: str
    billing_cycle: str

class WebhookPayload(BaseModel):
    user_id: uuid.UUID
    plan_id: str
    billing_cycle: str
    status: str = "ACTIVE"

@router.post("/checkout")
async def checkout(
    payload: CheckoutPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Simulates a billing checkout session initiation.
    Returns status: 'coming_soon' in mock mode, allowing the frontend to show 
    the 'Coming Soon' notify form.
    
    In a real Razorpay / Stripe implementation, this will return:
    { "status": "active", "checkout_url": "https://checkout.stripe.com/pay/..." }
    """
    try:
        plan = payload.plan_id.upper()
        cycle = payload.billing_cycle.lower()
        
        # Validations
        if plan not in ["FREE", "PRO", "PRO_PLUS"]:
            return error_response(
                code="INVALID_PLAN",
                message="Invalid plan specified. Choose FREE, PRO, or PRO_PLUS.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        if cycle not in ["monthly", "yearly", "3_years"]:
            return error_response(
                code="INVALID_BILLING_CYCLE",
                message="Invalid billing cycle. Choose monthly, yearly, or 3_years.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        logger.info(f"User {current_user.id} requested checkout for plan {plan} ({cycle})")

        # Mock Stripe / Razorpay response
        # To make it future-ready, the UI will check the status. 
        # If 'coming_soon', it opens the localComing Soon modal.
        # If 'active', it redirects to the checkout_url.
        return success_response(
            data={
                "status": "coming_soon",
                "message": "Subscriptions are currently in pre-launch mode.",
                "plan_id": plan,
                "billing_cycle": cycle,
                "checkout_url": None  # Will be a real checkout link in production
            },
            message="Checkout session simulated successfully."
        )
    except Exception as e:
        logger.error(f"Error initiating checkout: {str(e)}", exc_info=True)
        return error_response(
            code="CHECKOUT_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.post("/webhook")
async def webhook(
    payload: WebhookPayload,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Mock payment gateway webhook receiver.
    In the future, this endpoint will verify signatures from Razorpay/Stripe,
    parse checkout details, and update the database accordingly.
    
    This mock endpoint directly accepts updates to allow test-upgrading users.
    """
    try:
        user_id = payload.user_id
        plan = payload.plan_id.upper()
        cycle = payload.billing_cycle.lower()
        status_val = payload.status.upper()

        stmt = select(UserSettings).where(UserSettings.user_id == user_id)
        res = await db.execute(stmt)
        settings_obj = res.scalar_one_or_none()

        if not settings_obj:
            settings_obj = UserSettings(
                user_id=user_id
            )
            db.add(settings_obj)

        settings_obj.subscription_plan = plan
        settings_obj.subscription_status = status_val
        settings_obj.billing_cycle = cycle
        settings_obj.subscription_started_at = datetime.utcnow()
        
        # Calculate expiry
        now = datetime.utcnow()
        if cycle == "monthly":
            expiry = now + timedelta(days=30)
        elif cycle == "yearly":
            expiry = now + timedelta(days=365)
        else: # 3 years
            expiry = now + timedelta(days=365 * 3)
            
        settings_obj.subscription_expires_at = expiry

        await db.commit()
        await db.refresh(settings_obj)

        logger.info(f"Successfully processed mock webhook subscription update for User: {user_id} -> {plan}")
        
        data = UserSettingsResponse.model_validate(settings_obj)
        return success_response(
            data=data.model_dump(),
            message="Subscription webhook event processed successfully"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Error processing webhook: {str(e)}", exc_info=True)
        return error_response(
            code="WEBHOOK_PROCESSING_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
