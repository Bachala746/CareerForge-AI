"""
Aptitude Practice API — Quantitative / Logical / Verbal / Data Interpretation
Uses existing Gemini client. MCQ format with explanations.
"""
from fastapi import APIRouter, Depends, HTTPException
from app.core.deps import get_current_user
from app.models.user import User
from app.services.ai_interview import _call_gemini, _extract_json, AI_AVAILABLE

router = APIRouter(prefix="/aptitude", tags=["Aptitude Practice"])

# ── Topic catalogue ───────────────────────────────────────────────────────────
APTITUDE_TOPICS: dict[str, list[str]] = {
    "quantitative": [
        "LCM and HCF", "Percentages", "Profit and Loss", "Ratio and Proportion",
        "Averages", "Time and Work", "Time, Speed and Distance",
        "Simple and Compound Interest", "Number System", "Probability",
        "Permutations and Combinations", "Problems on Ages",
    ],
    "logical": [
        "Number Series", "Letter Series", "Coding-Decoding", "Blood Relations",
        "Direction Sense", "Seating Arrangements", "Syllogisms",
        "Analogies", "Statement and Conclusion", "Puzzles",
    ],
    "verbal": [
        "Synonyms and Antonyms", "Error Spotting", "Sentence Correction",
        "Fill in the Blanks", "Reading Comprehension",
        "Sentence Rearrangement", "Idioms and Phrases",
    ],
    "data_interpretation": [
        "Tables", "Bar Graphs", "Line Graphs", "Pie Charts",
        "Caselets", "Mixed Data Interpretation",
    ],
}

CATEGORY_LABELS = {
    "quantitative":      "Quantitative Aptitude",
    "logical":           "Logical Reasoning",
    "verbal":            "Verbal Ability",
    "data_interpretation": "Data Interpretation",
}

DIFF_DESC = {
    "basic":     "beginner-friendly, fundamental concepts, simple calculations",
    "medium":    "moderate complexity, multi-step reasoning, practical problems",
    "difficult": "challenging placement-level, complex calculations, edge cases",
}

