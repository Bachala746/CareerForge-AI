"""Mentor Chat — AI-powered interview coaching chatbot using Gemini."""
from app.core.config import settings

AI_AVAILABLE = False
_client = None

try:
    if settings.GOOGLE_API_KEY:
        from google import genai
        _client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        AI_AVAILABLE = True
except Exception as e:
    print(f"[MentorChat] Gemini init failed: {e}")

SYSTEM_PROMPT = """You are an expert AI Interview Mentor for InterviewOS. You help job seekers prepare for technical and behavioral interviews.

Your expertise covers:
- Technical interviews (DSA, system design, coding)
- Behavioral interviews (STAR method, leadership stories)
- Resume optimization and ATS tips
- Salary negotiation
- Company-specific interview prep (FAANG, startups)
- Career guidance and growth paths

Be encouraging, specific, and actionable. Give concrete examples. Keep responses concise (2-4 paragraphs max).
Always end with a practical tip or follow-up question to keep the conversation going."""

FALLBACK_RESPONSES = {
    "system design": "For system design interviews, start with clarifying requirements, then estimate scale, design the high-level architecture, and deep dive into components. Key areas: load balancing, caching (Redis), databases (SQL vs NoSQL), and API design. Practice designing URL shortener, Twitter feed, or Netflix. 💡 Tip: Always discuss trade-offs.",
    "behavioral": "Use the STAR method: **Situation** (set the scene), **Task** (your responsibility), **Action** (what YOU specifically did), **Result** (measurable outcome). Prepare 5-7 strong stories covering leadership, conflict, failure, and achievement. 💡 Tip: Quantify everything — 'reduced load time by 40%' beats 'made it faster'.",
    "resume": "An ATS-friendly resume: use standard section headers, include keywords from the job description, quantify achievements, keep it to 1-2 pages. Start each bullet with action verbs (Built, Designed, Led, Reduced). 💡 Tip: Tailor your resume for each job — match their exact tech stack keywords.",
    "salary": "Research on Glassdoor, Levels.fyi, and LinkedIn Salary. Always negotiate — most offers have 10-20% room. Say: 'I'm excited about this role. Based on my research and experience, I was expecting something in the range of X-Y. Is there flexibility?' 💡 Tip: Never give a number first if you can avoid it.",
    "default": "Great question! For interview prep, focus on these key areas: (1) Practice DSA on LeetCode daily, (2) Study system design concepts, (3) Prepare 5-7 STAR behavioral stories, (4) Research the company thoroughly. What specific area would you like to work on? I can give you a tailored prep plan! 💡 Tip: Consistency beats intensity — 30 minutes daily is better than a 5-hour weekend session.",
}


async def chat(message: str, history: list[dict]) -> str:
    """Process a mentor chat message and return AI response."""

    if AI_AVAILABLE and _client:
        try:
            # Build conversation context
            history_text = ""
            for msg in history[-6:]:  # Last 6 messages for context
                role = "User" if msg.get("role") == "user" else "Mentor"
                history_text += f"{role}: {msg.get('content', '')}\n"

            prompt = f"""{SYSTEM_PROMPT}

Conversation history:
{history_text}
User: {message}

Mentor:"""

            response = _client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            print(f"[MentorChat] AI error: {e}")

    # Smart keyword fallback
    msg_lower = message.lower()
    for keyword, response in FALLBACK_RESPONSES.items():
        if keyword in msg_lower:
            return response
    return FALLBACK_RESPONSES["default"]


# Alias for backward compatibility with API routes
chat_with_mentor = chat

