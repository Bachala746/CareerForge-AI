"""AI Interview Engine — Personalized questions and evaluations using Gemini + resume/JD context."""
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
        print("[AIInterview] Gemini AI ready.")
except Exception as e:
    print(f"[AIInterview] Gemini init failed: {e}")


def _extract_json(text: str):
    if not text:
        return None
    text = text.strip()
    if text.startswith("{") or text.startswith("["):
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
    for sc, ec in [("[", "]"), ("{", "}")]:
        s = text.find(sc)
        e = text.rfind(ec) + 1
        if s != -1 and e > s:
            try:
                return json.loads(text[s:e])
            except Exception:
                pass
    return None


def _call_gemini(prompt: str):
    if not AI_AVAILABLE or not _client:
        return None
    try:
        response = _client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        return response.text
    except Exception as e:
        print(f"[AIInterview] Gemini call failed: {e}")
        return None


async def generate_questions(
    company: str,
    role: str,
    interview_type: str,
    personality: str,
    difficulty: str,
    experience_level: str,
    count: int = 8,
    resume_text: str = "",
    resume_skills: list = None,
    jd_text: str = "",
    jd_required_skills: list = None,
) -> list:
    resume_skills = resume_skills or []
    jd_required_skills = jd_required_skills or []

    resume_context = ""
    if resume_text and len(resume_text.strip()) > 50:
        resume_context = f"\n\nCANDIDATE RESUME (excerpt):\n{resume_text[:3000]}"
    elif resume_skills:
        resume_context = f"\n\nCANDIDATE SKILLS: {', '.join(resume_skills[:20])}"

    jd_context = ""
    if jd_text and len(jd_text.strip()) > 50:
        jd_context = f"\n\nJOB DESCRIPTION (excerpt):\n{jd_text[:1500]}"
    elif jd_required_skills:
        jd_context = f"\n\nJD REQUIRED SKILLS: {', '.join(jd_required_skills[:15])}"

    personality_map = {
        "friendly":  "warm, encouraging HR interviewer",
        "strict":    "strict, no-nonsense senior engineer who probes deep",
        "startup":   "fast-paced startup CTO focused on practical skills",
        "corporate": "formal, process-oriented corporate interviewer",
    }
    style = personality_map.get(personality, "professional interviewer")

    if AI_AVAILABLE and _client:
        prompt = f"""You are a {style} at {company or "a top tech company"}.
Interviewing a {experience_level} candidate for: {role}
Interview type: {interview_type} | Difficulty: {difficulty}
{resume_context}
{jd_context}

RULES:
- Use the candidate's ACTUAL resume to ask specific questions about their real projects, skills, and experience.
- If the resume mentions a specific project or technology, ask about THAT — not generic questions.
- If JD requires skills not strongly present in the resume, include questions testing those skills.
- Mix question types based on interview_type: behavioral=STAR questions, technical=deep technical, hr=culture/motivation, mixed=all types.
- Difficulty: easy=basic, medium=applied, hard=design+edge cases, adaptive=progressive mix.

Generate exactly {count} questions. Return ONLY a valid JSON array:
[
  {{
    "question": "I see you worked on [specific project]. Walk me through the architecture and the biggest challenge.",
    "type": "technical",
    "order": 1,
    "context": "Testing depth on actual project experience",
    "skill_tested": "System Design"
  }}
]
Return ONLY the JSON array."""

        text = _call_gemini(prompt)
        if text:
            parsed = _extract_json(text)
            if parsed and isinstance(parsed, list) and len(parsed) >= 2:
                cleaned = []
                for i, q in enumerate(parsed[:count]):
                    if isinstance(q, dict) and q.get("question"):
                        cleaned.append({
                            "question": q["question"],
                            "type": q.get("type", "general"),
                            "order": i,
                            "context": q.get("context", ""),
                            "skill_tested": q.get("skill_tested", ""),
                        })
                if len(cleaned) >= 2:
                    return cleaned

    return _fallback_questions(role, interview_type, count, resume_skills, jd_required_skills)


