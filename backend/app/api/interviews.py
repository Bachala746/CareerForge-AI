import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user
from app.models.user import User, UserProfile
from app.models.interview import InterviewSession, InterviewQuestion, InterviewAnswer, AIAnalysis
from app.models.resume import Resume, JobDescription
from app.models.report import RecruiterReport
from app.services.ai_interview import generate_questions, generate_followup, evaluate_answer
from app.services.report_generator import generate_report

router = APIRouter(prefix="/interviews", tags=["Interviews"])


@router.post("/setup")
async def setup_interview(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new interview session with questions personalized from resume + JD."""
    try:
        # Load user's latest resume
        resume = db.query(Resume).filter(
            Resume.user_id == current_user.id, Resume.is_active == 1
        ).first()
        # Load user's latest JD
        jd = db.query(JobDescription).filter(
            JobDescription.user_id == current_user.id
        ).order_by(JobDescription.id.desc()).first()

        # Extract full context for personalization
        resume_skills = json.loads(resume.extracted_skills) if resume and resume.extracted_skills else []
        resume_text   = resume.content_text if resume and resume.content_text else ""
        jd_text       = jd.jd_text if jd else ""
        jd_skills     = json.loads(jd.required_skills) if jd and jd.required_skills else []

        print(f"[Interview] Setup for user {current_user.id}: resume_skills={len(resume_skills)}, resume_text={len(resume_text)} chars, jd_skills={len(jd_skills)}")

        # Create session record
        session = InterviewSession(
            user_id=current_user.id,
            resume_id=resume.id if resume else None,
            jd_id=jd.id if jd else None,
            company=payload.get("company", ""),
            role=payload.get("role", "Software Engineer"),
            interview_type=payload.get("interview_type", "mixed"),
            personality=payload.get("personality", "friendly"),
            difficulty=payload.get("difficulty", "adaptive"),
            duration_minutes=payload.get("duration_minutes", 30),
            experience_level=payload.get("experience_level", "junior"),
            interview_mode=payload.get("interview_mode", "audio"),
        )
        db.add(session)
        db.flush()

        # Generate personalized questions using resume + JD
        count = max(4, min(12, int(payload.get("question_count", 8))))
        questions_data = await generate_questions(
            company=session.company,
            role=session.role,
            interview_type=session.interview_type,
            personality=session.personality,
            difficulty=session.difficulty,
            experience_level=session.experience_level,
            count=count,
            resume_text=resume_text,
            resume_skills=resume_skills,
            jd_text=jd_text,
            jd_required_skills=jd_skills,
        )

        if not questions_data:
            raise ValueError("No questions were generated. Please try again.")

        questions = []
        for i, q in enumerate(questions_data):
            question = InterviewQuestion(
                session_id=session.id,
                question_text=q["question"],
                question_type=q.get("type", "general"),
                order=i,
                context=q.get("context", ""),
            )
            db.add(question)
            questions.append(question)

        db.commit()
        db.refresh(session)

        # Update user profile stats
        profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
        if profile:
            profile.total_interviews = (profile.total_interviews or 0) + 1
            profile.last_active = datetime.utcnow()
            db.commit()

    except Exception as e:
        db.rollback()
        print(f"[Interview] Setup error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to set up interview: {str(e)}")

    return {
        "session_id": session.id,
        "company": session.company,
        "role": session.role,
        "interview_type": session.interview_type,
        "personality": session.personality,
        "difficulty": session.difficulty,
        "interview_mode": session.interview_mode,
        "status": session.status,
        "resume_loaded": bool(resume),
        "jd_loaded": bool(jd),
        "questions": [
            {
                "id": q.id,
                "question": q.question_text,
                "type": q.question_type,
                "order": q.order,
                "context": q.context,
            }
            for q in questions
        ],
    }



@router.get("/session/{session_id}")
def get_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    questions = db.query(InterviewQuestion).filter(
        InterviewQuestion.session_id == session_id
    ).order_by(InterviewQuestion.order).all()

    return {
        "session_id": session.id,
        "company": session.company,
        "role": session.role,
        "interview_type": session.interview_type,
        "status": session.status,
        "started_at": session.started_at,
        "questions": [
            {
                "id": q.id,
                "question": q.question_text,
                "type": q.question_type,
                "order": q.order,
                "has_answer": q.answer is not None
            }
            for q in questions
        ],
    }


@router.post("/session/{session_id}/answer")
async def submit_answer(
    session_id: int,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit answer → AI evaluates with resume/JD context → generate smart follow-up."""
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    question_id = payload.get("question_id")
    answer_text = payload.get("answer_text", "").strip()

    question = db.query(InterviewQuestion).filter(
        InterviewQuestion.id == question_id,
        InterviewQuestion.session_id == session_id
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Load resume + JD context from session
    resume = db.query(Resume).filter(Resume.id == session.resume_id).first() if session.resume_id else None
    jd     = db.query(JobDescription).filter(JobDescription.id == session.jd_id).first() if session.jd_id else None

    resume_skills     = json.loads(resume.extracted_skills) if resume and resume.extracted_skills else []
    resume_text       = resume.content_text if resume and resume.content_text else ""
    jd_required_skills = json.loads(jd.required_skills) if jd and jd.required_skills else []

    # Save answer
    answer = InterviewAnswer(
        question_id=question_id,
        session_id=session_id,
        answer_text=answer_text,
        word_count=len(answer_text.split()),
        duration_secs=payload.get("duration_secs", 0),
    )
    db.add(answer)
    db.flush()

    # AI evaluation WITH resume + JD context + session difficulty/type
    evaluation = await evaluate_answer(
        question=question.question_text,
        answer=answer_text,
        role=session.role,
        question_type=question.question_type,
        interview_type=session.interview_type or "mixed",
        difficulty=session.difficulty or "medium",
        experience_level=session.experience_level or "junior",
        resume_skills=resume_skills,
        jd_required_skills=jd_required_skills,
        skill_tested=question.context or "",
    )

    analysis = AIAnalysis(
        answer_id=answer.id,
        session_id=session_id,
        technical_score=evaluation.get("technical_score", 0),
        communication_score=evaluation.get("communication_score", 0),
        confidence_score=evaluation.get("confidence_score", 0),
        completeness_score=evaluation.get("completeness_score", 0),
        clarity_score=evaluation.get("clarity_score", 0),
        relevance_score=evaluation.get("relevance_score", 0),
        overall_feedback=evaluation.get("feedback", ""),
        strengths=json.dumps(evaluation.get("strengths", [])),
        improvements=json.dumps(evaluation.get("improvements", [])),
        model_answer=evaluation.get("model_answer", ""),
        keywords_used=json.dumps(evaluation.get("keywords_used", [])),
        keywords_missed=json.dumps(evaluation.get("keywords_missed", [])),
    )
    db.add(analysis)

    # Determine which skills have been tested so far
    answered_questions = db.query(InterviewQuestion).filter(
        InterviewQuestion.session_id == session_id
    ).all()
    tested_skills = [q.context for q in answered_questions if q.context]
    skills_not_yet_tested = [s for s in resume_skills if s not in tested_skills]
    current_q_number = len(answered_questions)
    total_q = payload.get("total_questions", 8)

    # Generate smart follow-up WITH context
    followup = None
    should_generate = payload.get("generate_followup", True)
    if should_generate:
        followup_data = await generate_followup(
            previous_question=question.question_text,
            previous_answer=answer_text,
            role=session.role,
            interview_type=session.interview_type,
            resume_text=resume_text,
            resume_skills=resume_skills,
            skills_not_yet_tested=skills_not_yet_tested[:5],
            current_question_number=current_q_number,
            total_questions=total_q,
        )
        if followup_data:
            current_max = db.query(InterviewQuestion).filter(
                InterviewQuestion.session_id == session_id
            ).count()
            fq = InterviewQuestion(
                session_id=session_id,
                question_text=followup_data["question"],
                question_type=followup_data.get("type", "follow_up"),
                order=current_max,
                context=followup_data.get("skill_tested", followup_data.get("context", "")),
                is_followup=True,
                parent_question_id=question_id,
            )
            db.add(fq)
            db.flush()
            followup = {
                "id": fq.id,
                "question": fq.question_text,
                "type": fq.question_type,
                "order": fq.order,
                "context": fq.context,
                "strategy": followup_data.get("strategy", "probe"),
            }

    db.commit()

    return {
        "answer_id": answer.id,
        "evaluation": {
            "technical_score":    analysis.technical_score,
            "communication_score": analysis.communication_score,
            "confidence_score":   analysis.confidence_score,
            "completeness_score": analysis.completeness_score,
            "clarity_score":      analysis.clarity_score,
            "relevance_score":    analysis.relevance_score,
            "overall_score":      evaluation.get("overall_score", 0),
            "feedback":           analysis.overall_feedback,
            "strengths":          json.loads(analysis.strengths),
            "improvements":       json.loads(analysis.improvements),
            "model_answer":       analysis.model_answer,
            "keywords_used":      json.loads(analysis.keywords_used),
            "keywords_missed":    json.loads(analysis.keywords_missed),
        },
        "followup_question": followup,
    }


@router.post("/session/{session_id}/end")
async def end_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """End interview session, save final stats, and generate the recruiter report."""
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "completed"
    session.ended_at = datetime.utcnow()
    db.commit()

    # FIX: generate_report takes (session: InterviewSession, db: Session)
    try:
        report = await generate_report(session=session, db=db)
    except Exception as e:
        print(f"[Interview] Report generation error: {e}")
        report = None

    return {
        "message": "Interview completed successfully",
        "session_id": session_id,
        "report_id": report.id if report else None,
        "overall_score": report.overall_score if report else 0,
    }



@router.get("/history")
def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20
):
    """Get user's interview history with scores."""
    sessions = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id
    ).order_by(InterviewSession.started_at.desc()).limit(limit).all()

    result = []
    for s in sessions:
        report = db.query(RecruiterReport).filter(RecruiterReport.session_id == s.id).first()
        result.append({
            "session_id": s.id,
            "company": s.company,
            "role": s.role,
            "interview_type": s.interview_type,
            "status": s.status,
            "overall_score": report.overall_score if report else None,
            "hiring_decision": report.hiring_decision if report else None,
            "started_at": s.started_at,
            "report_id": report.id if report else None,
        })

    return result


@router.get("/active")
def get_active_session(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id,
        InterviewSession.status == "active"
    ).order_by(InterviewSession.started_at.desc()).first()

    if not session:
        return None

    questions = db.query(InterviewQuestion).filter(
        InterviewQuestion.session_id == session.id
    ).order_by(InterviewQuestion.order).all()

    return {
        "session_id": session.id,
        "company": session.company,
        "role": session.role,
        "questions": [{"id": q.id, "question": q.question_text, "has_answer": q.answer is not None} for q in questions],
    }
