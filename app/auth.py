from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from app.config import (
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ADMIN_USERNAME,
    ADMIN_PASSWORD,
    ADMIN_PASSWORD_HASH,
)

security = HTTPBearer(auto_error=False)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def verify_admin_login(username: str, password: str) -> bool:
    if not ADMIN_USERNAME or not password:
        return False
    if username != ADMIN_USERNAME:
        return False
    if ADMIN_PASSWORD_HASH:
        try:
            return bcrypt.checkpw(
                password.encode("utf-8"),
                ADMIN_PASSWORD_HASH.encode("utf-8"),
            )
        except (ValueError, TypeError):
            return False
    if ADMIN_PASSWORD:
        return password == ADMIN_PASSWORD
    return False


async def require_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = verify_token(credentials.credentials)
    if not payload or payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return payload


async def optional_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict | None:
    if not credentials:
        return None
    return verify_token(credentials.credentials)
