from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from app.core.config import settings

# Use argon2 — fully compatible with Python 3.14, no bcrypt 72-byte bug
try:
    from argon2 import PasswordHasher
    from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
    _ph = PasswordHasher(time_cost=2, memory_cost=65536, parallelism=2)
    _USE_ARGON2 = True
except ImportError:
    _USE_ARGON2 = False
    # Fallback to hashlib sha256 (no external deps needed)
    import hashlib, secrets as _secrets
    _SALT = "interviewos-salt-2026"


def get_password_hash(password: str) -> str:
    if _USE_ARGON2:
        return _ph.hash(password)
    # Simple sha256 fallback (dev only)
    return hashlib.sha256(f"{_SALT}{password}".encode()).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if _USE_ARGON2:
        # Support both argon2 hashes and legacy sha256 hashes
        if hashed_password.startswith("$argon2"):
            try:
                return _ph.verify(hashed_password, plain_password)
            except (VerifyMismatchError, VerificationError, InvalidHashError):
                return False
        else:
            # Legacy sha256
            import hashlib
            return hashlib.sha256(f"{_SALT}{plain_password}".encode()).hexdigest() == hashed_password
    import hashlib
    return hashlib.sha256(f"{_SALT}{plain_password}".encode()).hexdigest() == hashed_password


def create_access_token(subject: Union[str, int], expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: Union[str, int]) -> str:
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
