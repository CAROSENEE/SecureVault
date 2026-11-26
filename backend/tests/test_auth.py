from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import get_settings
from tests.conftest import PASSWORD, login, register


def test_register_success_and_no_secret_leak(client):
    r = register(client)
    assert r.status_code == 201
    body = r.json()
    assert body["email"] == "alice@example.com"
    assert "password" not in str(body).lower().replace("full_name", "")
    assert "wrapped_dek" not in body


def test_register_duplicate_email(client):
    register(client)
    assert register(client).status_code == 409


def test_register_weak_password_rejected(client):
    assert register(client, password="short").status_code == 422
    assert register(client, password="alllowercase123").status_code == 422


def test_register_invalid_email(client):
    assert register(client, email="not-an-email").status_code == 422


def test_password_is_hashed_not_plaintext(client):
    register(client)
    from app.database import get_engine
    from sqlalchemy import text

    with get_engine().connect() as conn:
        h = conn.execute(text("select password_hash from users")).scalar()
    assert h.startswith("$argon2id$") and PASSWORD not in h


def test_login_success(client):
    register(client)
    r = login(client)
    assert r.status_code == 200
    assert r.json()["token_type"] == "bearer" and r.json()["access_token"]


def test_login_wrong_password_and_unknown_user(client):
    register(client)
    assert login(client, password="WrongPassw0rd!").status_code == 401
    assert login(client, email="nobody@example.com").status_code == 401


def test_login_lockout_after_repeated_failures(client):
    register(client)
    for _ in range(5):
        assert login(client, password="WrongPassw0rd!").status_code == 401
    assert login(client).status_code == 429  # even correct password is locked out


def test_protected_route_requires_token(client):
    assert client.get("/api/vault").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer garbage"}).status_code == 401


def test_me_and_profile_update(client, auth):
    assert client.get("/api/auth/me", headers=auth).json()["email"] == "alice@example.com"
    r = client.patch("/api/auth/me", headers=auth, json={"full_name": "Alice B"})
    assert r.json()["full_name"] == "Alice B"


def test_expired_token_rejected(client):
    register(client)
    s = get_settings()
    now = datetime.now(timezone.utc)
    token = jwt.encode({"sub": "1", "jti": "x", "exp": now - timedelta(minutes=1)}, s.jwt_secret, algorithm="HS256")
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401 and "expired" in r.json()["detail"].lower()


def test_token_signed_with_other_secret_rejected(client):
    register(client)
    token = jwt.encode({"sub": "1", "jti": "x", "exp": datetime.now(timezone.utc) + timedelta(minutes=5)}, "z" * 40, algorithm="HS256")
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_logout_revokes_token(client, auth):
    assert client.post("/api/auth/logout", headers=auth).status_code == 204
    assert client.get("/api/auth/me", headers=auth).status_code == 401


def test_change_password(client, auth):
    new = "An0therStrongPass"
    assert client.post("/api/auth/change-password", headers=auth, json={"current_password": "bad", "new_password": new}).status_code == 400
    assert client.post("/api/auth/change-password", headers=auth, json={"current_password": PASSWORD, "new_password": new}).status_code == 204
    assert login(client).status_code == 401
    assert login(client, password=new).status_code == 200


def test_vault_survives_password_change(client, auth):
    e = client.post("/api/vault", headers=auth, json={"site_name": "X", "password": "keep-me-123"}).json()
    new = "An0therStrongPass"
    client.post("/api/auth/change-password", headers=auth, json={"current_password": PASSWORD, "new_password": new})
    h = {"Authorization": f"Bearer {login(client, password=new).json()['access_token']}"}
    assert client.get(f"/api/vault/{e['id']}/reveal", headers=h).json()["password"] == "keep-me-123"


def test_delete_account(client, auth):
    assert client.post("/api/auth/delete-account", headers=auth, json={"password": "nope"}).status_code == 400
    assert client.post("/api/auth/delete-account", headers=auth, json={"password": PASSWORD}).status_code == 204
    assert login(client).status_code == 401
