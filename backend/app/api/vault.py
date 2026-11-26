from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.crypto import CryptoError
from app.database import get_db
from app.models import User, VaultEntry
from app.schemas.vault import EntryCreate, EntryOut, EntryUpdate, RevealOut, StatsOut
from app.services import vault_service

router = APIRouter(prefix="/vault", tags=["vault"])


def _owned(db: Session, user: User, entry_id: int) -> VaultEntry:
    entry = vault_service.get_entry(db, user, entry_id)
    if entry is None:  # 404 (not 403) so other users' ids cannot be probed
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Entry not found.")
    return entry


@router.get("", response_model=list[EntryOut])
def list_entries(q: str | None = Query(None, max_length=100), category: str | None = Query(None, max_length=60), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return vault_service.list_entries(db, user, q, category)


@router.get("/stats", response_model=StatsOut)
def stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.execute(select(VaultEntry.category, func.count()).where(VaultEntry.user_id == user.id).group_by(VaultEntry.category)).all()
    recent = vault_service.list_entries(db, user)[:5]
    return StatsOut(total=sum(c for _, c in rows), categories={k: c for k, c in rows}, recent=recent)


@router.post("", response_model=EntryOut, status_code=201)
def create(data: EntryCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return vault_service.create_entry(db, user, data)


@router.get("/{entry_id}", response_model=EntryOut)
def read(entry_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _owned(db, user, entry_id)


@router.get("/{entry_id}/reveal", response_model=RevealOut)
def reveal(entry_id: int, response: Response, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    entry = _owned(db, user, entry_id)
    try:
        password = vault_service.reveal_password(user, entry)
    except CryptoError:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Could not decrypt this entry.")
    response.headers["Cache-Control"] = "no-store"
    return RevealOut(id=entry.id, password=password)


@router.put("/{entry_id}", response_model=EntryOut)
def update(entry_id: int, data: EntryUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return vault_service.update_entry(db, user, _owned(db, user, entry_id), data)


@router.delete("/{entry_id}", status_code=204)
def delete(entry_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(_owned(db, user, entry_id))
    db.commit()
