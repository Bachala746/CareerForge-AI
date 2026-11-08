"""User schemas for InterviewOS."""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, HttpUrl, field_validator


class UserProfileUpdate(BaseModel):
    """Schema for updating user profile fields (all optional)."""

    target_role: Optional[str] = Field(None, max_length=255, description="Desired job role")
    target_company: Optional[str] = Field(None, max_length=255, description="Target company")
    experience_level: Optional[str] = Field(
        None,
        description="Experience level: fresher, junior, mid, senior",
    )
    university: Optional[str] = Field(None, max_length=255, description="University name")
    cgpa: Optional[float] = Field(None, ge=0.0, le=10.0, description="CGPA on 10-point scale")
    linkedin_url: Optional[str] = Field(None, max_length=500, description="LinkedIn profile URL")
    github_url: Optional[str] = Field(None, max_length=500, description="GitHub profile URL")
    phone: Optional[str] = Field(None, max_length=20, description="Phone number")
    location: Optional[str] = Field(None, max_length=255, description="City / Country")
    bio: Optional[str] = Field(None, max_length=1000, description="Short personal bio")

    @field_validator("experience_level")
    @classmethod
    def validate_experience_level(cls, v: Optional[str]) -> Optional[str]:
        """Ensure experience level is one of allowed values."""
        allowed = {"fresher", "junior", "mid", "senior", None}
        if v is not None and v.lower() not in allowed:
            raise ValueError(f"experience_level must be one of: {', '.join(x for x in allowed if x)}")
        return v.lower() if v else v

    model_config = {
        "json_schema_extra": {
            "example": {
                "target_role": "Software Engineer",
                "target_company": "Google",
                "experience_level": "junior",
                "university": "MIT",
                "cgpa": 8.5,
                "linkedin_url": "https://linkedin.com/in/johndoe",
                "github_url": "https://github.com/johndoe",
                "phone": "+1-555-0100",
                "location": "San Francisco, CA",
                "bio": "Passionate about distributed systems.",
            }
        }
    }


class UserResponse(BaseModel):
    """Schema for returning user data in responses."""

    id: UUID = Field(..., description="User UUID")
    email: EmailStr = Field(..., description="Email address")
    full_name: str = Field(..., description="Full name")
    avatar_url: Optional[str] = Field(None, description="Avatar image URL")
    role: str = Field(..., description="System role: user or admin")
    created_at: datetime = Field(..., description="Account creation timestamp")
    profile: Optional[dict[str, Any]] = Field(None, description="Extended profile data")

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "email": "john@example.com",
                "full_name": "John Doe",
                "avatar_url": "https://example.com/avatar.png",
                "role": "user",
                "created_at": "2024-01-01T00:00:00Z",
                "profile": {"target_role": "SWE", "experience_level": "junior"},
            }
        },
    }


class UserStatsResponse(BaseModel):
    """Schema for user performance statistics."""

    total_interviews: int = Field(..., ge=0, description="Total completed interview sessions")
    streak_days: int = Field(..., ge=0, description="Current consecutive practice day streak")
    readiness_score: float = Field(..., ge=0.0, le=100.0, description="Overall readiness score (0-100)")
    avg_technical: float = Field(..., ge=0.0, le=10.0, description="Average technical score (0-10)")
    avg_communication: float = Field(..., ge=0.0, le=10.0, description="Average communication score (0-10)")
    avg_confidence: float = Field(..., ge=0.0, le=10.0, description="Average confidence score (0-10)")
    best_score: float = Field(..., ge=0.0, le=100.0, description="Best overall session score")
    hours_practiced: float = Field(..., ge=0.0, description="Total hours spent practicing")

    model_config = {
        "json_schema_extra": {
            "example": {
                "total_interviews": 12,
                "streak_days": 5,
                "readiness_score": 74.5,
                "avg_technical": 7.2,
                "avg_communication": 6.8,
                "avg_confidence": 7.0,
                "best_score": 88.0,
                "hours_practiced": 18.5,
            }
        }
    }
