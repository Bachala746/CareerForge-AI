"""Resume Analyzer — AI-powered full resume analysis with all fields."""
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
        print("[ResumeAnalyzer] Gemini AI ready.")
except Exception as e:
    print(f"[ResumeAnalyzer] Gemini init failed: {e}")


def _extract_json(text: str):
    """Robustly extract JSON from Gemini response."""
    if not text:
        return None
    text = text.strip()
    # Try plain JSON
    if text.startswith("{"):
        try:
            return json.loads(text)
        except Exception:
            pass
    # Try ```json ... ``` code fence
    match = re.search(r"```(?:json)?\s*([\s\S]+?)```", text)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except Exception:
            pass
    # Try first { to last }
    start = text.find("{")
    end = text.rfind("}") + 1
    if start != -1 and end > start:
        try:
            return json.loads(text[start:end])
        except Exception:
            pass
    return None


async def analyze_resume(resume_text: str, resume_id: int, user_id: int) -> dict:
    """Full AI analysis — extracts all resume fields and scores the candidate."""

    if not resume_text or len(resume_text.strip()) < 30:
        return _default_analysis("Resume text is empty or too short to analyze.")

    if AI_AVAILABLE and _client:
        try:
            prompt = f"""You are a senior technical recruiter and ATS expert. Carefully read and analyze this resume.

RESUME TEXT:
{resume_text[:6000]}

Extract ALL information present in the resume and return ONLY a valid JSON object.
Do NOT invent or assume information that is not in the resume.

Return this exact JSON structure:
{{
  "candidate_name": "Full Name from resume or empty string if not found",
  "resume_score": 72,
  "skills": ["Python", "React", "SQL"],
  "missing_skills": ["Docker", "Kubernetes", "CI/CD"],
  "strengths": ["Strong Python backend skills", "Good project portfolio"],
  "areas_for_improvement": ["No cloud experience mentioned", "Missing system design projects"],
  "experience": [
    {{
      "company": "Company Name",
      "role": "Software Engineer",
      "duration": "Jan 2022 - Dec 2023",
      "description": "Built REST APIs using FastAPI, reduced latency by 40%"
    }}
  ],
  "education": [
    {{
      "institution": "University Name",
      "degree": "B.Tech Computer Science",
      "year": "2024",
      "gpa": "8.5"
    }}
  ],
  "projects": [
    {{
      "name": "Project Name",
      "tech": ["React", "Node.js", "MongoDB"],
      "description": "E-commerce platform with 500+ users"
    }}
  ],
  "certifications": ["AWS Certified Cloud Practitioner", "Google Data Analytics"],
  "achievements": ["Winner of National Hackathon 2023", "Published research paper"],
  "summary": "2-3 sentence professional summary of the candidate based on their resume"
}}

Scoring rules for resume_score (0-100):
- 0-40: Very weak, missing major sections or very few skills
- 41-60: Basic resume, has fundamentals but lacks depth
- 61-75: Good resume with solid skills and some experience
- 76-90: Strong resume with clear experience, projects, and measurable outcomes
- 91-100: Excellent, very comprehensive with strong metrics and achievements

Be honest and realistic. Score based on what is actually present."""

            response = _client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )
            parsed = _extract_json(response.text)
            if parsed and isinstance(parsed, dict):
                # Validate and sanitize all fields
                parsed = _sanitize_result(parsed, resume_text)
                return parsed
            else:
                print(f"[ResumeAnalyzer] Could not parse JSON from AI response.")
        except Exception as e:
            print(f"[ResumeAnalyzer] AI call failed: {e}")

    # Fallback: keyword-based analysis
    return _keyword_based_analysis(resume_text)


def _sanitize_result(parsed: dict, resume_text: str) -> dict:
    """Ensure all required fields exist and have correct types."""
    score = parsed.get("resume_score") or parsed.get("ats_score") or 0
    # If score is 0 but skills exist, recalculate
    skills = parsed.get("skills", [])
    if score == 0 and skills:
        score = min(85, max(45, 40 + len(skills) * 3))

    return {
        "candidate_name": str(parsed.get("candidate_name", "")).strip(),
        "resume_score": float(score),
        "ats_score": float(score),   # keep for backward-compat
        "skills": _ensure_list(parsed.get("skills")),
        "missing_skills": _ensure_list(parsed.get("missing_skills")),
        "strengths": _ensure_list(parsed.get("strengths")),
        "areas_for_improvement": _ensure_list(parsed.get("areas_for_improvement")),
        "experience": _ensure_list(parsed.get("experience")),
        "education": _ensure_list(parsed.get("education")),
        "projects": _ensure_list(parsed.get("projects")),
        "certifications": _ensure_list(parsed.get("certifications")),
        "achievements": _ensure_list(parsed.get("achievements")),
        "summary": str(parsed.get("summary", "")).strip(),
    }


def _ensure_list(val) -> list:
    if isinstance(val, list):
        return val
    if val is None:
        return []
    return [str(val)]


def _keyword_based_analysis(text: str) -> dict:
    """Fallback when AI is not available — keyword matching."""
    text_lower = text.lower()
    all_skills = [
        "python", "javascript", "typescript", "java", "c++", "c#", "go", "rust", "kotlin", "swift",
        "react", "angular", "vue", "next.js", "node.js", "express", "fastapi", "django", "flask",
        "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
        "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd",
        "machine learning", "deep learning", "tensorflow", "pytorch", "pandas", "numpy",
        "git", "linux", "rest api", "graphql", "microservices", "agile", "scrum",
        "html", "css", "tailwind", "bootstrap", "spring boot", "hibernate",
    ]
    found = [s.title() for s in all_skills if s in text_lower]
    common_missing = ["Docker", "Kubernetes", "AWS", "Terraform", "System Design", "CI/CD"]
    missing = [s for s in common_missing if s.lower() not in text_lower]
    score = min(80, max(40, 35 + len(found) * 2))
    return {
        "candidate_name": "",
        "resume_score": float(score),
        "ats_score": float(score),
        "skills": found[:25],
        "missing_skills": missing[:8],
        "strengths": ["Technical skills identified from resume content"],
        "areas_for_improvement": ["Add a Gemini API key for detailed AI-powered analysis"],
        "experience": [],
        "education": [],
        "projects": [],
        "certifications": [],
        "achievements": [],
        "summary": (
            f"Resume analyzed using keyword matching. Found {len(found)} technical skills. "
            "Add GOOGLE_API_KEY in backend/.env for full AI-powered analysis."
        ),
    }


def _default_analysis(reason: str = "") -> dict:
    return {
        "candidate_name": "",
        "resume_score": 0.0,
        "ats_score": 0.0,
        "skills": [],
        "missing_skills": [],
        "strengths": [],
        "areas_for_improvement": [],
        "experience": [],
        "education": [],
        "projects": [],
        "certifications": [],
        "achievements": [],
        "summary": reason or "Could not analyze resume. Please upload a text-readable PDF or DOCX file.",
    }

