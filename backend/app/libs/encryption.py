"""
Encryption utilities for sensitive data like access tokens
"""

import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


def get_encryption_key() -> bytes:
    """Generate or retrieve encryption key from environment variable"""
    encryption_key = os.getenv("ENCRYPTION_KEY")
    
    if not encryption_key:
        key = Fernet.generate_key()
        print(f"🔑 Generated new encryption key. Add to .env: ENCRYPTION_KEY={key.decode()}")
        return key
    
    return encryption_key.encode()


def get_fernet() -> Fernet:
    """Get Fernet instance for encryption/decryption"""
    key = get_encryption_key()
    return Fernet(key)


def encrypt_token(token: str) -> str:
    """Encrypt a token for secure storage"""
    if not token:
        return token
        
    try:
        fernet = get_fernet()
        encrypted_bytes = fernet.encrypt(token.encode())
        return base64.b64encode(encrypted_bytes).decode()
    except Exception as e:
        print(f"❌ Encryption Error: {e}")
        return token


def decrypt_token(encrypted_token: str) -> str:
    """Decrypt a token for use"""
    if not encrypted_token:
        return encrypted_token
        
    try:
        fernet = get_fernet()
        encrypted_bytes = base64.b64decode(encrypted_token.encode())
        decrypted_bytes = fernet.decrypt(encrypted_bytes)
        return decrypted_bytes.decode()
    except Exception as e:
        print(f"❌ Decryption Error: {e}")
        if encrypted_token.startswith('gho_') or encrypted_token.startswith('ghp_'):
            return encrypted_token
        return encrypted_token
