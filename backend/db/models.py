from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import DateTime, Enum, func
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    clerk_id: Mapped[str] = mapped_column(unique=True, nullable=False)
    stripe_customer_id: Mapped[str | None] = mapped_column(unique=True)
    email: Mapped[str] = mapped_column(unique=True, nullable=False)
    role: Mapped[str] = mapped_column(
        Enum("user", "admin", name="user_role", create_type=False),
        nullable=False,
        server_default="user",
    )
    name: Mapped[str | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )


class SubscriptionPlan(str, PyEnum):
    BASIC = "basic"
    PREMIUM = "premium"
    ALL_IN = "all_in"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(unique=True, nullable=False)
    stripe_event_id: Mapped[str] = mapped_column(nullable=False)
    stripe_event_created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )
    stripe_subscription_id: Mapped[str] = mapped_column(unique=True, nullable=False)
    plan: Mapped[SubscriptionPlan] = mapped_column(
        Enum(
            SubscriptionPlan,
            name="subscription_plan",
            create_type=False,
            values_callable=lambda enum: [plan.value for plan in enum],
        ),
        nullable=False,
    )
    stripe_price_id: Mapped[str] = mapped_column(nullable=False)
    status: Mapped[str] = mapped_column(nullable=False)
    recurring_interval: Mapped[str] = mapped_column(nullable=False)
    current_period_start: Mapped[datetime | None] = mapped_column(DateTime)
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime)
    cancel_at_period_end: Mapped[bool] = mapped_column(
        nullable=False,
        server_default="false",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )
