# API reference

Base URL: `http://127.0.0.1:8000/api`. Interactive docs: `http://127.0.0.1:8000/docs`.
All endpoints except register/login/health need `Authorization: Bearer <token>`.

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create account `{email, password, full_name}` |
| POST | `/auth/login` | Returns `{access_token, token_type, expires_in}` |
| POST | `/auth/logout` | Revoke the current token |
| GET / PATCH | `/auth/me` | Read / update profile |
| POST | `/auth/change-password` | `{current_password, new_password}` |
| POST | `/auth/delete-account` | `{password}` |
| GET | `/vault?q=&category=` | List entries (no passwords) |
| GET | `/vault/stats` | Total, per-category counts, 5 most recent |
| POST | `/vault` | Create entry (password is encrypted) |
| GET | `/vault/{id}` | Entry metadata |
| GET | `/vault/{id}/reveal` | Decrypted password for this entry only |
| PUT | `/vault/{id}` | Update; omit `password` to keep the existing one |
| DELETE | `/vault/{id}` | Delete entry |
| POST | `/tools/generate` | `{length, uppercase, lowercase, numbers, symbols}` |
| POST | `/tools/strength` | `{password}` → `{score, label, suggestions}` |
| GET | `/health` | Liveness check |
