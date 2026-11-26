import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.schemas.common import UTCDateTime


def _check_master_password(v: str) -> str:
    if len(v) < 10:
        raise ValueError("Password must be at least 10 characters.")
    if len(v) > 128:
        raise ValueError("Password must be at most 128 characters.")
    if not (re.search(r"[a-z]", v) and re.search(r"[A-Z]", v) and re.search(r"\d", v)):
        raise ValueError("Password must include uppercase, lowercase and a number.")
    return v


class RegisterIn(BaseModel):
    email: EmailStr
    full_name: str = Field(default="", max_length=120)
    password: str

    @field_validator("password")
    @classmethod
    def strong(cls, v):
        return _check_master_password(v)

    @field_validator("email")
    @classmethod
    def lower(cls, v):
        return v.lower()


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(max_length=128)

    @field_validator("email")
    @classmethod
    def lower(cls, v):
        return v.lower()


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    full_name: str
    created_at: UTCDateTime | None = None
    last_login_at: UTCDateTime | None = None


class ProfileUpdate(BaseModel):
    full_name: str = Field(max_length=120)


class ChangePasswordIn(BaseModel):
    current_password: str = Field(max_length=128)
    new_password: str

    @field_validator("new_password")
    @classmethod
    def strong(cls, v):
        return _check_master_password(v)


class DeleteAccountIn(BaseModel):
    password: str = Field(max_length=128)
