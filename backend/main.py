from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


# Include each product router with the subscription dependency, for example:
# app.include_router(
#     sources.router,
#     dependencies=[Depends(require_subscription_plan(SubscriptionPlan.BASIC))],
# )
