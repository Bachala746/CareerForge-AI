from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class RecruiterReport(Base):
    __tablename__ = "recruiter_reports"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Scores
    overall_score = Column(Float, default=0.0)
    technical_score = Column(Float, default=0.0)
    communication_score = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)
    problem_solving_score = Column(Float, default=0.0)
    behavioral_score = Column(Float, default=0.0)
    projects_score = Column(Float, default=0.0)

    # Decision
    hiring_decision = Column(String(100), default="Hire")  # Strong Hire | Hire | No Hire | Needs Improvement
    star_rating = Column(Float, default=3.5)

    # Narrative
    recruiter_note = Column(Text, nullable=True)
    executive_summary = Column(Text, nullable=True)
    strengths_json = Column(Text, default="[]")          # JSON list
    weaknesses_json = Column(Text, default="[]")         # JSON list
    recommendations_json = Column(Text, default="[]")    # JSON list
    suggested_topics_json = Column(Text, default="[]")   # JSON list

    # Voice analytics
    avg_confidence = Column(Float, default=0.0)
    avg_speaking_speed_wpm = Column(Integer, default=0)
    filler_words_count = Column(Integer, default=0)
    filler_words_json = Column(Text, default="{}")       # JSON {word: count}

    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("InterviewSession", back_populates="report")


class LearningRoadmap(Base):
    __tablename__ = "learning_roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=True)
    report_id = Column(Integer, ForeignKey("recruiter_reports.id"), nullable=True)
    weeks_json = Column(Text, default="[]")          # JSON weeks data
    focus_skills = Column(Text, default="[]")        # JSON list
    estimated_days = Column(Integer, default=42)
    overall_progress = Column(Float, default=0.0)
    is_active = Column(Integer, default=1)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="roadmaps")
