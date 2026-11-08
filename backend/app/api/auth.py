from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user
from app.core.security import (
    get_password_hash, verify_password,
    create_access_token, create_refresh_token, decode_token
)
from app.models.user import User, UserProfile
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RefreshRequest

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _build_token_response(user: User) -> dict:
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
            "role": user.role,
        }
    }


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account."""
    if db.query(User).filter(User.email == payload.email.lower()).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email.lower().strip(),
        password_hash=get_password_hash(payload.password),
        full_name=payload.full_name.strip(),
    )
    db.add(user)
    db.flush()

    profile = UserProfile(user_id=user.id)
    db.add(profile)
    db.commit()
    db.refresh(user)

    return _build_token_response(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return JWT tokens."""
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")
    return _build_token_response(user)


@router.post("/refresh")
def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    """Issue a new access token using refresh token."""
    token_data = decode_token(payload.refresh_token)
    if not token_data or token_data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.query(User).filter(User.id == int(token_data["sub"])).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")

    return {
        "access_token": create_access_token(subject=user.id),
        "token_type": "bearer"
    }


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """Logout (client should delete tokens)."""
    return {"message": "Logged out successfully"}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "avatar_url": current_user.avatar_url,
        "role": current_user.role,
        "created_at": current_user.created_at,
    }
