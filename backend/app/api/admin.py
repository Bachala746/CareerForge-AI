from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_admin
from app.models.user import User, UserProfile
from app.models.interview import InterviewSession
from app.models.report import RecruiterReport

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users")
def list_users(
    skip: int = 0, limit: int = 50,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    users = db.query(User).offset(skip).limit(limit).all()
    result = []
    for u in users:
        total = db.query(InterviewSession).filter(
            InterviewSession.user_id == u.id,
            InterviewSession.status == "completed"
        ).count()
        result.append({
            "id": u.id, "email": u.email, "full_name": u.full_name,
            "role": u.role, "is_active": u.is_active,
            "created_at": u.created_at, "total_interviews": total,
        })
    return {"users": result, "total": db.query(User).count()}


@router.get("/analytics")
def platform_analytics(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    total_sessions = db.query(InterviewSession).count()
    completed = db.query(InterviewSession).filter(InterviewSession.status == "completed").count()
    reports = db.query(RecruiterReport).all()
    avg_score = round(sum(r.overall_score for r in reports) / len(reports), 1) if reports else 0

    return {
        "total_users": total_users,
        "total_sessions": total_sessions,
        "completed_sessions": completed,
        "total_reports": len(reports),
        "avg_overall_score": avg_score,
    }


@router.put("/users/{user_id}/status")
def toggle_user_status(
    user_id: int,
    payload: dict,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = payload.get("is_active", True)
    db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}"}
