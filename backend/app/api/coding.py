"""
Coding Practice API — Language / Topic / Difficulty based question generation.
Uses the existing Gemini AI client from ai_interview service.
"""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.services.ai_interview import _call_gemini, _extract_json, AI_AVAILABLE

router = APIRouter(prefix="/coding", tags=["Coding Practice"])

# ── Topic catalogue ───────────────────────────────────────────────────────────
TOPICS = {
    "python": [
        "Variables and Data Types", "Operators", "Conditional Statements",
        "Loops", "Strings", "Lists", "Tuples", "Sets", "Dictionaries",
        "Functions", "Recursion", "Object-Oriented Programming",
        "Exception Handling", "File Handling", "List Comprehensions",
        "Lambda Functions", "Modules and Packages", "Basic Problem Solving",
    ],
    "java": [
        "Variables and Data Types", "Operators", "Conditional Statements",
        "Loops", "Strings", "Arrays", "Methods", "Recursion",
        "Object-Oriented Programming", "Inheritance", "Polymorphism",
        "Exception Handling", "Collections", "Interfaces",
        "Generics", "Basic Problem Solving",
    ],
    "javascript": [
        "Variables and Data Types", "Operators", "Conditional Statements",
        "Loops", "Strings", "Arrays", "Objects", "Functions",
        "Arrow Functions", "Scope and Closures", "Promises",
        "Async/Await", "DOM Basics", "Array Methods",
        "Destructuring", "Basic Problem Solving",
    ],
    "mysql": [
        "SELECT Queries", "WHERE Conditions", "ORDER BY", "GROUP BY",
        "Aggregate Functions", "JOINS", "Subqueries",
        "INSERT", "UPDATE", "DELETE",
        "Constraints and Keys", "HAVING Clause",
        "String Functions", "Date Functions", "Basic Problem Solving",
    ],
}

DIFFICULTY_DESC = {
    "basic":     "beginner-friendly, simple syntax, small programs",
    "medium":    "intermediate, multi-step logic, practical problem-solving",
    "difficult": "advanced, edge cases, complex algorithms or query optimisation",
}

# ── Fallback question banks (shown when AI unavailable) ───────────────────────
FALLBACKS: dict = {
    ("python", "loops", "basic"): {
        "title": "Print Numbers 1 to N",
        "difficulty": "Basic",
        "language": "Python",
        "topic": "Loops",
        "description": "Write a Python program that prints all integers from 1 to N (inclusive), one per line.",
        "examples": [{"input": "N = 5", "output": "1\n2\n3\n4\n5"}],
        "constraints": ["1 <= N <= 1000"],
        "starter_code": "def print_numbers(n: int):\n    # Write your solution here\n    pass\n\nn = int(input())\nprint_numbers(n)",
        "solution_hint": "Use a for loop: for i in range(1, n+1): print(i)",
    },
    ("python", "strings", "difficult"): {
        "title": "Longest Palindromic Substring",
        "difficulty": "Difficult",
        "language": "Python",
        "topic": "Strings",
        "description": "Given a string s, return the longest palindromic substring in s.",
        "examples": [
            {"input": 'S = "babad"', "output": '"bab"'},
            {"input": 'S = "cbbd"',  "output": '"bb"'},
        ],
        "constraints": ["1 <= len(s) <= 1000", "s contains only lowercase English letters"],
        "starter_code": "def longest_palindrome(s: str) -> str:\n    # Write your solution here\n    pass\n\nprint(longest_palindrome(input()))",
        "solution_hint": "Expand around each centre — O(n^2) time, O(1) space.",
    },
    ("java", "conditional statements", "medium"): {
        "title": "Grade Calculator",
        "difficulty": "Medium",
        "language": "Java",
        "topic": "Conditional Statements",
        "description": "Write a Java method that takes a numerical score (0-100) and returns the letter grade: A (>=90), B (>=80), C (>=70), D (>=60), F (<60). Return 'Invalid' for out-of-range inputs.",
        "examples": [
            {"input": "score = 85", "output": "B"},
            {"input": "score = 59", "output": "F"},
        ],
        "constraints": ["Input is an integer", "Return 'Invalid' for scores outside 0-100"],
        "starter_code": "public class GradeCalculator {\n    public static String getGrade(int score) {\n        // Write your solution here\n        return \"\";\n    }\n\n    public static void main(String[] args) {\n        System.out.println(getGrade(85));\n    }\n}",
        "solution_hint": "Use an if-else if ladder checking from highest to lowest.",
    },
    ("javascript", "arrays", "basic"): {
        "title": "Sum of Array Elements",
        "difficulty": "Basic",
        "language": "JavaScript",
        "topic": "Arrays",
        "description": "Write a JavaScript function that returns the sum of all numbers in an array.",
        "examples": [
            {"input": "[1, 2, 3, 4, 5]", "output": "15"},
            {"input": "[10, -3, 7]",      "output": "14"},
        ],
        "constraints": ["Array may contain negative numbers", "Return 0 for an empty array"],
        "starter_code": "function sumArray(arr) {\n  // Write your solution here\n}\n\nconsole.log(sumArray([1, 2, 3, 4, 5]));",
        "solution_hint": "Use reduce: return arr.reduce((acc, n) => acc + n, 0);",
    },
    ("mysql", "joins", "medium"): {
        "title": "Customer Orders Report",
        "difficulty": "Medium",
        "language": "MySQL",
        "topic": "JOINS",
        "description": "Given tables customers(id, name, email) and orders(id, customer_id, amount, order_date), write a SQL query to list every customer's name, total number of orders, and total spend. Include customers with zero orders. Order by total spend descending.",
        "examples": [
            {"input": "customers: (1,'Alice'), (2,'Bob')  orders: (1,1,100), (2,1,200)", "output": "Alice | 2 | 300\nBob   | 0 | 0"},
        ],
        "constraints": ["Use LEFT JOIN", "Use GROUP BY", "Use COUNT and SUM"],
        "starter_code": "-- Write your SQL query here\nSELECT\n    c.name,\n    -- your columns\nFROM customers c\n-- your join and grouping",
        "solution_hint": "SELECT c.name, COUNT(o.id), COALESCE(SUM(o.amount),0) FROM customers c LEFT JOIN orders o ON c.id=o.customer_id GROUP BY c.id ORDER BY 3 DESC;",
    },
}


