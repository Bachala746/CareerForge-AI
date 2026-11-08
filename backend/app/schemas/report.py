"""Report and analysis schemas for InterviewOS."""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class AnalysisResponse(BaseModel):
    """Schema mirroring AIAnalysis model — per-answer AI feedback."""

    id: UUID = Field(..., description="Analysis UUID")
    session_id: UUID = Field(..., description="Parent session UUID")
    question_id: UUID = Field(..., description="Question UUID that was answered")
    answer_id: UUID = Field(..., description="Answer UUID that was analysed")

    # Scores
    technical_score: Optional[float] = Field(None, ge=0.0, le=10.0, description="Technical accuracy (0-10)")
    communication_score: Optional[float] = Field(None, ge=0.0, le=10.0, description="Communication clarity (0-10)")
    confidence_score: Optional[float] = Field(None, ge=0.0, le=10.0, description="Confidence level (0-10)")
    relevance_score: Optional[float] = Field(None, ge=0.0, le=10.0, description="Answer relevance (0-10)")
    depth_score: Optional[float] = Field(None, ge=0.0, le=10.0, description="Answer depth (0-10)")
    overall_score: Optional[float] = Field(None, ge=0.0, le=10.0, description="Weighted overall (0-10)")

    # Feedback
    strengths: Optional[list[str]] = Field(None, description="Identified strengths")
    weaknesses: Optional[list[str]] = Field(None, description="Areas for improvement")
    suggestions: Optional[list[str]] = Field(None, description="Actionable suggestions")
    model_feedback: Optional[str] = Field(None, description="Detailed AI-generated feedback")
    ideal_answer_hint: Optional[str] = Field(None, description="High-level hint toward an ideal answer")

    # Keywords
    keywords_used: Optional[list[str]] = Field(None, description="Technical keywords detected")
    keywords_missing: Optional[list[str]] = Field(None, description="Expected keywords not found")

    created_at: datetime = Field(..., description="Timestamp of analysis creation")

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440010",
                "session_id": "550e8400-e29b-41d4-a716-446655440002",
                "question_id": "550e8400-e29b-41d4-a716-446655440001",
                "answer_id": "550e8400-e29b-41d4-a716-446655440005",
                "technical_score": 7.5,
                "communication_score": 8.0,
                "confidence_score": 6.5,
                "relevance_score": 8.5,
                "depth_score": 7.0,
                "overall_score": 7.5,
                "strengths": ["Good use of examples", "Clear structure"],
                "weaknesses": ["Missed edge cases"],
                "suggestions": ["Discuss time complexity explicitly"],
                "model_feedback": "Overall a solid answer...",
                "ideal_answer_hint": "Consider also mentioning memory allocation.",
                "keywords_used": ["hash map", "O(1)"],
                "keywords_missing": ["collision resolution"],
                "created_at": "2024-01-01T09:15:00Z",
            }
        },
    }


class ReportResponse(BaseModel):
    """Schema mirroring RecruiterReport model — full session report."""

    id: UUID = Field(..., description="Report UUID")
    session_id: UUID = Field(..., description="Parent session UUID")
    user_id: UUID = Field(..., description="User UUID")

    # Overall scores
    overall_score: Optional[float] = Field(None, ge=0.0, le=100.0, description="Overall session score (0-100)")
    technical_score: Optional[float] = Field(None, ge=0.0, le=10.0, description="Average technical score")
    communication_score: Optional[float] = Field(None, ge=0.0, le=10.0, description="Average communication score")
    confidence_score: Optional[float] = Field(None, ge=0.0, le=10.0, description="Average confidence score")
    problem_solving_score: Optional[float] = Field(None, ge=0.0, le=10.0, description="Problem-solving score")

    # Hire recommendation
    hire_recommendation: Optional[str] = Field(
        None,
        description="Recommendation: strong_yes, yes, maybe, no, strong_no",
    )
    hire_confidence: Optional[float] = Field(
        None, ge=0.0, le=100.0, description="Confidence in hire recommendation (%)"
    )

    # Narrative sections
    executive_summary: Optional[str] = Field(None, description="High-level summary for recruiters")
    technical_assessment: Optional[str] = Field(None, description="Detailed technical evaluation")
    behavioral_assessment: Optional[str] = Field(None, description="Behavioral traits evaluation")
    communication_assessment: Optional[str] = Field(None, description="Communication style evaluation")

    # Lists
    key_strengths: Optional[list[str]] = Field(None, description="Top identified strengths")
    key_weaknesses: Optional[list[str]] = Field(None, description="Key areas for improvement")
    red_flags: Optional[list[str]] = Field(None, description="Potential concerns for recruiters")
    improvement_areas: Optional[list[str]] = Field(None, description="Suggested improvement areas")

    # Study plan
    study_plan: Optional[dict[str, Any]] = Field(None, description="Structured 30/60/90-day study plan")
    skill_gaps: Optional[list[str]] = Field(None, description="Identified skill gaps")
    recommended_resources: Optional[list[dict[str, str]]] = Field(
        None, description="Curated learning resources"
    )
    readiness_percentage: Optional[float] = Field(
        None, ge=0.0, le=100.0, description="Job readiness percentage"
    )

    # Metadata
    questions_answered: Optional[int] = Field(None, ge=0, description="Number of questions answered")
    total_duration_minutes: Optional[float] = Field(None, ge=0.0, description="Session duration in minutes")
    generated_at: Optional[datetime] = Field(None, description="Report generation timestamp")
    created_at: datetime = Field(..., description="Record creation timestamp")

    # Per-question analyses
    analyses: Optional[list[AnalysisResponse]] = Field(
        None, description="Individual question analyses"
    )

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440020",
                "session_id": "550e8400-e29b-41d4-a716-446655440002",
                "user_id": "550e8400-e29b-41d4-a716-446655440000",
                "overall_score": 74.5,
                "technical_score": 7.5,
                "communication_score": 8.0,
                "confidence_score": 6.5,
                "problem_solving_score": 7.0,
                "hire_recommendation": "yes",
                "hire_confidence": 72.0,
                "executive_summary": "Candidate demonstrates solid fundamentals...",
                "key_strengths": ["Strong DSA fundamentals", "Good communication"],
                "key_weaknesses": ["Needs more system design exposure"],
                "red_flags": [],
                "readiness_percentage": 74.5,
                "created_at": "2024-01-01T09:50:00Z",
            }
        },
    }