async def evaluate_answer(
    question: str,
    answer: str,
    role: str,
    question_type: str = "general",
    interview_type: str = "mixed",
    difficulty: str = "medium",
    experience_level: str = "junior",
    resume_skills: list = None,
    jd_required_skills: list = None,
    skill_tested: str = "",
) -> dict:
    resume_skills = resume_skills or []
    jd_required_skills = jd_required_skills or []

    answer_stripped = (answer or "").strip()
    word_count = len(answer_stripped.split()) if answer_stripped else 0

    # ── Special cases ────────────────────────────────────────────────────────
    if word_count == 0:
        return _empty_answer_evaluation()

    if word_count < 5:
        return _too_short_evaluation(answer_stripped, question)

    if AI_AVAILABLE and _client:
        # ── Build context block ─────────────────────────────────────────────
        ctx_lines = []
        ctx_lines.append(f"Role: {role}")
        ctx_lines.append(f"Interview type: {interview_type}")
        ctx_lines.append(f"Difficulty: {difficulty}")
        ctx_lines.append(f"Candidate level: {experience_level}")
        if skill_tested:
            ctx_lines.append(f"Skill being tested: {skill_tested}")
        if resume_skills:
            ctx_lines.append(f"Candidate's known skills: {', '.join(resume_skills[:12])}")
        if jd_required_skills:
            ctx_lines.append(f"Job requires: {', '.join(jd_required_skills[:8])}")
        ctx = "\n".join(ctx_lines)

        # ── Question-type-specific instructions ─────────────────────────────
        if question_type in ("behavioral", "hr") or interview_type == "hr":
            type_instructions = """EVALUATION FOCUS — Behavioral/HR:
- Relevance: Does the answer directly address the question?
- STAR method: Does the answer have a Situation, Task, Action, and Result?
- Specificity: Are real examples given, or is the answer generic?
- Communication: Is it clear, structured, and professional?
- Completeness: Are all parts of the question addressed?
Score technical_score based on problem-solving shown. Penalize vague answers without examples heavily."""
        elif question_type == "technical" or interview_type == "technical":
            type_instructions = """EVALUATION FOCUS — Technical:
- Technical correctness: Is the answer factually accurate?
- Depth: Does it show real understanding, not just surface knowledge?
- Explanation quality: Can the candidate explain WHY, not just WHAT?
- Edge cases / trade-offs: Are limitations or alternatives mentioned?
- Problem-solving approach: Is the reasoning logical?
Score communication_score based on explanation clarity. Penalize incorrect facts heavily."""
        else:
            type_instructions = """EVALUATION FOCUS — General/Mixed:
- Relevance to the question asked.
- Clarity and structure of the response.
- Depth and use of real examples.
- Communication quality."""

        # ── Difficulty calibration ──────────────────────────────────────────
        difficulty_note = {
            "easy":     "This is an easy question. A good {level} candidate should score 70+ if they answer clearly. Score 40-65 for incomplete answers.",
            "medium":   "This is a medium question. Score 60-85 for solid answers with examples. Score below 50 for vague or generic answers.",
            "hard":     "This is a hard question. Only score above 80 if the answer shows deep expertise, trade-offs, and edge cases. Most answers should score 40-70.",
            "adaptive": "Calibrate difficulty to the candidate's level. Reward genuine depth over memorized answers.",
        }.get(difficulty, "Score fairly based on answer quality.")
        difficulty_note = difficulty_note.replace("{level}", experience_level)

        # ── Build prompt ────────────────────────────────────────────────────
        prompt = f"""You are a professional interviewer providing a detailed, accurate evaluation.

CONTEXT:
{ctx}

QUESTION ({question_type}):
{question}

CANDIDATE'S ANSWER ({word_count} words):
{answer_stripped[:2000]}

{type_instructions}

SCORING CALIBRATION:
{difficulty_note}
- 0-30: No answer, completely irrelevant, or factually wrong.
- 31-49: Very weak — missing key points, no examples, vague or incorrect.
- 50-64: Below average — partial answer, some relevant points but incomplete.
- 65-79: Average to good — covers main points with some examples.
- 80-89: Strong — specific, well-structured, shows real understanding.
- 90-100: Excellent — comprehensive, insightful, goes beyond basics.

INSTRUCTIONS:
1. Evaluate ALL six criteria honestly using the rubric above.
2. overall_score must equal the average of all six scores (rounded to integer).
3. feedback must reference THIS specific answer (not a generic template).
4. strengths must list what THIS candidate actually did well.
5. improvements must list specific missing points from THIS answer.
6. model_answer must be a complete, concrete sample answer to THIS question (3-6 sentences). Do NOT say "A strong answer would include". Write the actual answer as if you are an ideal candidate.
7. keywords_used: important terms the candidate mentioned.
8. keywords_missed: important terms they should have mentioned but did not.

Return ONLY valid JSON (no markdown, no explanation outside the JSON):
{{
  "technical_score": <integer 0-100>,
  "communication_score": <integer 0-100>,
  "confidence_score": <integer 0-100>,
  "completeness_score": <integer 0-100>,
  "clarity_score": <integer 0-100>,
  "relevance_score": <integer 0-100>,
  "overall_score": <integer 0-100, average of above>,
  "feedback": "<2-4 sentences specific to this answer>",
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "improvements": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"],
  "model_answer": "<complete sample answer to this question as an ideal candidate>",
  "keywords_used": ["<term1>", "<term2>"],
  "keywords_missed": ["<term1>", "<term2>"]
}}"""

        text = _call_gemini(prompt)
        if text:
            parsed = _extract_json(text)
            if parsed and isinstance(parsed, dict) and "technical_score" in parsed:
                # Always recompute overall_score from all 6 criteria for consistency
                score_keys = ["technical_score", "communication_score", "confidence_score",
                              "completeness_score", "clarity_score", "relevance_score"]
                scores = [int(parsed.get(k, 50)) for k in score_keys]
                # Clamp all scores 0-100
                scores = [max(0, min(100, s)) for s in scores]
                for k, s in zip(score_keys, scores):
                    parsed[k] = s
                parsed["overall_score"] = round(sum(scores) / len(scores))
                return parsed

    return _fallback_evaluation(answer_stripped, question_type, difficulty)


