import string

import pytest

from app.services.password_tools import SYMBOLS, check_strength, generate_password


def test_length_and_default_charset():
    p = generate_password(24)
    assert len(p) == 24


@pytest.mark.parametrize("opts,allowed", [
    (dict(uppercase=True, lowercase=False, numbers=False, symbols=False), string.ascii_uppercase),
    (dict(uppercase=False, lowercase=True, numbers=False, symbols=False), string.ascii_lowercase),
    (dict(uppercase=False, lowercase=False, numbers=True, symbols=False), string.digits),
    (dict(uppercase=False, lowercase=False, numbers=False, symbols=True), SYMBOLS),
])
def test_single_charset(opts, allowed):
    p = generate_password(40, **opts)
    assert set(p) <= set(allowed)


def test_all_selected_classes_present():
    for _ in range(50):
        p = generate_password(8)
        assert any(c.isupper() for c in p) and any(c.islower() for c in p)
        assert any(c.isdigit() for c in p) and any(c in SYMBOLS for c in p)


def test_passwords_are_random():
    assert len({generate_password(20) for _ in range(100)}) == 100


def test_no_options_raises():
    with pytest.raises(ValueError):
        generate_password(12, False, False, False, False)


def test_strength_levels():
    assert check_strength("abc")["label"] == "Weak"
    assert check_strength("password123")["label"] == "Weak"
    assert check_strength("Summer2024")["label"] in ("Weak", "Medium")
    assert check_strength("Tr1cky-Horse-Battery!9x")["label"] == "Strong"
    assert check_strength(generate_password(20))["label"] == "Strong"


def test_suggestions():
    s = check_strength("abcdefgh")["suggestions"]
    joined = " ".join(s)
    assert "uppercase" in joined and "numbers" in joined and "special" in joined and "12" in joined


def test_generate_api(client, auth):
    r = client.post("/api/tools/generate", headers=auth, json={"length": 20, "symbols": False})
    assert r.status_code == 200 and len(r.json()["password"]) == 20
    assert not set(r.json()["password"]) & set(SYMBOLS)
    assert "no-store" in r.headers["cache-control"]


def test_generate_api_validation(client, auth):
    assert client.post("/api/tools/generate", headers=auth, json={"length": 4}).status_code == 422
    assert client.post("/api/tools/generate", headers=auth, json={"uppercase": False, "lowercase": False, "numbers": False, "symbols": False}).status_code == 422


def test_strength_api(client, auth):
    r = client.post("/api/tools/strength", headers=auth, json={"password": "abc"})
    assert r.status_code == 200 and r.json()["label"] == "Weak" and r.json()["suggestions"]


def test_tools_require_auth(client):
    assert client.post("/api/tools/generate", json={}).status_code == 401


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}
