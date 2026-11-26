from pydantic import BaseModel, Field, model_validator


class GenerateIn(BaseModel):
    length: int = Field(default=16, ge=8, le=128)
    uppercase: bool = True
    lowercase: bool = True
    numbers: bool = True
    symbols: bool = True

    @model_validator(mode="after")
    def at_least_one(self):
        if not (self.uppercase or self.lowercase or self.numbers or self.symbols):
            raise ValueError("Select at least one character type.")
        return self


class GenerateOut(BaseModel):
    password: str


class StrengthIn(BaseModel):
    password: str = Field(max_length=1024)


class StrengthOut(BaseModel):
    score: int
    label: str
    suggestions: list[str]