async def generate_followup(
    previous_question: str,
    previous_answer: str,
    role: str,
    interview_type: str,
    resume_text: str = "",
    resume_skills: list = None,
    skills_not_yet_tested: list = None,
    current_question_number: int = 0,
    total_questions: int = 8,
) -> dict:
    resume_skills = resume_skills or []
    skills_not_yet_tested = skills_not_yet_tested or []
    remaining = total_questions - current_question_number
    untested = ", ".join(skills_not_yet_tested[:5]) if skills_not_yet_tested else "none remaining"
    resume_ctx = f"\nCandidate resume context: {resume_text[:600]}" if resume_text else ""
    if resume_skills and not resume_text:
        resume_ctx = f"\nCandidate skills: {', '.join(resume_skills[:10])}"

    if AI_AVAILABLE and _client:
        prompt = f"""You are interviewing a {role} candidate.

Previous Q: {previous_question}
Their Answer: {previous_answer[:600]}
{resume_ctx}
Skills not yet tested: {untested}
Questions remaining: {remaining}

Choose the BEST follow-up strategy:
- PROBE: their answer was vague — ask for specific details/metrics
- CHALLENGE: their answer was good — increase difficulty or ask edge cases
- PIVOT: enough on this topic — move to an untested skill from the list
- CLARIFY: answer was unclear — ask for clarification

Return ONLY valid JSON:
{{
  "question": "Your specific follow-up question",
  "type": "follow_up",
  "order": 99,
  "context": "Why you chose this follow-up",
  "skill_tested": "What skill this tests",
  "strategy": "probe"
}}"""

        try:
            response = _client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
            parsed = _extract_json(response.text)
            if parsed and "question" in parsed:
                return parsed
        except Exception as e:
            print(f"[AIInterview] Follow-up failed: {e}")

    return _fallback_followup()


def _fallback_questions(role, interview_type, count, resume_skills, jd_skills):
    behavioral = [
        {"question": "Tell me about your most challenging project. What was your specific role and how did you overcome the key obstacles?", "type": "behavioral", "order": 0, "context": "Problem solving", "skill_tested": "Resilience"},
        {"question": "Describe a time you had to learn a new technology quickly. How did you approach it and what was the outcome?", "type": "behavioral", "order": 1, "context": "Learning ability", "skill_tested": "Adaptability"},
        {"question": "Tell me about a time you disagreed with a technical decision. What did you do and what was the result?", "type": "behavioral", "order": 2, "context": "Conflict resolution", "skill_tested": "Communication"},
        {"question": "What is your greatest professional achievement? Walk me through the impact and how you measured it.", "type": "behavioral", "order": 3, "context": "Self-assessment", "skill_tested": "Impact"},
        {"question": "Why are you interested in this role and what unique value do you bring?", "type": "hr", "order": 4, "context": "Motivation", "skill_tested": "Culture fit"},
    ]
    technical = [
        {"question": f"Walk me through how you would design a scalable system for a {role} application handling 1M daily users.", "type": "technical", "order": 5, "context": "System design", "skill_tested": "Architecture"},
        {"question": "How do you approach code quality, testing, and maintainability? Give a concrete example from your work.", "type": "technical", "order": 6, "context": "Engineering practices", "skill_tested": "Quality"},
        {"question": "Explain your experience with databases. When would you choose SQL vs NoSQL and why?", "type": "technical", "order": 7, "context": "Database knowledge", "skill_tested": "Databases"},
    ]
    skill_qs = []
    for i, skill in enumerate((jd_skills or [])[:3]):
        skill_qs.append({"question": f"The role requires strong {skill} skills. Walk me through a specific problem you solved using {skill} and the measurable outcome.", "type": "technical", "order": 8 + i, "context": f"JD requirement: {skill}", "skill_tested": skill})

    pool = (behavioral + technical + skill_qs) if interview_type in ["mixed", "technical"] else (behavioral + skill_qs)
    if interview_type == "hr":
        pool = behavioral
    return pool[:count]


