"""Generate a .env file with fresh, independent secrets (run once)."""
import base64
import os
import secrets
from pathlib import Path

env_path = Path(__file__).parent / ".env"
if env_path.exists():
    print(".env already exists - refusing to overwrite your keys.")
    raise SystemExit(1)

master = base64.b64encode(os.urandom(32)).decode()
jwt_secret = secrets.token_urlsafe(64)
example = (Path(__file__).parent / ".env.example").read_text()
lines = []
for line in example.splitlines():
    if line.startswith("VAULT_MASTER_KEY="):
        line = f"VAULT_MASTER_KEY={master}"
    elif line.startswith("JWT_SECRET="):
        line = f"JWT_SECRET={jwt_secret}"
    lines.append(line)
env_path.write_text("\n".join(lines) + "\n")
try:
    os.chmod(env_path, 0o600)
except OSError:
    pass
print("Created backend/.env with new random keys. Back it up: losing VAULT_MASTER_KEY makes saved passwords unrecoverable.")
