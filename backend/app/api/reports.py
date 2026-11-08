import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.report import RecruiterReport, LearningRoadmap
from app.models.interview import InterviewSession
from app.services.report_generator import generate_report
from app.services.roadmap_generator import generate_roadmap

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/session/{session_id}")
async def get_report(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed report for a specific interview session."""
    report = db.query(RecruiterReport).filter(
        RecruiterReport.session_id == session_id,
        RecruiterReport.user_id == current_user.id
    ).first()

    if not report:
        # Try generating it if session is complete
        session = db.query(InterviewSession).filter(
            InterviewSession.id == session_id,
            InterviewSession.user_id == current_user.id,
            InterviewSession.status == "completed"
        ).first()
        if not session:
            raise HTTPException(status_code=404, detail="Report not found")
        report = await generate_report(session_id=session_id, user_id=current_user.id, db=db)

    return _format_report(report)


@router.get("/all")
def get_all_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all reports for the current user."""
    reports = db.query(RecruiterReport).filter(
        RecruiterReport.user_id == current_user.id
    ).order_by(RecruiterReport.generated_at.desc()).all()

    result = []
    for r in reports:
        session = db.query(InterviewSession).filter(InterviewSession.id == r.session_id).first()
        result.append({
            "report_id": r.id,
            "session_id": r.session_id,
            "company": session.company if session else "",
            "role": session.role if session else "",
            "overall_score": r.overall_score,
            "hiring_decision": r.hiring_decision,
            "star_rating": r.star_rating,
            "generated_at": r.generated_at,
        })
    return result


@router.post("/generate/{session_id}")
async def trigger_report_generation(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually trigger report generation for a completed session."""
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    report = await generate_report(session_id=session_id, user_id=current_user.id, db=db)
    return _format_report(report)


@router.get("/roadmap/latest")
def get_latest_roadmap(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the user's current active learning roadmap."""
    roadmap = db.query(LearningRoadmap).filter(
        LearningRoadmap.user_id == current_user.id,
        LearningRoadmap.is_active == 1
    ).order_by(LearningRoadmap.generated_at.desc()).first()

    if not roadmap:
        return None

    return {
        "id": roadmap.id,
        "weeks": json.loads(roadmap.weeks_json or "[]"),
        "focus_skills": json.loads(roadmap.focus_skills or "[]"),
        "overall_progress": roadmap.overall_progress,
        "estimated_days": roadmap.estimated_days,
        "generated_at": roadmap.generated_at,
    }


def _format_report(report: RecruiterReport) -> dict:
    return {
        "id": report.id,
        "session_id": report.session_id,
        "overall_score": report.overall_score,
        "technical_score": report.technical_score,
        "communication_score": report.communication_score,
        "confidence_score": report.confidence_score,
        "problem_solving_score": report.problem_solving_score,
        "behavioral_score": report.behavioral_score,
        "projects_score": report.projects_score,
        "hiring_decision": report.hiring_decision,
        "star_rating": report.star_rating,
        "recruiter_note": report.recruiter_note,
        "executive_summary": report.executive_summary,
        "strengths": json.loads(report.strengths_json or "[]"),
        "weaknesses": json.loads(report.weaknesses_json or "[]"),
        "recommendations": json.loads(report.recommendations_json or "[]"),
        "suggested_topics": json.loads(report.suggested_topics_json or "[]"),
        "avg_confidence": report.avg_confidence,
        "avg_speaking_speed_wpm": report.avg_speaking_speed_wpm,
        "filler_words_count": report.filler_words_count,
        "generated_at": report.generated_at,
    }
