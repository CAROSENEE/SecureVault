from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import UTCDateTime


class EntryBase(BaseModel):
    site_name: str = Field(min_length=1, max_length=120)
    site_url: str = Field(default="", max_length=500)
    username: str = Field(default="", max_length=255)
    category: str = Field(default="General", min_length=1, max_length=60)
    notes: str = Field(default="", max_length=5000)


class EntryCreate(EntryBase):
    password: str = Field(min_length=1, max_length=1024)


class EntryUpdate(EntryBase):
    # None -> keep the existing password
    password: str | None = Field(default=None, min_length=1, max_length=1024)


class EntryOut(EntryBase):
    """Never contains the password. Use /reveal to fetch it on demand."""

    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: UTCDateTime
    updated_at: UTCDateTime


class RevealOut(BaseModel):
    id: int
    password: str


class StatsOut(BaseModel):
    total: int
    categories: dict[str, int]
    recent: list[EntryOut]
