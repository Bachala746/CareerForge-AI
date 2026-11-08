import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.resume import Resume, JobDescription
from app.models.report import RecruiterReport, LearningRoadmap
from app.services.mentor_chat import chat_with_mentor
from app.services.resume_analyzer import analyze_resume
from app.services.roadmap_generator import generate_roadmap

router = APIRouter(prefix="/ai", tags=["AI Services"])


@router.post("/mentor-chat")
async def mentor_chat(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Chat with the AI mentor — personalized advice using full user context."""
    message = payload.get("message", "")
    history = payload.get("history", [])

    if not message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Build user context
    resume = db.query(Resume).filter(
        Resume.user_id == current_user.id, Resume.is_active == 1
    ).first()
    latest_report = db.query(RecruiterReport).filter(
        RecruiterReport.user_id == current_user.id
    ).order_by(RecruiterReport.generated_at.desc()).first()

    context = {
        "user_name": current_user.full_name,
        "skills": json.loads(resume.extracted_skills) if resume else [],
        "latest_score": latest_report.overall_score if latest_report else None,
        "hiring_decision": latest_report.hiring_decision if latest_report else None,
        "weaknesses": json.loads(latest_report.weaknesses_json) if latest_report else [],
        "strengths": json.loads(latest_report.strengths_json) if latest_report else [],
    }

    response = await chat_with_mentor(message=message, history=history)
    return {"response": response, "message": message}



@router.post("/analyze-resume")
async def retrigger_resume_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Re-run AI analysis on the user's latest resume."""
    resume = db.query(Resume).filter(
        Resume.user_id == current_user.id, Resume.is_active == 1
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="No resume uploaded yet")

    analysis = await analyze_resume(resume.content_text or "", resume.id, current_user.id)

    resume.extracted_skills = json.dumps(analysis.get("skills", []))
    resume.missing_skills = json.dumps(analysis.get("missing_skills", []))
    resume.ats_score = analysis.get("ats_score", 75.0)
    resume.analysis_summary = analysis.get("summary", "")
    db.commit()

    return {"message": "Analysis complete", "ats_score": resume.ats_score}


@router.post("/generate-roadmap")
async def trigger_roadmap_generation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a personalized learning roadmap from the latest report."""
    latest_report = db.query(RecruiterReport).filter(
        RecruiterReport.user_id == current_user.id
    ).order_by(RecruiterReport.generated_at.desc()).first()

    if not latest_report:
        raise HTTPException(status_code=404, detail="No report found. Complete an interview first.")

    roadmap = await generate_roadmap(
        report=latest_report,
        user_id=current_user.id,
        db=db
    )
    return {
        "id": roadmap.id,
        "weeks": json.loads(roadmap.weeks_json or "[]"),
        "focus_skills": json.loads(roadmap.focus_skills or "[]"),
        "overall_progress": roadmap.overall_progress,
        "generated_at": roadmap.generated_at,
    }


@router.post("/analyze-jd")
async def analyze_job_description(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze a job description and match it against user's resume."""
    from app.services.jd_analyzer import analyze_jd
    jd_text = payload.get("jd_text", "")
    if not jd_text.strip():
        raise HTTPException(status_code=400, detail="JD text is required")

    resume = db.query(Resume).filter(
        Resume.user_id == current_user.id, Resume.is_active == 1
    ).first()
    resume_skills = json.loads(resume.extracted_skills) if resume else []

    analysis = await analyze_jd(jd_text=jd_text, resume_skills=resume_skills)

    jd_record = JobDescription(
        user_id=current_user.id,
        jd_text=jd_text,
        company=payload.get("company", ""),
        role_title=payload.get("role_title", ""),
        required_skills=json.dumps(analysis.get("required_skills", [])),
        preferred_skills=json.dumps(analysis.get("preferred_skills", [])),
        match_score=analysis.get("match_score", 0.0),
        difficulty_prediction=analysis.get("difficulty", "Medium"),
        key_focus_areas=json.dumps(analysis.get("focus_areas", [])),
    )
    db.add(jd_record)
    db.commit()
    db.refresh(jd_record)

    return {
        "id": jd_record.id,
        "required_skills": analysis.get("required_skills", []),
        "preferred_skills": analysis.get("preferred_skills", []),
        "match_score": analysis.get("match_score", 0.0),
        "difficulty": analysis.get("difficulty", "Medium"),
        "focus_areas": analysis.get("focus_areas", []),
        "your_skills": resume_skills,
        "missing_skills": analysis.get("missing_skills", []),
    }
