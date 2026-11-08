"""Interview session schemas for InterviewOS."""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class InterviewSetupRequest(BaseModel):
    """Schema for creating a new interview session."""

    company: str = Field(..., min_length=1, max_length=255, description="Target company name")
    role: str = Field(..., min_length=1, max_length=255, description="Job role being interviewed for")
    interview_type: str = Field(
        ...,
        description="Type: technical, behavioral, mixed, system_design, hr",
    )
    personality: str = Field(
        ...,
        description="Interviewer persona: friendly, strict, socratic, recruiter",
    )
    difficulty: str = Field(..., description="Difficulty level: easy, medium, hard")
    duration_minutes: int = Field(..., ge=10, le=120, description="Session duration in minutes")
    experience_level: str = Field(
        ...,
        description="Candidate experience: fresher, junior, mid, senior",
    )

    @field_validator("interview_type")
    @classmethod
    def validate_interview_type(cls, v: str) -> str:
        allowed = {"technical", "behavioral", "mixed", "system_design", "hr"}
        if v.lower() not in allowed:
            raise ValueError(f"interview_type must be one of: {', '.join(allowed)}")
        return v.lower()

    @field_validator("personality")
    @classmethod
    def validate_personality(cls, v: str) -> str:
        allowed = {"friendly", "strict", "socratic", "recruiter"}
        if v.lower() not in allowed:
            raise ValueError(f"personality must be one of: {', '.join(allowed)}")
        return v.lower()

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, v: str) -> str:
        allowed = {"easy", "medium", "hard"}
        if v.lower() not in allowed:
            raise ValueError(f"difficulty must be one of: {', '.join(allowed)}")
        return v.lower()

    @field_validator("experience_level")
    @classmethod
    def validate_experience_level(cls, v: str) -> str:
        allowed = {"fresher", "junior", "mid", "senior"}
        if v.lower() not in allowed:
            raise ValueError(f"experience_level must be one of: {', '.join(allowed)}")
        return v.lower()

    model_config = {
        "json_schema_extra": {
            "example": {
                "company": "Google",
                "role": "Software Engineer",
                "interview_type": "technical",
                "personality": "friendly",
                "difficulty": "medium",
                "duration_minutes": 45,
                "experience_level": "junior",
            }
        }
    }


class SubmitAnswerRequest(BaseModel):
    """Schema for submitting an answer to a question."""

    answer_text: str = Field(..., min_length=1, description="The candidate's answer text")
    duration_secs: int = Field(..., ge=0, description="Time taken to answer in seconds")

    model_config = {
        "json_schema_extra": {
            "example": {
                "answer_text": "I would use a hash map to achieve O(1) lookup...",
                "duration_secs": 120,
            }
        }
    }


class NextQuestionRequest(BaseModel):
    """Schema for requesting the next interview question."""

    previous_answer: Optional[str] = Field(
        None, description="Optional previous answer for context-aware follow-up"
    )

    model_config = {
        "json_schema_extra": {
            "example": {"previous_answer": "I used a two-pointer approach because..."}
        }
    }


class QuestionResponse(BaseModel):
    """Schema for a single interview question."""

    id: UUID = Field(..., description="Question UUID")
    question_text: str = Field(..., description="The question content")
    question_type: str = Field(..., description="Category: coding, behavioral, system_design, etc.")
    order: int = Field(..., ge=1, description="Question sequence number in the session")
    context: Optional[dict[str, Any]] = Field(
        None, description="Additional context such as hints or follow-up prompts"
    )

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440001",
                "question_text": "Explain the difference between a process and a thread.",
                "question_type": "technical",
                "order": 1,
                "context": {"hint": "Think about memory and scheduling"},
            }
        },
    }


class InterviewSessionResponse(BaseModel):
    """Schema for returning an interview session with its questions."""

    id: UUID = Field(..., description="Session UUID")
    company: str = Field(..., description="Company name")
    role: str = Field(..., description="Job role")
    interview_type: str = Field(..., description="Interview type")
    personality: str = Field(..., description="Interviewer personality")
    status: str = Field(..., description="Session status: active, completed, abandoned")
    started_at: datetime = Field(..., description="Session start timestamp")
    questions: list[QuestionResponse] = Field(default_factory=list, description="List of questions")

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440002",
                "company": "Google",
                "role": "Software Engineer",
                "interview_type": "technical",
                "personality": "friendly",
                "status": "active",
                "started_at": "2024-01-01T09:00:00Z",
                "questions": [],
            }
        },
    }
