from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth.subscription import require_subscription_plan
from db.models import SubscriptionPlan
from routers import dashboard
from utils import get_env_var

frontend_url = get_env_var("FRONTEND_URL")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthy")
def health_check():
    return {"status": "Healthy"}


app.include_router(
    dashboard.router,
    dependencies=[Depends(require_subscription_plan(SubscriptionPlan.BASIC))],
)