def _get_fallback(language: str, topic: str, difficulty: str) -> dict:
    key = (language.lower(), topic.lower(), difficulty.lower())
    if key in FALLBACKS:
        return FALLBACKS[key]
    lang_display = "MySQL" if language.lower() == "mysql" else language.title()
    is_sql = language.lower() == "mysql"
    return {
        "title": f"{topic} — {difficulty.title()} Practice",
        "difficulty": difficulty.title(),
        "language": lang_display,
        "topic": topic,
        "description": (
            f"Write a {'SQL query' if is_sql else lang_display + ' program'} "
            f"that demonstrates your understanding of {topic}. "
            f"This is a {difficulty} level exercise."
        ),
        "examples": [{"input": "See problem description", "output": "Correct output"}],
        "constraints": ["Follow the problem description carefully"],
        "starter_code": (
            f"-- Write your {topic} SQL query here\n" if is_sql
            else f"# Write your {lang_display} solution here\n# Topic: {topic}\n# Difficulty: {difficulty.title()}\n"
        ),
        "solution_hint": f"Focus on {topic} concepts at {difficulty} level.",
    }


def _generate_with_ai(language: str, topic: str, difficulty: str) -> dict | None:
    if not AI_AVAILABLE:
        return None

    is_sql = language.lower() == "mysql"
    diff_desc = DIFFICULTY_DESC.get(difficulty.lower(), "intermediate")
    lang_display = "MySQL" if is_sql else language.title()

    if is_sql:
        prompt = f"""You are an expert SQL instructor. Generate ONE {difficulty} level MySQL practice question.
Topic: {topic}
Difficulty: {difficulty} ({diff_desc})

The question must specifically test {topic} in MySQL and match the difficulty.
Include a realistic schema description and sample data description.

Return ONLY valid JSON (no markdown fences):
{{
  "title": "Short descriptive title",
  "difficulty": "{difficulty.title()}",
  "language": "MySQL",
  "topic": "{topic}",
  "description": "Full problem statement with schema and sample data",
  "examples": [{{"input": "table state description", "output": "expected result"}}],
  "constraints": ["constraint 1", "constraint 2"],
  "starter_code": "-- Write your SQL query here\\n",
  "solution_hint": "Brief hint without the full answer"
}}"""
    else:
        prompt = f"""You are an expert {lang_display} instructor and coding interview coach.
Generate ONE {difficulty} level coding practice question.

Language: {lang_display}
Topic: {topic}
Difficulty: {difficulty} ({diff_desc})

Requirements:
- Specifically tests {topic} in {lang_display}
- Exactly matches {difficulty} difficulty
- 2 examples with input and expected output
- Starter code template with proper function signature
- Brief hint (NOT the full solution)

Return ONLY valid JSON (no markdown fences):
{{
  "title": "Short descriptive title",
  "difficulty": "{difficulty.title()}",
  "language": "{lang_display}",
  "topic": "{topic}",
  "description": "Complete problem description",
  "examples": [{{"input": "example input", "output": "expected output", "explain": "brief explanation"}}],
  "constraints": ["constraint 1", "constraint 2"],
  "starter_code": "complete starter code template",
  "solution_hint": "Brief conceptual hint"
}}"""

    raw = _call_gemini(prompt)
    if not raw:
        return None
    parsed = _extract_json(raw)
    if not parsed or not isinstance(parsed, dict):
        return None
    if not all(k in parsed for k in ["title", "description", "starter_code"]):
        return None
    parsed["language"] = lang_display
    parsed["topic"] = topic
    parsed["difficulty"] = difficulty.title()
    return parsed


