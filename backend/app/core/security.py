import uuid
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

from app.core.config import get_settings

_ph = PasswordHasher()  # Argon2id with library defaults
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return _ph.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    try:
        return _ph.verify(hashed, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def create_access_token(user_id: int) -> tuple[str, str, datetime]:
    s = get_settings()
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=s.access_token_expire_minutes)
    jti = uuid.uuid4().hex
    token = jwt.encode({"sub": str(user_id), "jti": jti, "iat": now, "exp": exp}, s.jwt_secret, algorithm=ALGORITHM)
    return token, jti, exp


def decode_access_token(token: str) -> dict:
    """Raises jwt.PyJWTError on invalid/expired tokens."""
    return jwt.decode(token, get_settings().jwt_secret, algorithms=[ALGORITHM], options={"require": ["exp", "sub", "jti"]})
