import json
import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.deps import get_db, get_current_user
from app.models.user import User, UserProfile
from app.models.interview import InterviewSession, AIAnalysis
from app.models.achievement import Achievement, Notification
from app.core.config import settings

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/profile")
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "avatar_url": current_user.avatar_url,
        "role": current_user.role,
        "created_at": current_user.created_at,
        "profile": {
            "target_role": profile.target_role if profile else None,
            "target_company": profile.target_company if profile else None,
            "experience_level": profile.experience_level if profile else "fresher",
            "university": profile.university if profile else None,
            "cgpa": profile.cgpa if profile else None,
            "linkedin_url": profile.linkedin_url if profile else None,
            "github_url": profile.github_url if profile else None,
            "phone": profile.phone if profile else None,
            "location": profile.location if profile else None,
            "bio": profile.bio if profile else None,
            "skills": json.loads(profile.skills_json) if profile and profile.skills_json else [],
            "total_interviews": profile.total_interviews if profile else 0,
            "streak_days": profile.streak_days if profile else 0,
        } if profile else {}
    }


@router.put("/profile")
def update_profile(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    allowed = ["target_role", "target_company", "experience_level", "university",
               "cgpa", "linkedin_url", "github_url", "phone", "location", "bio"]
    for field in allowed:
        if field in payload:
            setattr(profile, field, payload[field])

    if "full_name" in payload:
        current_user.full_name = payload["full_name"]
    if "skills" in payload:
        profile.skills_json = json.dumps(payload["skills"])

    db.commit()
    return {"message": "Profile updated successfully"}


@router.get("/stats")
def get_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.models.report import RecruiterReport
    from app.models.interview import InterviewSession

    sessions = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id,
        InterviewSession.status == "completed"
    ).all()

    reports = db.query(RecruiterReport).filter(
        RecruiterReport.user_id == current_user.id
    ).all()

    total = len(sessions)
    avg_tech = round(sum(r.technical_score for r in reports) / len(reports), 1) if reports else 0
    avg_comm = round(sum(r.communication_score for r in reports) / len(reports), 1) if reports else 0
    avg_conf = round(sum(r.confidence_score for r in reports) / len(reports), 1) if reports else 0
    best = round(max((r.overall_score for r in reports), default=0), 1)
    readiness = round((avg_tech * 0.4 + avg_comm * 0.3 + avg_conf * 0.3), 1) if reports else 0

    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()

    return {
        "total_interviews": total,
        "streak_days": profile.streak_days if profile else 0,
        "readiness_score": readiness,
        "avg_technical": avg_tech,
        "avg_communication": avg_comm,
        "avg_confidence": avg_conf,
        "best_score": best,
        "hours_practiced": round(total * 0.75, 1),
    }


@router.get("/achievements")
def get_achievements(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    achievements = db.query(Achievement).filter(
        Achievement.user_id == current_user.id
    ).order_by(Achievement.earned_at.desc()).all()
    return [
        {
            "id": a.id,
            "badge_type": a.badge_type,
            "badge_label": a.badge_label,
            "badge_desc": a.badge_desc,
            "badge_color": a.badge_color,
            "earned_at": a.earned_at,
        }
        for a in achievements
    ]


@router.get("/notifications")
def get_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notifs = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(20).all()
    return [
        {
            "id": n.id, "type": n.type, "title": n.title,
            "message": n.message, "is_read": n.is_read,
            "action_url": n.action_url, "created_at": n.created_at,
        }
        for n in notifs
    ]


@router.put("/notifications/{notif_id}/read")
def mark_notification_read(
    notif_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "Marked as read"}


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"avatar_{current_user.id}.{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    current_user.avatar_url = f"/uploads/{filename}"
    db.commit()
    return {"avatar_url": current_user.avatar_url}
