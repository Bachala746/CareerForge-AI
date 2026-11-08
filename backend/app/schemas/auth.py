"""Authentication schemas for InterviewOS."""

from typing import Any

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    """Schema for user registration."""

    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=8, description="Password (minimum 8 characters)")
    full_name: str = Field(..., min_length=1, max_length=255, description="User's full name")

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Validate password has at least one digit and one letter."""
        if not any(c.isalpha() for c in v):
            raise ValueError("Password must contain at least one letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "john.doe@example.com",
                "password": "SecurePass1",
                "full_name": "John Doe",
            }
        }
    }


class LoginRequest(BaseModel):
    """Schema for user login."""

    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "john.doe@example.com",
                "password": "SecurePass1",
            }
        }
    }


class TokenResponse(BaseModel):
    """Schema for JWT token response."""

    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    user: dict[str, Any] = Field(..., description="Authenticated user data")

    model_config = {
        "json_schema_extra": {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user": {"id": "uuid-here", "email": "john@example.com", "full_name": "John Doe"},
            }
        }
    }


class RefreshRequest(BaseModel):
    """Schema for token refresh."""

    refresh_token: str = Field(..., description="JWT refresh token")

    model_config = {
        "json_schema_extra": {
            "example": {"refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
        }
    }
