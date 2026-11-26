from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.user import utcnow


class VaultEntry(Base):
    __tablename__ = "vault_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    site_name: Mapped[str] = mapped_column(String(120))
    site_url: Mapped[str] = mapped_column(String(500), default="")
    username: Mapped[str] = mapped_column(String(255), default="")
    encrypted_password: Mapped[str] = mapped_column(Text)  # base64(version|nonce|ciphertext|tag)
    category: Mapped[str] = mapped_column(String(60), default="General", index=True)
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    owner = relationship("User", back_populates="entries")
