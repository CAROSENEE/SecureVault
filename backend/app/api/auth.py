from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_token_payload, purge_expired_revocations
from app.core.config import get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.models import RevokedToken, User
from app.schemas.auth import ChangePasswordIn, DeleteAccountIn, LoginIn, ProfileUpdate, RegisterIn, TokenOut, UserOut
from app.services import vault_service

router = APIRouter(prefix="/auth", tags=["auth"])

# verifying against this keeps timing similar for unknown emails
_DUMMY_HASH = hash_password("dummy-password-for-timing")


def _aware(dt: datetime | None) -> datetime | None:
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


@router.post("/register", response_model=UserOut, status_code=201)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.email == data.email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists.")
    salt, wrapped = vault_service.new_key_material()
    user = User(email=data.email, full_name=data.full_name.strip(), password_hash=hash_password(data.password), kek_salt=salt, wrapped_dek=wrapped)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    s = get_settings()
    user = db.scalar(select(User).where(User.email == data.email))
    generic = HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password.")
    if user is None:
        verify_password(data.password, _DUMMY_HASH)
        raise generic
    now = datetime.now(timezone.utc)
    locked = _aware(user.locked_until)
    if locked and locked > now:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many failed attempts. Try again in a few minutes.")
    if not verify_password(data.password, user.password_hash):
        user.failed_logins += 1
        if user.failed_logins >= s.max_failed_logins:
            user.locked_until = now + timedelta(minutes=s.lockout_minutes)
            user.failed_logins = 0
        db.commit()
        raise generic
    user.failed_logins = 0
    user.locked_until = None
    user.last_login_at = now
    db.commit()
    token, _, _ = create_access_token(user.id)
    return TokenOut(access_token=token, expires_in=s.access_token_expire_minutes * 60)


@router.post("/logout", status_code=204)
def logout(payload: dict = Depends(get_token_payload), db: Session = Depends(get_db)):
    if not db.get(RevokedToken, payload["jti"]):
        db.add(RevokedToken(jti=payload["jti"], expires_at=datetime.fromtimestamp(payload["exp"], tz=timezone.utc)))
        db.commit()
    purge_expired_revocations(db)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserOut)
def update_profile(data: ProfileUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.full_name = data.full_name.strip()
    db.commit()
    db.refresh(user)
    return user


@router.post("/change-password", status_code=204)
def change_password(data: ChangePasswordIn, user: User = Depends(get_current_user), payload: dict = Depends(get_token_payload), db: Session = Depends(get_db)):
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect.")
    user.password_hash = hash_password(data.new_password)
    # vault keys are independent of the login password -> no re-encryption needed
    db.add(RevokedToken(jti=payload["jti"], expires_at=datetime.fromtimestamp(payload["exp"], tz=timezone.utc)))
    db.commit()


@router.post("/delete-account", status_code=204)
def delete_account(data: DeleteAccountIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Password is incorrect.")
    db.delete(user)
    db.commit()
