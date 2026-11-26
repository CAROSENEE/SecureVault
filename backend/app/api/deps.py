from datetime import datetime, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models import RevokedToken, User

bearer = HTTPBearer(auto_error=False)


def _unauthorized(detail="Not authenticated"):
    return HTTPException(status.HTTP_401_UNAUTHORIZED, detail, headers={"WWW-Authenticate": "Bearer"})


def get_token_payload(creds: HTTPAuthorizationCredentials | None = Depends(bearer)) -> dict:
    if creds is None:
        raise _unauthorized()
    try:
        return decode_access_token(creds.credentials)
    except jwt.ExpiredSignatureError:
        raise _unauthorized("Session expired. Please log in again.")
    except jwt.PyJWTError:
        raise _unauthorized("Invalid token")


def get_current_user(payload: dict = Depends(get_token_payload), db: Session = Depends(get_db)) -> User:
    if db.get(RevokedToken, payload["jti"]):
        raise _unauthorized("Session ended. Please log in again.")
    user = db.get(User, int(payload["sub"]))
    if user is None:
        raise _unauthorized("Invalid token")
    return user


def purge_expired_revocations(db: Session) -> None:
    db.query(RevokedToken).filter(RevokedToken.expires_at < datetime.now(timezone.utc)).delete()
    db.commit()
