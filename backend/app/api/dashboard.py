import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.core.deps import get_db, get_current_user
from app.models.user import User, UserProfile
from app.models.interview import InterviewSession, AIAnalysis
from app.models.report import RecruiterReport

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    reports = db.query(RecruiterReport).filter(RecruiterReport.user_id == current_user.id).all()
    total = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id,
        InterviewSession.status == "completed"
    ).count()

    avg_tech = round(sum(r.technical_score for r in reports) / len(reports), 1) if reports else 0
    avg_comm = round(sum(r.communication_score for r in reports) / len(reports), 1) if reports else 0
    avg_conf = round(sum(r.confidence_score for r in reports) / len(reports), 1) if reports else 0
    best = round(max((r.overall_score for r in reports), default=0), 1)
    readiness = round((avg_tech * 0.4 + avg_comm * 0.3 + avg_conf * 0.3), 1) if reports else 0

    return {
        "total_interviews": total,
        "streak_days": profile.streak_days if profile else 0,
        "readiness_score": readiness,
        "technical_score": avg_tech,
        "communication_score": avg_comm,
        "confidence_score": avg_conf,
        "best_score": best,
        "hours_practiced": round(total * 0.75, 1),
    }


@router.get("/weekly-progress")
def get_weekly_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = datetime.utcnow()
    days = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day.replace(hour=23, minute=59, second=59)

        sessions = db.query(InterviewSession).filter(
            InterviewSession.user_id == current_user.id,
            InterviewSession.started_at >= day_start,
            InterviewSession.started_at <= day_end,
            InterviewSession.status == "completed"
        ).all()

        session_ids = [s.id for s in sessions]
        analyses = []
        if session_ids:
            analyses = db.query(AIAnalysis).filter(AIAnalysis.session_id.in_(session_ids)).all()

        avg_tech = round(sum(a.technical_score for a in analyses) / len(analyses), 1) if analyses else 0
        avg_conf = round(sum(a.confidence_score for a in analyses) / len(analyses), 1) if analyses else 0
        avg_comm = round(sum(a.communication_score for a in analyses) / len(analyses), 1) if analyses else 0

        days.append({
            "day": day.strftime("%a"),
            "date": day.strftime("%Y-%m-%d"),
            "technical": avg_tech,
            "confidence": avg_conf,
            "communication": avg_comm,
            "interviews": len(sessions),
        })

    return days


@router.get("/recent-interviews")
def get_recent_interviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id
    ).order_by(InterviewSession.started_at.desc()).limit(5).all()

    result = []
    for s in sessions:
        report = db.query(RecruiterReport).filter(RecruiterReport.session_id == s.id).first()
        result.append({
            "session_id": s.id,
            "company": s.company or "Practice",
            "role": s.role,
            "interview_type": s.interview_type,
            "overall_score": report.overall_score if report else None,
            "hiring_decision": report.hiring_decision if report else None,
            "started_at": s.started_at,
            "status": s.status,
        })
    return result


@router.get("/skill-radar")
def get_skill_radar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reports = db.query(RecruiterReport).filter(
        RecruiterReport.user_id == current_user.id
    ).order_by(RecruiterReport.generated_at.desc()).limit(5).all()

    if not reports:
        return [
            {"skill": "Technical", "value": 0},
            {"skill": "Communication", "value": 0},
            {"skill": "Confidence", "value": 0},
            {"skill": "Problem Solving", "value": 0},
            {"skill": "Projects", "value": 0},
            {"skill": "Behavior", "value": 0},
        ]

    avg = lambda key: round(sum(getattr(r, key) for r in reports) / len(reports), 1)

    return [
        {"skill": "Technical", "value": avg("technical_score")},
        {"skill": "Communication", "value": avg("communication_score")},
        {"skill": "Confidence", "value": avg("confidence_score")},
        {"skill": "Problem Solving", "value": avg("problem_solving_score")},
        {"skill": "Projects", "value": avg("projects_score")},
        {"skill": "Behavior", "value": avg("behavioral_score")},
    ]