# ── Curated fallback MCQs ────────────────────────────────────────────────────
FALLBACKS: dict[tuple, list[dict]] = {
    ("quantitative", "lcm and hcf", "basic"): [
        {
            "question": "What is the LCM of 4 and 6?",
            "options": ["8", "12", "16", "24"],
            "correct": 1,
            "explanation": "LCM of 4 and 6 = 12. Multiples of 4: 4,8,12… Multiples of 6: 6,12… The smallest common multiple is 12.",
        },
        {
            "question": "What is the HCF of 12 and 18?",
            "options": ["2", "3", "6", "9"],
            "correct": 2,
            "explanation": "Factors of 12: 1,2,3,4,6,12. Factors of 18: 1,2,3,6,9,18. HCF = 6.",
        },
        {
            "question": "The HCF of two numbers is 4 and their LCM is 48. If one number is 16, what is the other?",
            "options": ["8", "12", "16", "24"],
            "correct": 1,
            "explanation": "Using HCF × LCM = product of numbers: 4 × 48 = 16 × other → other = 192/16 = 12.",
        },
    ],
    ("quantitative", "percentages", "medium"): [
        {
            "question": "A shirt costs ₹800. After a 15% discount, what is the selling price?",
            "options": ["₹640", "₹660", "₹680", "₹700"],
            "correct": 2,
            "explanation": "Discount = 15% of 800 = 120. Selling price = 800 - 120 = ₹680.",
        },
        {
            "question": "If 40% of a number is 120, what is 25% of that number?",
            "options": ["60", "70", "75", "80"],
            "correct": 2,
            "explanation": "Number = 120/0.4 = 300. 25% of 300 = 75.",
        },
        {
            "question": "Population of a town increases by 10% per year. After 2 years it is 12,100. What was the original population?",
            "options": ["9000", "10000", "11000", "10500"],
            "correct": 1,
            "explanation": "P × 1.1 × 1.1 = 12100 → P × 1.21 = 12100 → P = 10000.",
        },
    ],
    ("logical", "blood relations", "medium"): [
        {
            "question": "A is B's sister. C is B's mother. D is C's father. E is D's mother. How is A related to D?",
            "options": ["Granddaughter", "Daughter", "Grandmother", "Sister"],
            "correct": 0,
            "explanation": "A is B's sister → A is C's daughter → C is D's daughter → A is D's granddaughter.",
        },
        {
            "question": "Pointing to a photograph, Riya says 'He is the son of my grandfather's only son.' How is the person in the photograph related to Riya?",
            "options": ["Father", "Brother", "Uncle", "Cousin"],
            "correct": 1,
            "explanation": "Riya's grandfather's only son = Riya's father. His son = Riya's brother.",
        },
        {
            "question": "If X is the brother of Y, Y is the sister of Z, and Z is the son of W, how is X related to W?",
            "options": ["Son", "Daughter", "Nephew", "Cannot be determined"],
            "correct": 0,
            "explanation": "Z is W's son → Y is W's child (sister of Z) → X is Y's brother → X is also W's son.",
        },
    ],
    ("verbal", "synonyms and antonyms", "basic"): [
        {
            "question": "Choose the synonym of CANDID:",
            "options": ["Dishonest", "Frank", "Timid", "Selfish"],
            "correct": 1,
            "explanation": "CANDID means frank, open, and honest. 'Frank' is the closest synonym.",
        },
        {
            "question": "Choose the antonym of BENEVOLENT:",
            "options": ["Kind", "Generous", "Malevolent", "Charitable"],
            "correct": 2,
            "explanation": "BENEVOLENT means well-meaning and kind. Its antonym is MALEVOLENT (having evil intentions).",
        },
        {
            "question": "Choose the synonym of METICULOUS:",
            "options": ["Careless", "Thorough", "Rapid", "Vague"],
            "correct": 1,
            "explanation": "METICULOUS means showing great attention to detail. 'Thorough' is the best synonym.",
        },
    ],
    ("data_interpretation", "bar graphs", "difficult"): [
        {
            "question": "A bar graph shows sales (units): 2019=500, 2020=600, 2021=750, 2022=900, 2023=1000. What is the percentage increase in sales from 2019 to 2023?",
            "options": ["80%", "90%", "100%", "110%"],
            "correct": 2,
            "explanation": "Increase = (1000-500)/500 × 100 = 500/500 × 100 = 100%.",
        },
        {
            "question": "Using the same bar graph, what is the average annual sales from 2019 to 2023?",
            "options": ["700", "720", "750", "760"],
            "correct": 2,
            "explanation": "Average = (500+600+750+900+1000)/5 = 3750/5 = 750.",
        },
        {
            "question": "If the 2024 sales are projected to grow at the same rate as 2022 to 2023, what will the 2024 sales be?",
            "options": ["1050", "1100", "1111", "1125"],
            "correct": 2,
            "explanation": "Growth rate 2022→2023 = (1000-900)/900 = 11.11%. 2024 = 1000 × (1 + 1/9) ≈ 1111.",
        },
    ],
}


def _get_fallback(category: str, topic: str, difficulty: str, count: int) -> list[dict]:
    key = (category.lower(), topic.lower(), difficulty.lower())
    pool = FALLBACKS.get(key, [])
    if pool:
        return pool[:count]
    # Generic fallback
    return [
        {
            "question": f"[{CATEGORY_LABELS.get(category, category)}] {topic} — {difficulty.title()} level question {i+1}. (AI unavailable — add GOOGLE_API_KEY for real questions)",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct": 0,
            "explanation": f"This is a placeholder. Enable AI by setting GOOGLE_API_KEY in backend/.env.",
        }
        for i in range(count)
    ]


