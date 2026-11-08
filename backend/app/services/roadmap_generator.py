"""Roadmap Generator — Personalized 6-week study plan from interview gaps."""
import json
import re
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.report import RecruiterReport, LearningRoadmap

AI_AVAILABLE = False
_client = None

try:
    if settings.GOOGLE_API_KEY:
        from google import genai
        _client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        AI_AVAILABLE = True
except Exception as e:
    print(f"[RoadmapGen] Gemini init failed: {e}")


def _extract_json(text: str):
    try:
        match = re.search(r"```(?:json)?\s*([\s\S]+?)```", text)
        if match:
            return json.loads(match.group(1))
        return json.loads(text)
    except Exception:
        return None


async def generate_roadmap(report: RecruiterReport, user_id: int, db: Session) -> LearningRoadmap:
    """Generate personalized 6-week learning roadmap from report gaps."""
    weaknesses = json.loads(report.weaknesses_json or "[]")
    suggested = json.loads(report.suggested_topics_json or "[]")
    focus_skills = (weaknesses + suggested)[:8]

    weeks_data = None

    if AI_AVAILABLE and _client:
        try:
            prompt = f"""Create a 6-week interview preparation roadmap for a candidate.
Weak areas: {focus_skills}
Technical score: {report.technical_score}/100
Communication score: {report.communication_score}/100

Return ONLY JSON with exactly 6 weeks:
```json
[
  {{
    "week": 1,
    "title": "Foundation Week",
    "focus": "Topic focus",
    "topics": ["Topic 1", "Topic 2", "Topic 3"],
    "resources": ["Resource 1 (Free)", "Resource 2"],
    "daily_hours": 2,
    "mini_project": "Build something small",
    "progress": 0
  }}
]
```"""
            response = _client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )
            parsed = _extract_json(response.text)
            if parsed and isinstance(parsed, list) and len(parsed) >= 4:
                weeks_data = parsed
        except Exception as e:
            print(f"[RoadmapGen] AI error: {e}")

    if not weeks_data:
        weeks_data = _default_weeks(focus_skills)

    # Deactivate old roadmaps
    db.query(LearningRoadmap).filter(
        LearningRoadmap.user_id == user_id,
        LearningRoadmap.is_active == 1
    ).update({"is_active": 0})

    roadmap = LearningRoadmap(
        user_id=user_id,
        session_id=report.session_id,
        report_id=report.id,
        weeks_json=json.dumps(weeks_data),
        focus_skills=json.dumps(focus_skills),
        estimated_days=42,
        overall_progress=0.0,
        is_active=1,
    )
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)
    return roadmap


def _default_weeks(focus_skills: list) -> list:
    skill1 = focus_skills[0] if focus_skills else "Core Technical Skills"
    return [
        {"week": 1, "title": "DSA Foundation", "focus": "Data Structures & Algorithms", "topics": ["Arrays & Strings", "Linked Lists", "Stacks & Queues"], "resources": ["LeetCode Easy — 50 problems", "NeetCode Roadmap (Free)", "AlgoExpert Concepts"], "daily_hours": 2, "mini_project": "Implement a Stack and Queue from scratch", "progress": 0},
        {"week": 2, "title": "Advanced Algorithms", "focus": "Trees, Graphs & Dynamic Programming", "topics": ["Binary Trees", "Graph BFS/DFS", "Dynamic Programming Basics"], "resources": ["LeetCode Medium — 30 problems", "Striver's A2Z DSA Sheet (Free)", "Visualgo.net (Free)"], "daily_hours": 2.5, "mini_project": "Build a pathfinding visualizer", "progress": 0},
        {"week": 3, "title": "System Design", "focus": "Design Scalable Systems", "topics": ["Load Balancing", "Caching (Redis)", "Database Sharding", "CAP Theorem"], "resources": ["System Design Primer (GitHub Free)", "Grokking System Design", "ByteByteGo YouTube (Free)"], "daily_hours": 2, "mini_project": "Design a URL shortener — write the architecture doc", "progress": 0},
        {"week": 4, "title": skill1, "focus": "Job-Specific Technical Skills", "topics": (focus_skills[:3] if focus_skills else ["REST APIs", "SQL Optimization", "Git Workflows"]), "resources": ["Official Documentation", "YouTube Tutorials", "Build Projects"], "daily_hours": 2, "mini_project": "Build a CRUD API with JWT authentication", "progress": 0},
        {"week": 5, "title": "Behavioral & Communication", "focus": "Soft Skills & STAR Stories", "topics": ["STAR Method", "Leadership Examples", "Conflict Resolution", "Achievements"], "resources": ["Big Interview Platform", "STAR Method Guide (Free)", "Mock Interviews with Peers"], "daily_hours": 1.5, "mini_project": "Record 5 STAR story videos and self-review", "progress": 0},
        {"week": 6, "title": "Final Mock Interviews", "focus": "Full Interview Simulation", "topics": ["Full Mock Interviews", "Company Research", "Salary Negotiation", "Questions to Ask"], "resources": ["InterviewOS Mock Sessions", "Glassdoor Interview Reviews", "LinkedIn Company Research"], "daily_hours": 3, "mini_project": "Complete 3 full mock interviews on InterviewOS", "progress": 0},
    ]
