import base64
import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")


class ConfigError(RuntimeError):
    pass


@dataclass(frozen=True)
class Settings:
    master_key: bytes
    jwt_secret: str
    access_token_expire_minutes: int
    database_url: str
    cors_origins: list[str]
    max_failed_logins: int = 5
    lockout_minutes: int = 15


def load_settings() -> Settings:
    mk_b64 = os.getenv("VAULT_MASTER_KEY", "").strip()
    jwt_secret = os.getenv("JWT_SECRET", "").strip()
    if not mk_b64 or not jwt_secret:
        raise ConfigError(
            "VAULT_MASTER_KEY and JWT_SECRET are not set. Run `python generate_keys.py` in backend/."
        )
    try:
        master_key = base64.b64decode(mk_b64, validate=True)
    except Exception as exc:  # noqa: BLE001
        raise ConfigError("VAULT_MASTER_KEY must be valid base64.") from exc
    if len(master_key) != 32:
        raise ConfigError("VAULT_MASTER_KEY must decode to exactly 32 bytes.")
    if len(jwt_secret) < 32:
        raise ConfigError("JWT_SECRET must be at least 32 characters.")
    if jwt_secret == mk_b64:
        raise ConfigError("JWT_SECRET and VAULT_MASTER_KEY must be different values.")
    return Settings(
        master_key=master_key,
        jwt_secret=jwt_secret,
        access_token_expire_minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")),
        database_url=os.getenv("DATABASE_URL", "sqlite:///./securevault.db"),
        cors_origins=[o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()],
    )


_settings: Settings | None = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = load_settings()
    return _settings
