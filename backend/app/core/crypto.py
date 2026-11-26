"""
Key management design (envelope encryption)
-------------------------------------------
* VAULT_MASTER_KEY (env, 32 random bytes) is never used to encrypt passwords directly.
* HKDF-SHA256(master_key, salt=<per-user random salt>, info="securevault/kek/v1")
  derives a per-user Key Encryption Key (KEK).
* On registration a random 32-byte Data Encryption Key (DEK) is generated per user,
  then wrapped (AES-256-GCM) with that KEK and stored in the `users` table.
* Vault passwords are encrypted with the user's DEK using AES-256-GCM
  (fresh 12-byte nonce each time, user id bound as associated data).
* JWT secret is a completely separate secret; no key is derived from it.

Changing a user's login password does not require re-encrypting the vault,
and rotating the master key only requires re-wrapping DEKs.
"""
import base64
import os

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

NONCE_SIZE = 12
KEY_SIZE = 32
KEK_INFO = b"securevault/kek/v1"
VERSION = b"\x01"


class CryptoError(Exception):
    pass


def generate_salt() -> bytes:
    return os.urandom(16)


def generate_dek() -> bytes:
    return AESGCM.generate_key(bit_length=256)


def derive_kek(master_key: bytes, salt: bytes) -> bytes:
    return HKDF(algorithm=hashes.SHA256(), length=KEY_SIZE, salt=salt, info=KEK_INFO).derive(master_key)


def _encrypt(key: bytes, plaintext: bytes, aad: bytes) -> bytes:
    nonce = os.urandom(NONCE_SIZE)
    return VERSION + nonce + AESGCM(key).encrypt(nonce, plaintext, aad)


def _decrypt(key: bytes, blob: bytes, aad: bytes) -> bytes:
    if len(blob) < 1 + NONCE_SIZE + 16 or blob[:1] != VERSION:
        raise CryptoError("Malformed ciphertext")
    nonce = blob[1 : 1 + NONCE_SIZE]
    try:
        return AESGCM(key).decrypt(nonce, blob[1 + NONCE_SIZE :], aad)
    except Exception as exc:  # noqa: BLE001
        raise CryptoError("Decryption failed (wrong key or tampered data)") from exc


def wrap_dek(master_key: bytes, salt: bytes, dek: bytes) -> bytes:
    return _encrypt(derive_kek(master_key, salt), dek, b"dek-wrap")


def unwrap_dek(master_key: bytes, salt: bytes, wrapped: bytes) -> bytes:
    return _decrypt(derive_kek(master_key, salt), wrapped, b"dek-wrap")


def encrypt_secret(dek: bytes, plaintext: str, user_id: int) -> str:
    blob = _encrypt(dek, plaintext.encode("utf-8"), f"user:{user_id}".encode())
    return base64.b64encode(blob).decode("ascii")


def decrypt_secret(dek: bytes, token: str, user_id: int) -> str:
    try:
        blob = base64.b64decode(token.encode("ascii"), validate=True)
    except Exception as exc:  # noqa: BLE001
        raise CryptoError("Malformed ciphertext") from exc
    return _decrypt(dek, blob, f"user:{user_id}".encode()).decode("utf-8")
