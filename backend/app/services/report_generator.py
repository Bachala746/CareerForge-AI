"""Report Generator — Creates comprehensive recruiter reports from interview sessions."""
import json
import re
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.interview import InterviewSession, InterviewAnswer, InterviewQuestion, AIAnalysis
from app.models.report import RecruiterReport

AI_AVAILABLE = False
_client = None

try:
    if settings.GOOGLE_API_KEY:
        from google import genai
        _client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        AI_AVAILABLE = True
except Exception as e:
    print(f"[ReportGen] Gemini init failed: {e}")


def _extract_json(text: str):
    if not text:
        return None
    text = text.strip()
    if text.startswith("{"):
        try:
            return json.loads(text)
        except Exception:
            pass
    match = re.search(r"```(?:json)?\s*([\s\S]+?)```", text)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except Exception:
            pass
    s, e = text.find("{"), text.rfind("}") + 1
    if s != -1 and e > s:
        try:
            return json.loads(text[s:e])
        except Exception:
            pass
    return None


async def generate_report(session: InterviewSession, db: Session) -> RecruiterReport:
    """Generate full recruiter report for a completed interview session."""

    # Gather all answers and questions
    answers = db.query(InterviewAnswer).filter(
        InterviewAnswer.session_id == session.id
    ).all()

    questions = db.query(InterviewQuestion).filter(
        InterviewQuestion.session_id == session.id
    ).all()

    q_map = {q.id: q.question_text for q in questions}
    qa_pairs = [
        {"question": q_map.get(a.question_id, ""), "answer": a.answer_text or ""}
        for a in answers if a.answer_text
    ]

    # Get per-answer AI scores
    analyses = db.query(AIAnalysis).filter(
        AIAnalysis.session_id == session.id
    ).all()

    avg_technical     = sum(a.technical_score or 0 for a in analyses) / max(len(analyses), 1)
    avg_communication = sum(a.communication_score or 0 for a in analyses) / max(len(analyses), 1)
    avg_confidence    = sum(a.confidence_score or 0 for a in analyses) / max(len(analyses), 1)
    avg_completeness  = sum(a.completeness_score or 0 for a in analyses) / max(len(analyses), 1)

    report_data = None

    if AI_AVAILABLE and _client and qa_pairs:
        qa_text = "\n".join([f"Q: {p['question']}\nA: {p['answer']}" for p in qa_pairs[:6]])
        prompt = f"""You are a senior recruiter evaluating a candidate for a {session.role} position{f' at {session.company}' if session.company else ''}.

Interview transcript:
{qa_text}

Average scores from AI analysis:
- Technical: {avg_technical:.0f}/100
- Communication: {avg_communication:.0f}/100
- Confidence: {avg_confidence:.0f}/100

Generate a comprehensive recruiter report. Return ONLY JSON:
```json
{{
  "overall_score": 72,
  "technical_score": 75,
  "communication_score": 78,
  "confidence_score": 68,
  "problem_solving_score": 70,
  "behavioral_score": 74,
  "projects_score": 65,
  "hiring_decision": "Hire",
  "star_rating": 3.5,
  "recruiter_note": "The candidate demonstrated solid technical knowledge with good communication skills. They showed genuine passion for the role.",
  "executive_summary": "A competent candidate who meets most of the requirements for this role. Shows clear potential for growth.",
  "strengths": ["Strong technical fundamentals", "Clear communication", "Good problem-solving approach"],
  "weaknesses": ["Could improve system design knowledge", "Need more experience with distributed systems"],
  "recommendations": ["Study system design patterns", "Practice mock interviews", "Build more projects with scale"],
  "suggested_topics": ["Distributed Systems", "Docker", "System Design", "Cloud Architecture"]
}}
```
hiring_decision must be one of: "Strong Hire", "Hire", "Needs Improvement", "No Hire"
star_rating is 1.0-5.0"""

        try:
            response = _client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )
            report_data = _extract_json(response.text)
        except Exception as e:
            print(f"[ReportGen] AI error: {e}")

    if not report_data:
        report_data = _fallback_report(avg_technical, avg_communication, avg_confidence, session)

    # Save to DB
    existing = db.query(RecruiterReport).filter(
        RecruiterReport.session_id == session.id
    ).first()

    if existing:
        for k, v in report_data.items():
            if hasattr(existing, k):
                setattr(existing, k, v)
            elif k == "strengths":
                existing.strengths_json = json.dumps(v)
            elif k == "weaknesses":
                existing.weaknesses_json = json.dumps(v)
            elif k == "recommendations":
                existing.recommendations_json = json.dumps(v)
            elif k == "suggested_topics":
                existing.suggested_topics_json = json.dumps(v)
        db.commit()
        db.refresh(existing)
        return existing

    report = RecruiterReport(
        session_id=session.id,
        user_id=session.user_id,
        overall_score=report_data.get("overall_score", 60),
        technical_score=report_data.get("technical_score", avg_technical or 60),
        communication_score=report_data.get("communication_score", avg_communication or 65),
        confidence_score=report_data.get("confidence_score", avg_confidence or 60),
        problem_solving_score=report_data.get("problem_solving_score", 62),
        behavioral_score=report_data.get("behavioral_score", 65),
        projects_score=report_data.get("projects_score", 60),
        hiring_decision=report_data.get("hiring_decision", "Needs Improvement"),
        star_rating=report_data.get("star_rating", 3.0),
        recruiter_note=report_data.get("recruiter_note", ""),
        executive_summary=report_data.get("executive_summary", ""),
        strengths_json=json.dumps(report_data.get("strengths", [])),
        weaknesses_json=json.dumps(report_data.get("weaknesses", [])),
        recommendations_json=json.dumps(report_data.get("recommendations", [])),
        suggested_topics_json=json.dumps(report_data.get("suggested_topics", [])),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def _fallback_report(tech: float, comm: float, conf: float, session) -> dict:
    overall = (tech + comm + conf) / 3 if (tech + comm + conf) > 0 else 62
    if overall >= 80:
        decision, stars = "Strong Hire", 4.5
    elif overall >= 65:
        decision, stars = "Hire", 3.5
    elif overall >= 50:
        decision, stars = "Needs Improvement", 2.5
    else:
        decision, stars = "No Hire", 1.5
    return {
        "overall_score": round(overall, 1),
        "technical_score": round(tech or 62, 1),
        "communication_score": round(comm or 65, 1),
        "confidence_score": round(conf or 60, 1),
        "problem_solving_score": round((tech + conf) / 2 or 61, 1),
        "behavioral_score": round(comm or 63, 1),
        "projects_score": round(tech * 0.85 or 58, 1),
        "hiring_decision": decision,
        "star_rating": stars,
        "recruiter_note": f"Candidate applied for {session.role}. Add GOOGLE_API_KEY to .env for a detailed AI-written recruiter note.",
        "executive_summary": "Interview completed. Enable AI for a full executive summary and personalized feedback.",
        "strengths": ["Completed the interview", "Demonstrated willingness to communicate"],
        "weaknesses": ["Enable AI for specific weakness detection"],
        "recommendations": ["Add GOOGLE_API_KEY to .env for personalized recommendations", "Practice with more mock interviews"],
        "suggested_topics": ["System Design", "Data Structures", "Behavioral Questions", "SQL"],
    }