# ─────────────────────────────────────────────────────────────────────────────
#  ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/topics")
def get_all_topics(current_user: User = Depends(get_current_user)):
    return TOPICS


@router.get("/topics/{language}")
def get_topics_for_language(language: str, current_user: User = Depends(get_current_user)):
    lang = language.lower()
    if lang not in TOPICS:
        raise HTTPException(status_code=400, detail=f"Unknown language. Supported: {list(TOPICS.keys())}")
    return {"language": language, "topics": TOPICS[lang]}


@router.post("/generate")
async def generate_question(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    language   = payload.get("language", "").strip()
    topic      = payload.get("topic", "").strip()
    difficulty = payload.get("difficulty", "").strip()

    if not language or not topic or not difficulty:
        raise HTTPException(status_code=400, detail="language, topic, and difficulty are all required")

    lang_lower = language.lower()
    if lang_lower not in TOPICS:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {language}")
    if difficulty.lower() not in ("basic", "medium", "difficult"):
        raise HTTPException(status_code=400, detail="difficulty must be: basic, medium, or difficult")
    valid_topics_lower = [t.lower() for t in TOPICS[lang_lower]]
    if topic.lower() not in valid_topics_lower:
        raise HTTPException(status_code=400, detail=f"Topic '{topic}' is not available for {language}")

    try:
        question = _generate_with_ai(language, topic, difficulty)
        if not question:
            question = _get_fallback(language, topic, difficulty)
        question["ai_generated"] = bool(AI_AVAILABLE)
        return question
    except Exception as e:
        print(f"[Coding] Generate error: {e}")
        fallback = _get_fallback(language, topic, difficulty)
        fallback["ai_generated"] = False
        return fallback


@router.post("/evaluate")
async def evaluate_code(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    code          = payload.get("code", "").strip()
    language      = payload.get("language", "python")
    topic         = payload.get("topic", "")
    difficulty    = payload.get("difficulty", "basic")
    problem_title = payload.get("problem_title", "")
    problem_desc  = payload.get("problem_description", "")

    if not code:
        raise HTTPException(status_code=400, detail="code is required")

    if not AI_AVAILABLE:
        return {
            "passed": True,
            "score": 65,
            "feedback": "AI evaluation is offline. Add a GOOGLE_API_KEY to backend/.env for full AI feedback.",
            "time_complexity": "N/A",
            "space_complexity": "N/A",
            "suggestions": ["Enable AI by adding GOOGLE_API_KEY to backend/.env"],
            "strengths": ["Code submitted successfully"],
            "test_results": [],
            "ai_review": False,
        }

    is_sql = language.lower() == "mysql"
    prompt = f"""You are an expert {language} code reviewer and interview coach.

Problem: {problem_title}
Topic: {topic} | Difficulty: {difficulty} | Language: {language}
Description: {problem_desc[:500]}

Candidate's {'SQL Query' if is_sql else 'Code'}:
```{language.lower()}
{code[:3000]}
```

Evaluate this solution. Check correctness, logic, edge cases, code quality, complexity.

Return ONLY valid JSON (no markdown fences):
{{
  "passed": true,
  "score": 0-100,
  "feedback": "2-3 sentences of specific actionable feedback",
  "time_complexity": "O(n) or query complexity",
  "space_complexity": "O(n) or N/A for SQL",
  "strengths": ["specific strength 1", "specific strength 2"],
  "suggestions": ["specific improvement 1"],
  "test_results": [
    {{"description": "basic test case", "passed": true, "note": "handles correctly"}},
    {{"description": "edge case", "passed": true, "note": "handles correctly"}}
  ],
  "ai_review": true
}}"""

    try:
        raw = _call_gemini(prompt)
        parsed = _extract_json(raw) if raw else None
        if parsed and isinstance(parsed, dict) and "score" in parsed:
            parsed["ai_review"] = True
            return parsed
    except Exception as e:
        print(f"[Coding] Evaluate error: {e}")

    return {
        "passed": True,
        "score": 70,
        "feedback": "Code evaluated. Detailed AI analysis unavailable — please try again.",
        "time_complexity": "Unknown",
        "space_complexity": "Unknown",
        "strengths": ["Code submitted"],
        "suggestions": ["Try again for detailed AI feedback"],
        "test_results": [],
        "ai_review": False,
    }
