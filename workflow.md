# SecureVault

A self-hosted personal password manager. Save, organize, generate and check passwords, with every stored password encrypted using **AES-256-GCM**. It runs entirely on your own computer and needs no paid services.

## Features

- **Accounts**: register, log in, log out, protected routes, session expiry (JWT) and an idle auto-logout
- **Vault**: add, edit, delete, view, copy and search saved accounts. Each record has website name, URL, username/email, encrypted password, category, notes and creation date
- **Password generator**: length 8–64, uppercase, lowercase, numbers, special characters, copy button (uses the browser's `crypto.getRandomValues`)
- **Strength checker**: Weak / Medium / Strong with concrete suggestions (also available as an API endpoint)
- **Dashboard**: total accounts, recently added, category breakdown, quick generator, search
- **Security settings**: change login password (vault stays intact), log out / revoke session, delete account
- **Profile page**: name, member since, last login
- Dark glassmorphism UI with a neon green (`#59FFB4`) accent, responsive down to mobile

## Technology stack

| Layer | Tools |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS 3, React Router 6, Lucide React |
| Backend | Python 3.10+, FastAPI, SQLAlchemy 2 |
| Database | SQLite |
| Security | AES-256-GCM (`cryptography`), Argon2id (`argon2-cffi`), JWT (`PyJWT`), `.env` secrets |
| Tests | pytest + FastAPI TestClient (53 tests) |

## Installation

Requirements: **Python 3.10+** and **Node.js 18+**.

### 1. Backend

Windows (PowerShell):
```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python generate_keys.py      # creates backend\.env with fresh random secrets (run once)
uvicorn app.main:app --reload --port 8000
```

macOS / Linux:
```bash
cd backend
./run.sh                     # creates venv, installs deps, generates .env on first run, starts the API
```

The API runs at http://127.0.0.1:8000 (interactive docs at `/docs`).

### 2. Frontend

In a second terminal:
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**, create an account and start saving passwords. The Vite dev server proxies `/api` to the backend, so there is nothing else to configure.

> **Back up `backend/.env`.** If `VAULT_MASTER_KEY` is lost, saved passwords cannot be decrypted. Never commit it (it is in `.gitignore`).

## Running the tests

```bash
cd backend
pytest -q
```

Covers registration, login (incl. lockout, expired/forged tokens, logout revocation), encryption/decryption (tamper detection, key wrapping, ciphertext-only storage), vault CRUD (incl. cross-user isolation and SQL-injection attempts), the generator, the strength checker and API validation.

## Project structure

```
SecureVault/
├── backend/
│   ├── app/
│   │   ├── api/        # routers: auth, vault, tools + auth dependencies
│   │   ├── core/       # config (env), crypto (AES-GCM / HKDF), security (Argon2, JWT)
│   │   ├── models/     # SQLAlchemy models: User, VaultEntry, RevokedToken
│   │   ├── schemas/    # Pydantic request/response models
│   │   ├── services/   # vault logic, password generator & strength checker
│   │   ├── utils/      # logging setup
│   │   ├── database.py
│   │   └── main.py
│   ├── tests/
│   ├── generate_keys.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/
│       ├── components/ # EntryCard, EntryForm, PasswordGenerator, StrengthMeter, ...
│       ├── pages/      # Landing, Login, Register, Dashboard, Vault, Add/Edit, Generator, Security, Profile
│       ├── layouts/    # AppLayout (sidebar / mobile tab bar), AuthLayout
│       ├── services/   # api client, auth context, generator + strength logic
│       └── assets/
├── docs/               # SECURITY.md, API.md
├── README.md
├── .gitignore
└── LICENSE
```

## Security implementation

Full details are in [docs/SECURITY.md](docs/SECURITY.md). In short:

- **Envelope encryption, no single hardcoded key.** Each user gets a random 32-byte data key (DEK). The DEK is wrapped with AES-256-GCM under a key derived by HKDF-SHA256 from `VAULT_MASTER_KEY` (environment variable) and a per-user random salt. Passwords are encrypted with the DEK, using a fresh 12-byte nonce each time and the user id as associated data. The JWT secret is a separate secret, and no encryption key is derived from it.
- **Login passwords** are hashed with Argon2id and never stored or logged in plaintext.
- **Passwords are never returned in lists.** The API only decrypts one entry at a time via `/vault/{id}/reveal` (`Cache-Control: no-store`), and only for its owner.
- **Authentication and authorization**: short-lived JWTs (30 min default), server-side revocation on logout, per-account lockout after 5 failed logins, every query scoped to the current user (other users' ids return 404).
- **SQL injection**: all queries go through SQLAlchemy's parameterized API; search input is covered by tests.
- **No sensitive logging**: no request bodies are logged, and tests assert the database contains only ciphertext.
- **Client side**: token kept in `sessionStorage`, idle auto-logout (15 min), password auto-hide after 15 s, clipboard cleared 30 s after copying, external links use `rel="noopener noreferrer"`.

### Know the limits

- This is **server-side** encryption. Anyone who has *both* the database file and `VAULT_MASTER_KEY` can decrypt the vault, so protect both and use it on a machine you control. A zero-knowledge design (encrypting in the browser with a key derived from the master password) is listed under Future Improvements.
- Only the password field is encrypted. Site name, URL, username, category and notes are stored as plain text so they can be searched. Don't put secrets in notes.
- Run behind HTTPS if you expose it beyond localhost.

## Screenshots

Screenshots were not generated automatically. After running the app, save yours to `docs/screenshots/` and link them here:

```
![Landing](docs/screenshots/landing.png)
![Dashboard](docs/screenshots/dashboard.png)
![Vault](docs/screenshots/vault.png)
```

## Future improvements

- Zero-knowledge mode (client-side encryption with a key derived from the master password)
- Two-factor authentication (TOTP) and passkeys
- Encrypted notes and custom fields, file attachments
- Import/export (CSV, Bitwarden, encrypted backup)
- Master-key rotation command and Alembic migrations
- Breached-password check (k-anonymity) and password-age reminders
- Browser extension for autofill
- Docker Compose setup and CI pipeline
