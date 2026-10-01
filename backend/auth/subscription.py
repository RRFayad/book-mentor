from fastapi import HTTPException
from sqlalchemy import select
from starlette import status

from auth.auth import current_user_dependency
from db.database import db_dependency
from db.models import Subscription, SubscriptionPlan
from utils import get_boolean_env_var

billing_enabled = get_boolean_env_var("BILLING_ENABLED")

SUBSCRIPTION_PLAN_LEVELS = {
    SubscriptionPlan.BASIC: 1,
    SubscriptionPlan.PREMIUM: 2,
    SubscriptionPlan.ALL_IN: 3,
}
ACTIVE_SUBSCRIPTION_STATUSES = {"active", "trialing"}


def require_subscription_plan(required_plan: SubscriptionPlan):
    def dependency(
        db: db_dependency,
        user: current_user_dependency,
    ) -> Subscription | None:
        if not billing_enabled:
            return None

        subscription = db.scalar(
            select(Subscription).where(Subscription.user_id == user.id)
        )

        if subscription is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="An active subscription is required",
            )

        if subscription.status not in ACTIVE_SUBSCRIPTION_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="An active subscription is required",
            )

        if (
            SUBSCRIPTION_PLAN_LEVELS[subscription.plan]
            < SUBSCRIPTION_PLAN_LEVELS[required_plan]
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"The {required_plan.value} plan is required",
            )

        return subscription

    return dependency
