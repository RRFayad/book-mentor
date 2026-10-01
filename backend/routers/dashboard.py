from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel
from starlette import status

from auth.auth import current_user_dependency

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class DashboardMetric(BaseModel):
    label: str
    value: str
    change: str
    icon: Literal["revenue", "customers", "conversion", "refunds"]
    positive: bool


class DashboardChartPoint(BaseModel):
    label: str
    value: int


class DashboardRevenueActivity(BaseModel):
    total: str
    points: list[DashboardChartPoint]


class DashboardActivity(BaseModel):
    customer: str
    action: str
    amount: str


class DashboardData(BaseModel):
    user_email: str
    metrics: list[DashboardMetric]
    revenue_activity: DashboardRevenueActivity
    recent_activity: list[DashboardActivity]


@router.get("/", response_model=DashboardData, status_code=status.HTTP_200_OK)
def get_dashboard_data(user: current_user_dependency) -> DashboardData:
    return DashboardData(
        user_email=user.email,
        metrics=[
            DashboardMetric(
                label="Monthly revenue",
                value="$24,680",
                change="+12.5%",
                icon="revenue",
                positive=True,
            ),
            DashboardMetric(
                label="Active customers",
                value="1,284",
                change="+8.2%",
                icon="customers",
                positive=True,
            ),
            DashboardMetric(
                label="Conversion rate",
                value="4.86%",
                change="+0.6%",
                icon="conversion",
                positive=True,
            ),
            DashboardMetric(
                label="Refunds",
                value="$284",
                change="-4.1%",
                icon="refunds",
                positive=False,
            ),
        ],
        revenue_activity=DashboardRevenueActivity(
            total="$6,842",
            points=[
                DashboardChartPoint(label="Mon", value=46),
                DashboardChartPoint(label="Tue", value=62),
                DashboardChartPoint(label="Wed", value=54),
                DashboardChartPoint(label="Thu", value=78),
                DashboardChartPoint(label="Fri", value=69),
                DashboardChartPoint(label="Sat", value=88),
                DashboardChartPoint(label="Sun", value=76),
            ],
        ),
        recent_activity=[
            DashboardActivity(
                customer="Morgan Lee",
                action="Upgraded to Premium",
                amount="+$29.00",
            ),
            DashboardActivity(
                customer="Avery Shah",
                action="Started a trial",
                amount="$0.00",
            ),
            DashboardActivity(
                customer="Jamie Cruz",
                action="Renewed subscription",
                amount="+$12.00",
            ),
            DashboardActivity(
                customer="Taylor Chen",
                action="Purchased Basic",
                amount="+$12.00",
            ),
        ],
    )
