from datetime import datetime, timezone
from typing import Annotated

from pydantic import AfterValidator


def _as_utc(d: datetime) -> datetime:
    # SQLite drops tzinfo; everything we store is UTC
    return d.replace(tzinfo=timezone.utc) if d.tzinfo is None else d


UTCDateTime = Annotated[datetime, AfterValidator(_as_utc)]
