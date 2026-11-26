import base64
import os
import tempfile

# Test-only secrets, set BEFORE the app is imported.
_tmp = tempfile.mkdtemp()
os.environ["VAULT_MASTER_KEY"] = base64.b64encode(os.urandom(32)).decode()
os.environ["JWT_SECRET"] = base64.b64encode(os.urandom(48)).decode()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, get_engine  # noqa: E402
from app.main import app  # noqa: E402

PASSWORD = "Str0ngPassw0rd!"


@pytest.fixture()
def client():
    with TestClient(app) as c:
        engine = get_engine()
        Base.metadata.drop_all(engine)
        Base.metadata.create_all(engine)
        yield c


def register(client, email="alice@example.com", password=PASSWORD, name="Alice"):
    return client.post("/api/auth/register", json={"email": email, "password": password, "full_name": name})


def login(client, email="alice@example.com", password=PASSWORD):
    return client.post("/api/auth/login", json={"email": email, "password": password})


@pytest.fixture()
def auth(client):
    register(client)
    token = login(client).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def make_user_headers(client, email):
    register(client, email=email)
    return {"Authorization": f"Bearer {login(client, email).json()['access_token']}"}
