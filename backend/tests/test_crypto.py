import base64
import os

import pytest

from app.core import crypto


def test_roundtrip():
    dek = crypto.generate_dek()
    token = crypto.encrypt_secret(dek, "p@ssw0rd-ünïcode-🔐", 1)
    assert "p@ssw0rd" not in token
    assert crypto.decrypt_secret(dek, token, 1) == "p@ssw0rd-ünïcode-🔐"


def test_nonce_is_random_so_ciphertexts_differ():
    dek = crypto.generate_dek()
    assert crypto.encrypt_secret(dek, "same", 1) != crypto.encrypt_secret(dek, "same", 1)


def test_wrong_key_fails():
    t = crypto.encrypt_secret(crypto.generate_dek(), "secret", 1)
    with pytest.raises(crypto.CryptoError):
        crypto.decrypt_secret(crypto.generate_dek(), t, 1)


def test_tampering_detected():
    dek = crypto.generate_dek()
    raw = bytearray(base64.b64decode(crypto.encrypt_secret(dek, "secret", 1)))
    raw[-1] ^= 1
    with pytest.raises(crypto.CryptoError):
        crypto.decrypt_secret(dek, base64.b64encode(bytes(raw)).decode(), 1)


def test_ciphertext_bound_to_user():
    dek = crypto.generate_dek()
    t = crypto.encrypt_secret(dek, "secret", 1)
    with pytest.raises(crypto.CryptoError):
        crypto.decrypt_secret(dek, t, 2)


def test_malformed_input():
    with pytest.raises(crypto.CryptoError):
        crypto.decrypt_secret(crypto.generate_dek(), "!!!notbase64", 1)
    with pytest.raises(crypto.CryptoError):
        crypto.decrypt_secret(crypto.generate_dek(), base64.b64encode(b"short").decode(), 1)


def test_key_wrapping_roundtrip_and_isolation():
    master = os.urandom(32)
    dek = crypto.generate_dek()
    s1, s2 = crypto.generate_salt(), crypto.generate_salt()
    wrapped = crypto.wrap_dek(master, s1, dek)
    assert crypto.unwrap_dek(master, s1, wrapped) == dek
    with pytest.raises(crypto.CryptoError):
        crypto.unwrap_dek(master, s2, wrapped)  # different salt -> different KEK
    with pytest.raises(crypto.CryptoError):
        crypto.unwrap_dek(os.urandom(32), s1, wrapped)  # different master key


def test_kek_differs_per_user_salt_and_from_master():
    master = os.urandom(32)
    assert crypto.derive_kek(master, b"a" * 16) != crypto.derive_kek(master, b"b" * 16)
    assert crypto.derive_kek(master, b"a" * 16) != master


def test_db_stores_only_ciphertext(client, auth):
    client.post("/api/vault", headers=auth, json={"site_name": "Bank", "password": "SuperSecretValue!42"})
    from app.database import get_engine
    from sqlalchemy import text

    with get_engine().connect() as conn:
        stored = conn.execute(text("select encrypted_password from vault_entries")).scalar()
    assert "SuperSecretValue" not in stored
    assert len(base64.b64decode(stored)) > 1 + 12 + 16


def test_each_user_has_distinct_wrapped_key(client):
    from tests.conftest import register
    from app.database import get_engine
    from sqlalchemy import text

    register(client, email="a@example.com")
    register(client, email="b@example.com")
    with get_engine().connect() as conn:
        rows = conn.execute(text("select wrapped_dek, kek_salt from users")).all()
    assert rows[0][0] != rows[1][0] and rows[0][1] != rows[1][1]
