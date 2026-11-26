import math
import re
import secrets
import string

SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?"
COMMON = {"password", "123456", "12345678", "qwerty", "letmein", "admin", "welcome", "iloveyou", "abc123", "111111", "dragon", "monkey"}


def generate_password(length=16, uppercase=True, lowercase=True, numbers=True, symbols=True) -> str:
    pools = []
    if uppercase:
        pools.append(string.ascii_uppercase)
    if lowercase:
        pools.append(string.ascii_lowercase)
    if numbers:
        pools.append(string.digits)
    if symbols:
        pools.append(SYMBOLS)
    if not pools:
        raise ValueError("Select at least one character type.")
    if length < len(pools):
        raise ValueError("Length too short for the selected options.")
    # guarantee at least one char of each selected class, fill the rest from the union
    chars = [secrets.choice(p) for p in pools]
    union = "".join(pools)
    chars += [secrets.choice(union) for _ in range(length - len(chars))]
    secrets.SystemRandom().shuffle(chars)
    return "".join(chars)


def check_strength(password: str) -> dict:
    suggestions: list[str] = []
    if not password:
        return {"score": 0, "label": "Weak", "suggestions": ["Enter a password to analyze it."]}

    pool = 0
    has_lower = bool(re.search(r"[a-z]", password))
    has_upper = bool(re.search(r"[A-Z]", password))
    has_digit = bool(re.search(r"\d", password))
    has_symbol = bool(re.search(r"[^A-Za-z0-9]", password))
    pool += 26 * has_lower + 26 * has_upper + 10 * has_digit + 32 * has_symbol
    entropy = len(password) * math.log2(pool) if pool else 0

    if len(password) < 12:
        suggestions.append("Use at least 12 characters.")
    if not has_upper:
        suggestions.append("Add uppercase letters.")
    if not has_lower:
        suggestions.append("Add lowercase letters.")
    if not has_digit:
        suggestions.append("Add numbers.")
    if not has_symbol:
        suggestions.append("Add special characters.")
    if re.search(r"(.)\1{2,}", password):
        suggestions.append("Avoid repeating the same character three or more times.")
        entropy -= 10
    if re.search(r"(012|123|234|345|456|567|678|789|abc|bcd|cde|qwe|asd|zxc)", password.lower()):
        suggestions.append("Avoid common sequences like 123 or abc.")
        entropy -= 10
    if password.lower() in COMMON or any(c in password.lower() for c in ("password", "qwerty", "letmein")):
        suggestions.append("Avoid common words like 'password'.")
        entropy = min(entropy, 20)

    score = max(0, min(100, int(entropy / 90 * 100)))
    if len(password) < 12:
        score = min(score, 69)  # short passwords can never be rated Strong
    label = "Weak" if score < 40 else "Medium" if score < 70 else "Strong"
    if label == "Strong" and not suggestions:
        suggestions.append("Great! Use a unique password for every account.")
    return {"score": score, "label": label, "suggestions": suggestions}
