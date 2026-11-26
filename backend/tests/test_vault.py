from tests.conftest import make_user_headers

ENTRY = {"site_name": "GitHub", "site_url": "https://github.com", "username": "alice", "password": "Gh-Pa55!word", "category": "Work", "notes": "2FA on"}


def create(client, auth, **over):
    return client.post("/api/vault", headers=auth, json={**ENTRY, **over})


def test_create_and_response_has_no_password(client, auth):
    r = create(client, auth)
    assert r.status_code == 201
    body = r.json()
    assert body["site_name"] == "GitHub" and body["category"] == "Work" and body["created_at"]
    assert "password" not in body and "encrypted_password" not in body


def test_reveal_returns_plaintext_with_no_store(client, auth):
    eid = create(client, auth).json()["id"]
    r = client.get(f"/api/vault/{eid}/reveal", headers=auth)
    assert r.json()["password"] == ENTRY["password"]
    assert "no-store" in r.headers["cache-control"]


def test_list_and_read(client, auth):
    create(client, auth)
    create(client, auth, site_name="Gmail", category="Email")
    items = client.get("/api/vault", headers=auth).json()
    assert len(items) == 2
    assert all("password" not in i for i in items)
    assert client.get(f"/api/vault/{items[0]['id']}", headers=auth).status_code == 200


def test_search_and_category_filter(client, auth):
    create(client, auth)
    create(client, auth, site_name="Gmail", site_url="https://mail.google.com", category="Email", username="alice@gmail.com")
    assert [i["site_name"] for i in client.get("/api/vault?q=gmail", headers=auth).json()] == ["Gmail"]
    assert len(client.get("/api/vault?category=Work", headers=auth).json()) == 1
    assert client.get("/api/vault?q=zzzz", headers=auth).json() == []


def test_search_is_sql_injection_safe(client, auth):
    create(client, auth)
    r = client.get("/api/vault", headers=auth, params={"q": "' OR '1'='1"})
    assert r.status_code == 200 and r.json() == []
    r = client.get("/api/vault", headers=auth, params={"q": "'; DROP TABLE vault_entries;--"})
    assert r.status_code == 200
    assert len(client.get("/api/vault", headers=auth).json()) == 1


def test_update_keeps_password_when_omitted_and_changes_when_given(client, auth):
    eid = create(client, auth).json()["id"]
    body = {k: v for k, v in ENTRY.items() if k != "password"} | {"site_name": "GitHub Inc"}
    r = client.put(f"/api/vault/{eid}", headers=auth, json=body)
    assert r.json()["site_name"] == "GitHub Inc"
    assert client.get(f"/api/vault/{eid}/reveal", headers=auth).json()["password"] == ENTRY["password"]
    client.put(f"/api/vault/{eid}", headers=auth, json={**body, "password": "NewPass#999"})
    assert client.get(f"/api/vault/{eid}/reveal", headers=auth).json()["password"] == "NewPass#999"


def test_delete(client, auth):
    eid = create(client, auth).json()["id"]
    assert client.delete(f"/api/vault/{eid}", headers=auth).status_code == 204
    assert client.get(f"/api/vault/{eid}", headers=auth).status_code == 404


def test_validation(client, auth):
    assert client.post("/api/vault", headers=auth, json={"site_name": "", "password": "x"}).status_code == 422
    assert client.post("/api/vault", headers=auth, json={"site_name": "x"}).status_code == 422


def test_users_cannot_access_each_others_entries(client, auth):
    eid = create(client, auth).json()["id"]
    other = make_user_headers(client, "bob@example.com")
    assert client.get("/api/vault", headers=other).json() == []
    assert client.get(f"/api/vault/{eid}", headers=other).status_code == 404
    assert client.get(f"/api/vault/{eid}/reveal", headers=other).status_code == 404
    assert client.put(f"/api/vault/{eid}", headers=other, json={"site_name": "hack"}).status_code in (404, 422)
    assert client.delete(f"/api/vault/{eid}", headers=other).status_code == 404
    assert client.get(f"/api/vault/{eid}/reveal", headers=auth).json()["password"] == ENTRY["password"]


def test_stats(client, auth):
    create(client, auth)
    create(client, auth, site_name="Gmail", category="Email")
    create(client, auth, site_name="Slack", category="Work")
    s = client.get("/api/vault/stats", headers=auth).json()
    assert s["total"] == 3 and s["categories"] == {"Work": 2, "Email": 1}
    assert len(s["recent"]) == 3 and "password" not in s["recent"][0]


def test_vault_requires_auth(client):
    assert client.post("/api/vault", json=ENTRY).status_code == 401
    assert client.get("/api/vault/1/reveal").status_code == 401


def test_timestamps_are_utc_aware(client, auth):
    body = create(client, auth).json()
    assert body["created_at"].endswith("Z") or body["created_at"].endswith("+00:00")
