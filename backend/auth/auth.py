from typing import Annotated

from fastapi import Depends, HTTPException
from fastapi_clerk_auth import (
    ClerkConfig,
    ClerkHTTPBearer,
    HTTPAuthorizationCredentials,
)
from sqlalchemy import select
from starlette import status

from db.database import db_dependency
from db.models import User
from utils import get_env_var

clerk_jwks_url = get_env_var("CLERK_JWKS_URL")
clerk_config = ClerkConfig(
    jwks_url=clerk_jwks_url,
)
clerk_auth_guard = ClerkHTTPBearer(
    config=clerk_config,
)

clerk_auth_dependency = Annotated[
    HTTPAuthorizationCredentials, Depends(clerk_auth_guard)
]


def get_current_user(
    db: db_dependency,
    credentials: clerk_auth_dependency,
) -> User:
    if credentials.decoded is None or "sub" not in credentials.decoded:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    clerk_id = credentials.decoded["sub"]
    user = db.scalar(select(User).where(User.clerk_id == clerk_id))

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


current_user_dependency = Annotated[User, Depends(get_current_user)]
