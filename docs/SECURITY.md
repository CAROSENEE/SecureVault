# Security design

## Key management (envelope encryption)

```
VAULT_MASTER_KEY (env, 32 random bytes)
        │  HKDF-SHA256(salt = per-user random 16 bytes, info = "securevault/kek/v1")
        ▼
 per-user KEK ──AES-256-GCM wrap──► wrapped DEK  (stored in users.wrapped_dek)
                                      │ unwrap on demand
                                      ▼
                       per-user DEK (random 32 bytes)
                                      │ AES-256-GCM, random 12-byte nonce, AAD = "user:<id>"
                                      ▼
                       vault_entries.encrypted_password = base64(0x01 | nonce | ciphertext | tag)
```

| Requirement | How it is met |
|---|---|
| No hardcoded key | Master key comes from `.env` (`generate_keys.py` creates it with `os.urandom`). The app refuses to start without it. |
| Not derived from the JWT secret | JWT secret and master key are independent; startup fails if they are equal. |
| Blast radius | One DEK per user. Leaking one user's DEK doesn't expose others. |
| Tamper detection | GCM authentication tag; any modification raises `CryptoError`. |
| Row swapping | User id is bound as associated data, so a ciphertext copied to another account fails to decrypt. |
| Password change | The DEK is independent of the login password, so changing it needs no re-encryption. |
| Master key rotation | Only the wrapped DEKs need re-wrapping (not implemented as a command yet). |

## Authentication

- Argon2id hashes for login passwords; unknown emails still perform a hash verification to reduce timing differences.
- JWT (HS256) with `sub`, `jti`, `iat`, `exp`; default lifetime 30 minutes (`ACCESS_TOKEN_EXPIRE_MINUTES`).
- Logout and password change insert the token's `jti` into `revoked_tokens`; every request checks it.
- 5 failed logins lock the account for 15 minutes.
- Registration requires 10+ characters with upper, lower and a digit.

## Authorization

Every vault query filters by `user_id` of the authenticated user. Accessing someone else's entry returns 404 (not 403), so ids can't be probed.

## Other protections

- SQLAlchemy parameterized queries only; search wildcards are sanitized.
- `Cache-Control: no-store` on API responses, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.
- CORS restricted to `CORS_ORIGINS`.
- No request bodies or secrets are logged.