def _fallback_evaluation(answer, question_type="general", difficulty="medium"):
    """Used when Gemini is unavailable. Returns a word-count-calibrated score."""
    words = len(answer.split()) if answer else 0
    # Difficulty modifier
    diff_mod = {"easy": 8, "medium": 0, "hard": -8, "adaptive": 0}.get(difficulty, 0)
    base = min(72, max(35, 35 + words // 5 + diff_mod))
    avg = round((base + min(base+8,80) + max(base-5,35) + base + min(base+4,78) + min(base+6,80)) / 6)
    return {
        "technical_score": base,
        "communication_score": min(base + 8, 80),
        "confidence_score": max(base - 5, 35),
        "completeness_score": base,
        "clarity_score": min(base + 4, 78),
        "relevance_score": min(base + 6, 80),
        "overall_score": avg,
        "feedback": (
            "Your answer has been recorded. For detailed AI-powered feedback, "
            "add GOOGLE_API_KEY to backend/.env. Generally: use the STAR method "
            "(Situation, Task, Action, Result) for behavioral questions, and show "
            "technical depth with specific examples for technical questions."
        ),
        "strengths": [
            "Provided a response to the question",
            "Demonstrated willingness to engage",
        ],
        "improvements": [
            "Use STAR format (Situation → Task → Action → Result) for behavioral questions",
            "Add specific metrics and measurable outcomes",
            "Give concrete examples from real experience",
        ],
        "model_answer": (
            "An ideal answer uses the STAR method: describe the Situation briefly, "
            "explain your specific Task or responsibility, walk through the Actions you took "
            "step-by-step, and conclude with concrete Results and measurable impact."
        ),
        "keywords_used": [],
        "keywords_missed": ["specific example", "measurable outcome", "impact", "STAR method"],
    }


def _too_short_evaluation(answer, question):
    """Used when the answer is present but too short to evaluate meaningfully."""
    return {
        "technical_score": 15,
        "communication_score": 10,
        "confidence_score": 10,
        "completeness_score": 5,
        "clarity_score": 15,
        "relevance_score": 20,
        "overall_score": 13,
        "feedback": (
            f"Your answer '{answer}' is too brief to evaluate properly. "
            "A complete answer should address all parts of the question with "
            "specific examples, context, and explanation. Aim for at least 3-5 sentences."
        ),
        "strengths": [],
        "improvements": [
            "Provide a complete answer with at least 3-5 sentences",
            "Include a specific example or real experience",
            "Explain your reasoning and the outcome",
        ],
        "model_answer": (
            "Please provide a detailed answer to this question using specific examples "
            "from your experience. Address the core of what is being asked and "
            "explain your thought process clearly."
        ),
        "keywords_used": [],
        "keywords_missed": ["explanation", "example", "context", "result"],
    }


def _empty_answer_evaluation():
    return {
        "technical_score": 0, "communication_score": 0, "confidence_score": 0,
        "completeness_score": 0, "clarity_score": 0, "relevance_score": 0,
        "overall_score": 0,
        "feedback": "No answer was provided for this question. Please type or speak your answer before submitting.",
        "strengths": [],
        "improvements": ["Provide an answer to receive meaningful feedback."],
        "model_answer": "",
        "keywords_used": [],
        "keywords_missed": [],
    }


def _fallback_followup():
    import random
    return random.choice([
        {"question": "Can you give me a specific example with measurable outcomes?", "type": "follow_up", "order": 99, "context": "Asking for specifics", "skill_tested": "Depth", "strategy": "probe"},
        {"question": "What was the hardest technical decision in that situation and why did you make that call?", "type": "follow_up", "order": 99, "context": "Technical depth", "skill_tested": "Decision making", "strategy": "probe"},
        {"question": "How would you approach this differently today with more experience?", "type": "follow_up", "order": 99, "context": "Self-reflection", "skill_tested": "Growth mindset", "strategy": "challenge"},
    ])