def _generate_with_ai(category: str, topic: str, difficulty: str, count: int) -> list[dict] | None:
    if not AI_AVAILABLE:
        return None

    cat_label  = CATEGORY_LABELS.get(category, category)
    diff_desc  = DIFF_DESC.get(difficulty.lower(), "moderate")

    prompt = f"""You are an expert aptitude test creator for placement and competitive exams.

Generate exactly {count} multiple-choice questions (MCQs).

Category: {cat_label}
Topic: {topic}
Difficulty: {difficulty.title()} ({diff_desc})

Rules:
- Every question must specifically test {topic} within {cat_label}
- Difficulty must match exactly
- Each question must have exactly 4 options labeled A/B/C/D
- Exactly one correct answer per question
- Explanation must clearly show why the correct answer is right
- For quantitative: show step-by-step calculation
- For logical: show the reasoning chain
- For verbal: explain the meaning/grammar rule
- Do NOT repeat questions

Return ONLY valid JSON array (no markdown, no extra text):
[
  {{
    "question": "Full question text",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correct": 0,
    "explanation": "Clear step-by-step explanation of why this answer is correct"
  }}
]

The "correct" field is a 0-based index (0=A, 1=B, 2=C, 3=D)."""

    raw = _call_gemini(prompt)
    if not raw:
        return None
    parsed = _extract_json(raw)
    if not isinstance(parsed, list):
        return None

    valid = []
    for q in parsed:
        if (isinstance(q, dict)
                and "question" in q and "options" in q
                and "correct" in q and "explanation" in q
                and isinstance(q["options"], list) and len(q["options"]) == 4
                and isinstance(q["correct"], int) and 0 <= q["correct"] <= 3):
            valid.append(q)
    return valid if valid else None


# ─────────────────────────────────────────────────────────────────────────────
#  ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/topics")
def get_all_topics(current_user: User = Depends(get_current_user)):
    return {k: {"label": CATEGORY_LABELS[k], "topics": v} for k, v in APTITUDE_TOPICS.items()}


@router.get("/topics/{category}")
def get_topics_for_category(category: str, current_user: User = Depends(get_current_user)):
    cat = category.lower()
    if cat not in APTITUDE_TOPICS:
        raise HTTPException(status_code=400, detail=f"Unknown category. Use: {list(APTITUDE_TOPICS.keys())}")
    return {"category": cat, "label": CATEGORY_LABELS[cat], "topics": APTITUDE_TOPICS[cat]}


@router.post("/generate")
async def generate_questions(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    category   = payload.get("category", "").strip().lower()
    topic      = payload.get("topic", "").strip()
    difficulty = payload.get("difficulty", "").strip().lower()
    count      = max(3, min(10, int(payload.get("count", 5))))

    if not category or not topic or not difficulty:
        raise HTTPException(status_code=400, detail="category, topic, and difficulty are required")
    if category not in APTITUDE_TOPICS:
        raise HTTPException(status_code=400, detail=f"Unknown category: {category}")
    if difficulty not in ("basic", "medium", "difficult"):
        raise HTTPException(status_code=400, detail="difficulty must be: basic, medium, or difficult")
    valid_topics_lower = [t.lower() for t in APTITUDE_TOPICS[category]]
    if topic.lower() not in valid_topics_lower:
        raise HTTPException(status_code=400, detail=f"Topic '{topic}' is not in {category}")

    try:
        questions = _generate_with_ai(category, topic, difficulty, count)
        if not questions:
            questions = _get_fallback(category, topic, difficulty, count)
        return {
            "category":   category,
            "category_label": CATEGORY_LABELS[category],
            "topic":      topic,
            "difficulty": difficulty,
            "count":      len(questions),
            "ai_generated": bool(AI_AVAILABLE),
            "questions":  questions,
        }
    except Exception as e:
        print(f"[Aptitude] Generate error: {e}")
        questions = _get_fallback(category, topic, difficulty, count)
        return {
            "category": category,
            "category_label": CATEGORY_LABELS[category],
            "topic": topic,
            "difficulty": difficulty,
            "count": len(questions),
            "ai_generated": False,
            "questions": questions,
        }
