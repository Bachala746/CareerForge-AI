from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    content_text = Column(Text, nullable=True)
    extracted_skills = Column(Text, default="[]")      # JSON list
    missing_skills = Column(Text, default="[]")        # JSON list
    experience_json = Column(Text, default="[]")       # JSON list
    education_json = Column(Text, default="[]")        # JSON list
    projects_json = Column(Text, default="[]")         # JSON list
    certifications_json = Column(Text, default="[]")   # JSON list
    ats_score = Column(Float, default=0.0)
    analysis_summary = Column(Text, nullable=True)
    is_active = Column(Integer, default=1)             # Most recent = 1
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="resumes")


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company = Column(String(255), nullable=True)
    role_title = Column(String(255), nullable=True)
    jd_text = Column(Text, nullable=False)
    required_skills = Column(Text, default="[]")    # JSON list
    preferred_skills = Column(Text, default="[]")   # JSON list
    match_score = Column(Float, default=0.0)
    difficulty_prediction = Column(String(50), nullable=True)
    key_focus_areas = Column(Text, default="[]")    # JSON list
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="job_descriptions")
