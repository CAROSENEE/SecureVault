from fastapi import APIRouter, Depends, Response

from app.api.deps import get_current_user
from app.schemas.tools import GenerateIn, GenerateOut, StrengthIn, StrengthOut
from app.services import password_tools

router = APIRouter(prefix="/tools", tags=["tools"], dependencies=[Depends(get_current_user)])


@router.post("/generate", response_model=GenerateOut)
def generate(data: GenerateIn, response: Response):
    response.headers["Cache-Control"] = "no-store"
    return GenerateOut(password=password_tools.generate_password(data.length, data.uppercase, data.lowercase, data.numbers, data.symbols))


@router.post("/strength", response_model=StrengthOut)
def strength(data: StrengthIn, response: Response):
    response.headers["Cache-Control"] = "no-store"
    return password_tools.check_strength(data.password)
