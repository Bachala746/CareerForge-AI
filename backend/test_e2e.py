"""Full end-to-end test of InterviewOS backend API."""
import requests
import json
import sys

BASE = "http://localhost:8000/api"
PASS = []
FAIL = []

def check(name, condition, detail=""):
    if condition:
        PASS.append(name)
        print(f"  [PASS] {name}")
    else:
        FAIL.append(name)
        print(f"  [FAIL] {name} {detail}")

def run():
    print("\n=== InterviewOS Backend E2E Test ===\n")

    # 1. Health
    print("[1] Health Check")
    r = requests.get(f"{BASE.replace('/api','')}/health")
    check("Backend reachable", r.status_code == 200)
    check("Status healthy", r.json().get("status") == "healthy")

    # 2. Register
    print("\n[2] Registration")
    r = requests.post(f"{BASE}/auth/register", json={
        "email": "testuser_e2e@interviewos.dev",
        "password": "TestPass123",
        "full_name": "E2E Test User"
    })
    if r.status_code == 200:
        data = r.json()
        token = data.get("access_token")
        check("Register returns token", bool(token))
        check("Register returns user", "user" in data)
    elif r.status_code == 400 and "already" in r.text.lower():
        print("  [INFO] User already exists, trying login...")
        token = None
    else:
        check("Register", False, f"status={r.status_code} {r.text[:100]}")
        token = None

    # 3. Login
    print("\n[3] Login")
    r = requests.post(f"{BASE}/auth/login", json={
        "email": "testuser_e2e@interviewos.dev",
        "password": "TestPass123"
    })
    check("Login succeeds", r.status_code == 200, f"status={r.status_code}")
    if r.status_code == 200:
        token = r.json().get("access_token")
        check("Login returns token", bool(token))

    if not token:
        print("\n[ABORT] No token — skipping authenticated tests")
        return

    H = {"Authorization": f"Bearer {token}"}

    # 4. /auth/me
    print("\n[4] Auth /me")
    r = requests.get(f"{BASE}/auth/me", headers=H)
    check("/me returns 200", r.status_code == 200)
    if r.status_code == 200:
        me = r.json()
        check("/me has email", "email" in me)
        check("/me has correct email", me.get("email") == "testuser_e2e@interviewos.dev")

    # 5. Dashboard
    print("\n[5] Dashboard")
    r = requests.get(f"{BASE}/dashboard/stats", headers=H)
    check("Dashboard stats 200", r.status_code == 200, f"{r.status_code} {r.text[:60]}")

    r = requests.get(f"{BASE}/dashboard/weekly-progress", headers=H)
    check("Weekly progress 200", r.status_code == 200)

    r = requests.get(f"{BASE}/dashboard/recent-interviews", headers=H)
    check("Recent interviews 200", r.status_code == 200)

    # 6. Interview Setup
    print("\n[6] Interview Setup")
    r = requests.post(f"{BASE}/interviews/setup", headers=H, json={
        "company": "Google",
        "role": "Software Engineer",
        "interview_type": "mixed",
        "personality": "friendly",
        "difficulty": "adaptive",
        "duration_minutes": 30,
        "experience_level": "junior"
    })
    check("Setup returns 200", r.status_code == 200, f"{r.status_code} {r.text[:100]}")
    session_id = None
    if r.status_code == 200:
        session = r.json()
        session_id = session.get("session_id")
        check("Session has ID", bool(session_id))
        check("Session has questions", len(session.get("questions", [])) > 0)
        q_count = len(session.get("questions", []))
        print(f"  [INFO] Generated {q_count} questions")

    # 7. Submit Answer
    if session_id:
        print("\n[7] Submit Answer")
        questions = r.json().get("questions", [])
        if questions:
            q_id = questions[0]["id"]
            r2 = requests.post(f"{BASE}/interviews/session/{session_id}/answer", headers=H, json={
                "question_id": q_id,
                "answer_text": "I have 2 years of experience building full-stack applications using React and Python FastAPI. My most notable project was an e-commerce platform that handled 10,000 daily active users.",
                "duration_secs": 45,
                "generate_followup": False
            })
            check("Answer submit 200", r2.status_code == 200, f"{r2.status_code} {r2.text[:100]}")
            if r2.status_code == 200:
                eval_data = r2.json()
                check("Evaluation has scores", "evaluation" in eval_data)

    # 8. Users profile
    print("\n[8] User Profile")
    r = requests.get(f"{BASE}/users/profile", headers=H)
    check("Profile 200", r.status_code == 200)

    r = requests.get(f"{BASE}/users/stats", headers=H)
    check("User stats 200", r.status_code == 200)

    # 9. Mentor Chat
    print("\n[9] AI Mentor Chat")
    r = requests.post(f"{BASE}/ai/mentor-chat", headers=H, json={
        "message": "What is the STAR method for behavioral interviews?",
        "history": []
    })
    check("Mentor chat 200", r.status_code == 200, f"{r.status_code} {r.text[:100]}")
    if r.status_code == 200:
        check("Chat returns response", bool(r.json().get("response")))

    # 10. Reports
    print("\n[10] Reports")
    r = requests.get(f"{BASE}/reports/all", headers=H)
    check("Reports list 200", r.status_code == 200)

    # Summary
    print(f"\n{'='*40}")
    print(f"PASSED: {len(PASS)}/{len(PASS)+len(FAIL)}")
    print(f"FAILED: {len(FAIL)}/{len(PASS)+len(FAIL)}")
    if FAIL:
        print(f"\nFailed tests: {', '.join(FAIL)}")
    else:
        print("\nAll tests passed!")

    return len(FAIL) == 0

if __name__ == "__main__":
    success = run()
    sys.exit(0 if success else 1)
