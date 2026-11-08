from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True)
    jd_id = Column(Integer, ForeignKey("job_descriptions.id"), nullable=True)

    # Setup config
    company = Column(String(255), nullable=True)
    role = Column(String(255), nullable=False)
    interview_type = Column(String(50), default="mixed")    # hr | technical | coding | mixed
    personality = Column(String(50), default="friendly")   # friendly | strict | startup | manager
    difficulty = Column(String(50), default="adaptive")    # easy | medium | hard | adaptive
    duration_minutes = Column(Integer, default=30)
    experience_level = Column(String(50), default="junior")
    interview_mode = Column(String(20), default="audio")    # audio | audio_video


    # Status
    status = Column(String(50), default="active")  # active | completed | abandoned
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    actual_duration_secs = Column(Integer, nullable=True)

    # Relationships
    user = relationship("User", back_populates="interview_sessions")
    questions = relationship("InterviewQuestion", back_populates="session", cascade="all, delete-orphan", order_by="InterviewQuestion.order")
    report = relationship("RecruiterReport", back_populates="session", uselist=False)


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), default="general")   # hr | technical | behavioral | coding
    order = Column(Integer, default=0)
    context = Column(Text, nullable=True)    # Why this question was asked
    is_followup = Column(Boolean, default=False)
    parent_question_id = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("InterviewSession", back_populates="questions")
    answer = relationship("InterviewAnswer", back_populates="question", uselist=False)


class InterviewAnswer(Base):
    __tablename__ = "interview_answers"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("interview_questions.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    answer_text = Column(Text, nullable=True)
    audio_url = Column(String(500), nullable=True)
    duration_secs = Column(Float, nullable=True)
    word_count = Column(Integer, default=0)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    question = relationship("InterviewQuestion", back_populates="answer")
    analysis = relationship("AIAnalysis", back_populates="answer", uselist=False)


class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(Integer, primary_key=True, index=True)
    answer_id = Column(Integer, ForeignKey("interview_answers.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)

    # Scores (0-100)
    technical_score = Column(Float, default=0.0)
    communication_score = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)
    completeness_score = Column(Float, default=0.0)
    clarity_score = Column(Float, default=0.0)
    relevance_score = Column(Float, default=0.0)

    # Feedback
    overall_feedback = Column(Text, nullable=True)
    strengths = Column(Text, default="[]")      # JSON list
    improvements = Column(Text, default="[]")   # JSON list
    model_answer = Column(Text, nullable=True)  # AI ideal answer
    keywords_used = Column(Text, default="[]")  # JSON list
    keywords_missed = Column(Text, default="[]") # JSON list

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    answer = relationship("InterviewAnswer", back_populates="analysis")


class CodingSession(Base):
    __tablename__ = "coding_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    problem_title = Column(String(255), nullable=False)
    problem_slug = Column(String(255), nullable=False)
    difficulty = Column(String(50), default="medium")
    language = Column(String(50), default="python")
    code = Column(Text, nullable=True)
    test_results = Column(Text, default="[]")   # JSON
    passed_tests = Column(Integer, default=0)
    total_tests = Column(Integer, default=0)
    time_complexity = Column(String(50), nullable=True)
    space_complexity = Column(String(50), nullable=True)
    ai_review = Column(Text, nullable=True)
    score = Column(Float, default=0.0)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
