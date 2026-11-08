"""JD Analyzer — Matches job descriptions against candidate resume and extracts key insights."""
import json
import re
from app.core.config import settings

AI_AVAILABLE = False
_client = None

try:
    if settings.GOOGLE_API_KEY:
        from google import genai
        _client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        AI_AVAILABLE = True
except Exception as e:
    print(f"[JDAnalyzer] Gemini init failed: {e}")


def _extract_json(text: str):
    """Extract JSON from Gemini response — handles code fences and plain JSON."""
    if not text:
        return None
    try:
        text = text.strip()
        if text.startswith("{"):
            return json.loads(text)
        match = re.search(r"```(?:json)?\s*([\s\S]+?)```", text)
        if match:
            return json.loads(match.group(1).strip())
        start = text.find("{")
        end = text.rfind("}") + 1
        if start != -1 and end > start:
            return json.loads(text[start:end])
    except Exception:
        pass
    return None


async def analyze_jd(jd_text: str, resume_skills: list[str], company: str = "", role_title: str = "") -> dict:
    """Analyze JD against candidate's skills and return match report."""

    if AI_AVAILABLE and _client and jd_text:
        try:
            skills_str = ", ".join(resume_skills[:30]) if resume_skills else "Not provided"
            prompt = f"""Analyze this job description and compare it against the candidate's skills.

Job Description:
{jd_text[:3000]}

Company: {company or 'Not specified'}
Role: {role_title or 'Not specified'}
Candidate's Skills: {skills_str}

Return ONLY JSON:
```json
{{
  "match_score": 72,
  "difficulty": "Medium",
  "required_skills": ["Python", "React", "SQL", "Docker"],
  "your_skills": ["Python", "React"],
  "missing_skills": ["Docker", "Kubernetes"],
  "focus_areas": ["Backend Development", "System Design", "APIs"],
  "key_responsibilities": ["Build scalable APIs", "Lead technical decisions"],
  "interview_topics": ["System Design", "Python internals", "REST API design"],
  "company_insights": "This company values agile development and rapid iteration.",
  "preparation_tips": "Focus on Python performance optimization and Docker containerization."
}}
```
match_score is 0-100 based on how well the skills match."""

            response = _client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )
            parsed = _extract_json(response.text)
            if parsed and "match_score" in parsed:
                return parsed
        except Exception as e:
            print(f"[JDAnalyzer] AI error: {e}")

    return _keyword_match(jd_text, resume_skills)


def _keyword_match(jd_text: str, resume_skills: list[str]) -> dict:
    """Fallback: keyword-based JD matching."""
    tech_keywords = [
        "python", "javascript", "typescript", "java", "react", "node.js", "sql",
        "postgresql", "mongodb", "docker", "kubernetes", "aws", "azure", "gcp",
        "machine learning", "tensorflow", "pytorch", "fastapi", "django", "spring",
        "go", "rust", "c++", "graphql", "redis", "elasticsearch", "kafka",
    ]
    jd_lower = jd_text.lower()
    required = [k.title() for k in tech_keywords if k in jd_lower]
    your_skills_lower = [s.lower() for s in resume_skills]
    matched = [s for s in required if s.lower() in your_skills_lower]
    missing = [s for s in required if s.lower() not in your_skills_lower]
    match_score = round((len(matched) / max(len(required), 1)) * 100) if required else 50

    difficulty = "Hard" if match_score < 50 else "Medium" if match_score < 75 else "Easy"
    return {
        "match_score": match_score,
        "difficulty": difficulty,
        "required_skills": required[:12],
        "your_skills": matched[:12],
        "missing_skills": missing[:8],
        "focus_areas": ["Technical Skills", "Problem Solving"],
        "key_responsibilities": ["See full job description for details"],
        "interview_topics": missing[:5] or ["System Design", "Data Structures", "Behavioral"],
        "company_insights": "Add GOOGLE_API_KEY to .env for detailed company insights.",
        "preparation_tips": f"Focus on learning: {', '.join(missing[:3])}." if missing else "Your skills match well! Focus on system design and behavioral questions.",
    }
