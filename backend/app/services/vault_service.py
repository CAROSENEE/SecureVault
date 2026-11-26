from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core import crypto
from app.core.config import get_settings
from app.models import User, VaultEntry


def get_user_dek(user: User) -> bytes:
    return crypto.unwrap_dek(get_settings().master_key, user.kek_salt, user.wrapped_dek)


def new_key_material() -> tuple[bytes, bytes]:
    """returns (salt, wrapped_dek) for a new user"""
    salt = crypto.generate_salt()
    return salt, crypto.wrap_dek(get_settings().master_key, salt, crypto.generate_dek())


def list_entries(db: Session, user: User, q: str | None = None, category: str | None = None) -> list[VaultEntry]:
    stmt = select(VaultEntry).where(VaultEntry.user_id == user.id)  # parameterized by SQLAlchemy
    if category:
        stmt = stmt.where(VaultEntry.category == category)
    if q:
        like = f"%{q.strip().replace('%', '').replace('_', '')}%"
        stmt = stmt.where(or_(VaultEntry.site_name.ilike(like), VaultEntry.site_url.ilike(like), VaultEntry.username.ilike(like), VaultEntry.category.ilike(like)))
    return list(db.scalars(stmt.order_by(VaultEntry.created_at.desc())))


def get_entry(db: Session, user: User, entry_id: int) -> VaultEntry | None:
    # authorization: entry must belong to the requesting user
    return db.scalar(select(VaultEntry).where(VaultEntry.id == entry_id, VaultEntry.user_id == user.id))


def create_entry(db: Session, user: User, data) -> VaultEntry:
    dek = get_user_dek(user)
    entry = VaultEntry(
        user_id=user.id,
        site_name=data.site_name.strip(),
        site_url=data.site_url.strip(),
        username=data.username.strip(),
        category=data.category.strip() or "General",
        notes=data.notes,
        encrypted_password=crypto.encrypt_secret(dek, data.password, user.id),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def update_entry(db: Session, user: User, entry: VaultEntry, data) -> VaultEntry:
    entry.site_name = data.site_name.strip()
    entry.site_url = data.site_url.strip()
    entry.username = data.username.strip()
    entry.category = data.category.strip() or "General"
    entry.notes = data.notes
    if data.password is not None:
        entry.encrypted_password = crypto.encrypt_secret(get_user_dek(user), data.password, user.id)
    db.commit()
    db.refresh(entry)
    return entry


def reveal_password(user: User, entry: VaultEntry) -> str:
    return crypto.decrypt_secret(get_user_dek(user), entry.encrypted_password, user.id)
