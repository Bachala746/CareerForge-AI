# InterviewOS — AI-Powered Interview Preparation and Assessment Platform
### Complete Project Report | Final Year Project Documentation

---

## 1. Introduction to InterviewOS

### What is InterviewOS?

InterviewOS is a full-stack, AI-powered interview preparation and assessment platform designed to help job seekers prepare for technical, behavioral, and coding interviews in a realistic and personalized way. It is not simply a question bank or a set of static practice problems. InterviewOS acts as an intelligent interview simulator that understands the candidate's resume, matches it with a selected job role and job description, conducts a live AI-driven interview, evaluates every response, assesses coding skills, identifies skill gaps, and produces a detailed recruiter-style report with actionable learning recommendations.

### What Problem Does It Solve?

Most job seekers prepare for interviews using random YouTube videos, generic question lists from websites, or by practicing with friends. None of these approaches are personalized to the candidate's actual background, the specific job role, or the company's requirements. As a result, candidates often walk into interviews underprepared, unaware of their weak areas, and without any idea of how a real recruiter would evaluate them.

InterviewOS solves this by creating a personalized, end-to-end interview preparation experience that is based entirely on the candidate's own resume, the target job description, and their actual interview and coding performance.

### Target Users

- Final-year engineering and computer science students preparing for campus placements
- Fresh graduates applying for their first software engineering job
- Working professionals looking to switch roles or companies
- Candidates preparing for FAANG, startup, or product-based company interviews
- Anyone who wants structured, AI-based feedback on their interview readiness

### What Makes It Different From a Normal Interview Practice Website?

| Traditional Interview Practice | InterviewOS |
|---|---|
| Fixed question lists | Dynamic AI-generated questions based on resume and JD |
| No personalization | Fully personalized based on your resume and target role |
| No feedback | Detailed AI evaluation of every answer |
| No coding assessment | Integrated coding interview with code execution |
| No skill gap | Automated skill gap analysis with evidence |
| No report | Full recruiter-style report after every interview |
| No progress tracking | Visual progress tracking across multiple attempts |

### How Scores and Recommendations Are Generated

Every score, analysis result, skill gap, and learning recommendation in InterviewOS is generated from the candidate's actual data. The system does not assign random numbers. The resume score is computed from the content of the uploaded resume. The interview scores come from AI evaluation of the candidate's real answers. The skill gap is identified by comparing skills extracted from the resume against skills required by the job description, further validated by how the candidate performed during the interview. The recruiter report is written based on this collected evidence.

---

## 2. Overall Working of InterviewOS

InterviewOS follows a logical end-to-end workflow:

```
Register / Login
      |
Complete User Profile
      |
Upload Resume --> AI Resume Analysis --> Resume Score
      |
Select Target Job Role + Enter Job Description
      |
Skill Matching: Resume Skills vs JD Requirements
      |
Interview Setup (Type, Difficulty, Duration)
      |
AI Interview Session
  - Behavioral Questions
  - Technical Questions
  - Role-specific Questions
  - Follow-up Questions
      |
Coding Interview Round
  - Problem Selection
  - Code Submission
  - Automated Evaluation
      |
Response Analysis + Scoring
      |
Skill Gap Identification
      |
Learning Recommendations
      |
Recruiter-Style Final Report
      |
Dashboard Progress Update
      |
User Practices Weak Areas
      |
Next Interview Attempt --> Comparison with Previous
```

At every stage, information passes forward. The resume analysis feeds the interview question generation. The interview answers feed the scoring engine. The scores feed the skill gap analysis. The skill gap feeds the learning recommendations. The final report brings everything together. The dashboard tracks how this improves over time.

---

## 3. Login and User Authentication

### Sign Up

A new user visits InterviewOS and clicks "Create Account." They provide their full name, email address, and a password. The password is validated for minimum strength (at least 8 characters, contains a letter and a number). On successful registration, the backend creates a user account, generates a JWT access token and a refresh token, and returns them to the frontend. The user is immediately logged in and redirected to their dashboard.

### Login

A returning user enters their email and password. The backend verifies the credentials, checks that the account is active, and returns a fresh JWT token pair. The token is stored securely and sent with every subsequent API request as a Bearer token in the Authorization header.

### Secure Authentication

InterviewOS uses JSON Web Tokens (JWT) for authentication. Passwords are never stored in plain text. They are hashed using Argon2, a modern password hashing algorithm. The access token expires after 60 minutes. The refresh token is valid for 30 days and can be used to obtain a new access token without requiring the user to log in again.

### First-Time User Experience

After registering for the first time, the user lands on a clean dashboard that encourages them to complete their profile, upload a resume, and start their first interview. Dashboard cards show zeros and prompt the user to take action. A guided onboarding flow walks them through what to do next.

### Returning User Experience

A returning user logs in and immediately sees their dashboard populated with real data: their resume score, last interview score, overall interview readiness, skill gap summary, and recommended next steps. They can jump directly into a new interview or review their previous reports.

### How the System Identifies User Data

Every piece of data in InterviewOS - resume, interviews, scores, skill gaps, reports - is linked to the user's account ID. When the user logs in, the backend retrieves all data associated with their account and sends it to the dashboard. The frontend displays their personalized information, not data from any other user.

---

## 4. Dashboard

The dashboard is the central control panel of InterviewOS. Everything the user needs is accessible from here.

### Dashboard Options

**Overview**
The main landing page after login. Shows the user's overall interview readiness score, resume score, recent interview performance, skill gap summary, and recommended next actions. All numbers shown here are calculated from actual assessment data.

**Resume**
The user can upload a new resume (PDF or DOCX), view their currently active resume, and see the extracted information - skills, projects, experience, and education. They can re-upload a resume at any time, and the system will re-analyze it.

**Resume Analysis**
Shows the detailed AI analysis of the uploaded resume. Displays extracted skills, experience level, identified projects, education details, missing sections, ATS (Applicant Tracking System) score, and suggestions to improve the resume.

**Job Roles**
Allows the user to browse or search for target job roles such as Software Engineer, Data Scientist, Product Manager, Full Stack Developer, and others. Selecting a job role automatically loads the typical required skills and experience for that role.

**Job Description**
The user can paste or type the exact job description from the company they are targeting. The system analyzes the JD, extracts required skills, compares them with the user's resume skills, and produces a match score and skill gap summary.

**Start Interview**
Opens the interview setup page where the user selects the interview type (technical, behavioral, mixed), difficulty level (easy, medium, hard), and duration. After setup, the AI interview session begins.

**Interview History**
Shows all past interview sessions with their date, job role, scores for each category, and a link to the full report. Users can compare their scores across multiple attempts.

**Coding Practice**
A coding interview environment where users can solve programming problems. Includes a code editor, test case runner, and performance evaluation.

**Skill Gap**
Shows the identified skill gaps - which required skills the user has, which are partially developed, and which are missing entirely. Organized by priority.

**Learning Recommendations**
Provides a personalized learning roadmap based on the identified skill gaps. Recommends topics to study, coding problems to practice, and interview question types to focus on.

**Performance / Progress**
Visual charts and graphs showing how the user's scores have changed over time across multiple interview attempts.

**Reports**
A list of all generated recruiter-style reports, one for each completed interview session. The user can open, read, and download any report.

**Profile**
The user's personal and professional details - name, email, target role, target company, experience level, university, LinkedIn, GitHub, and other profile fields.

**Settings**
Account preferences including password change, notification settings, and data management options.

### Dashboard Cards and Widgets

| Card | What It Shows | How It Is Calculated |
|---|---|---|
| Overall Interview Score | Combined performance across all interview dimensions | Weighted average of technical, communication, behavioral, coding scores |
| Resume Score | Quality and completeness of the uploaded resume | Based on skill relevance, sections present, keyword alignment, ATS friendliness |
| Technical Score | Average technical knowledge from interview answers | AI evaluation of technical question responses |
| Communication Score | Clarity and quality of spoken/written answers | Based on answer completeness, structure, clarity, use of examples |
| Coding Score | Coding interview performance | Test cases passed, time complexity, code correctness |
| Skill Match | Percentage of required skills found in resume | (Matching skills / Total required skills) x 100 |
| Interview Attempts | Total number of completed interview sessions | Count from database |
| Recent Performance | Score from the most recent interview | Latest session's overall score |
| Skill Gap Summary | Number of missing and partially developed skills | Count of gaps from latest JD comparison |
| Recommended Actions | Top 3 things the user should do next | Generated from skill gap and lowest scoring areas |

---

## 5. Resume Upload and Resume Analysis

### Resume Upload

The user uploads their resume in PDF or DOCX format. The file is saved securely on the backend server. The system extracts the text content from the file using document parsing libraries.

### Resume Text Extraction

The extracted text is sent to the AI analysis service. The AI reads the entire resume and identifies different sections such as Education, Skills, Work Experience, Projects, Certifications, and Achievements.

### Section Identification

The AI identifies what sections are present and what sections are missing. A strong resume typically includes: contact information, a professional summary, skills, work experience, projects, education, and certifications.

### Skills Extraction

The AI reads the skills section and also finds skills mentioned throughout the resume - in project descriptions, experience bullet points, and certifications. It produces a consolidated list of skills the candidate has demonstrated.

### Experience Analysis

Work experience is extracted and structured - company name, role, duration, and key responsibilities. The AI determines the candidate's approximate experience level (fresher, junior, mid-level, senior) based on total years and roles described.

### Projects Analysis

Projects mentioned in the resume are identified. The AI extracts the technologies used, the scale or impact of the project, and what problems it solved. This helps in generating project-specific interview questions.

### Education Analysis

The AI extracts the degree, institution, field of study, graduation year, and CGPA if available.

### Resume Quality Analysis

The AI evaluates the overall quality of the resume for job readiness and ATS compatibility. It checks for:
- Whether key sections are present
- Whether technical skills are clearly listed
- Whether projects have measurable outcomes
- Whether action verbs are used in experience descriptions
- Whether the resume contains relevant keywords for the target role

---

## 6. Resume Score

The resume score is calculated using a weighted combination of factors:

| Factor | Weight | What It Evaluates |
|---|---|---|
| Skill relevance to target role | 25% | How many required skills appear in the resume |
| Resume completeness | 20% | Presence of all important sections |
| Project quality | 20% | Number, relevance, and technical depth of projects |
| Experience relevance | 15% | How closely past experience matches the target role |
| Keyword alignment | 10% | Resume keywords vs JD keywords |
| Clarity and structure | 10% | Readability, use of bullet points, action verbs |

**Formula:**
```
Resume Score =
  (Skill Relevance x 0.25) +
  (Completeness x 0.20) +
  (Project Quality x 0.20) +
  (Experience x 0.15) +
  (Keywords x 0.10) +
  (Clarity x 0.10)
```

The score is presented out of 100 and is accompanied by specific suggestions for improvement - for example, "Add measurable outcomes to your project descriptions" or "Include Docker and Kubernetes in your skills section."

---

## 7. Job Role and Job Description

### Job Role Selection

The user selects a target job role from a list - for example, "Software Engineer," "Data Scientist," or "Backend Developer." Each role comes with a predefined set of commonly required skills and typical interview question topics.

### Job Description Entry

The user pastes the actual job description from a company posting. This is the most specific input - it tells the system exactly what the company is looking for, in the company's own words.

### Skill Comparison

The system compares:
- Skills extracted from the user's resume
- Skills required by the selected job role
- Skills mentioned in the pasted job description

The result of this comparison is:
- **Matching Skills:** Skills the user has that are required
- **Partially Developed Skills:** Skills the user has at a basic level but needs to deepen
- **Missing Skills:** Skills required by the JD that are absent from the resume

### How This Feeds the Interview

The identified skill gaps directly influence question generation. If the system sees that the user has Python but is missing Machine Learning knowledge, the AI interviewer will ask questions about Python that are within the user's level, while probing into their understanding of Machine Learning concepts to assess the true depth of the gap.

---

## 8. AI Interview

### Interview Setup

Before starting, the user configures:
- **Job Role:** e.g., Data Scientist
- **Interview Type:** Technical, Behavioral, or Mixed
- **Personality of Interviewer:** Friendly, Neutral, or Challenging
- **Difficulty Level:** Easy, Medium, Hard, or Adaptive
- **Duration:** 15, 30, or 45 minutes

### Question Generation

The AI generates interview questions based on:
- The candidate's resume (skills, projects, experience)
- The selected job role
- The job description content
- The interview type and difficulty

Questions are not randomly selected from a static list. They are dynamically generated to match the candidate's specific profile.

### Interview Flow

```
AI asks a question
      |
Candidate types their answer
      |
System captures the answer
      |
AI evaluates the answer in the background
      |
AI decides the next question:
  - If the answer was strong --> ask a harder follow-up
  - If the answer was weak --> ask a clarifying or simpler question
  - If the topic is complete --> move to next topic
      |
Interview continues until all planned questions are covered
      |
Final session ends --> evaluation begins
```

### Dynamic Follow-up Questions

When the candidate gives an answer, the AI does not simply move to the next fixed question. It analyzes the response and generates a follow-up question based on what the candidate said.

Example:
- User says: "I used Docker to containerize my application."
- AI follows up: "Can you explain how you handled environment variable management between development and production containers?"

This makes the interview feel like a real conversation with a recruiter rather than a scripted quiz.

---

## 9. Voice and Communication Analysis

### What Can Be Measured

InterviewOS captures and analyzes the text content of every answer. From this, it evaluates:

- **Answer Relevance:** Did the answer address the question asked?
- **Completeness:** Did the candidate cover all important aspects of the question?
- **Structure:** Was the answer organized logically?
- **Clarity:** Was the answer clear and easy to understand?
- **Use of Examples:** Did the candidate support their points with specific examples?
- **Technical Accuracy:** For technical questions, were the facts correct?

### Communication Score Components

| Component | Measurement Method |
|---|---|
| Relevance | AI checks if answer addresses the question topic |
| Completeness | AI checks if all key points of the question were covered |
| Structure | AI checks if answer follows a logical flow |
| Clarity | Based on sentence structure and coherence of the answer |
| Example Usage | AI checks if specific examples or metrics were mentioned |

### Important Distinction

Communication scores based on text answers are indicators of communication quality, not absolute measurements. They reflect how well the candidate expressed their thoughts in writing. Audio-based features such as speaking pace, filler words, and voice confidence require speech-to-text integration and are clearly marked as approximate indicators when available.

---

## 10. Technical Interview

### How Technical Questions Are Generated

Technical questions are generated based on:
- The programming languages and frameworks listed on the resume
- The job description's required technical skills
- The role's typical technical interview topics
- The selected difficulty level

For a Backend Developer targeting a role requiring Python and PostgreSQL, the system might ask:
- "Explain the difference between a coroutine and a thread in Python."
- "How would you optimize a slow SQL query on a table with 10 million rows?"
- "What is database connection pooling and why is it important?"

### Question Types

- **Conceptual questions:** Test understanding of core concepts
- **Scenario-based questions:** Present a real-world problem and ask for a solution
- **Design questions:** Ask how the candidate would design a system or component
- **Debugging questions:** Describe a bug and ask how to find and fix it
- **Follow-up questions:** Based on the candidate's previous answer

### Answer Evaluation

Each technical answer is evaluated on:
- Technical accuracy
- Depth of explanation
- Real-world application
- Clarity of explanation

---

## 11. Coding Interview / Coding Feature

### How the Coding Round Works

After the conversational interview, the user enters the coding round. The system presents a programming problem appropriate for their skill level and target role.

### Coding Problem Setup

Each problem includes:
- **Problem Statement:** A clear description of the task
- **Input Format:** How input data is structured
- **Output Format:** What the solution should produce
- **Constraints:** Time limits, input size limits
- **Sample Test Cases:** Visible examples to understand the problem
- **Hidden Test Cases:** Used to evaluate correctness without being shown to the user

### Code Editor

The candidate writes their solution in a browser-based code editor (Monaco Editor - same as VS Code) that supports syntax highlighting and multiple programming languages (Python, Java, C++, JavaScript, and others).

### Code Execution

The submitted code is sent to the backend, which executes it in an isolated, sandboxed environment. This isolation ensures that no submitted code can harm the server or access system resources. The code is run against all test cases (both visible and hidden), and the results are returned to the frontend.

### Evaluation Criteria

| Factor | Weight | What It Evaluates |
|---|---|---|
| Correctness | 50% | Percentage of test cases passed |
| Time Efficiency | 20% | Is the solution within time limits? |
| Space Efficiency | 15% | Does the solution use reasonable memory? |
| Code Quality | 15% | Is the code clean, well-named, and readable? |

### How Coding Contributes to Overall Score

The coding score is one of the components of the overall interview score. For technical roles, it carries significant weight. For non-technical roles, it may carry less weight or be optional.

---

## 12. Behavioral and HR Interview

### Question Types

- **Behavioral questions:** "Tell me about a time you had to work under pressure."
- **HR questions:** "Why do you want to work at this company?"
- **Situational questions:** "What would you do if you disagreed with your manager's decision?"
- **Motivation questions:** "Where do you see yourself in five years?"
- **Teamwork and leadership:** "Describe a situation where you led a team to solve a problem."

### STAR Method Evaluation

For behavioral questions, the AI evaluates whether the candidate used the STAR method:
- **S**ituation: Did they set the context?
- **T**ask: Did they explain their responsibility?
- **A**ction: Did they describe what they specifically did?
- **R**esult: Did they share the outcome with measurable impact?

### Feedback

After each behavioral answer, the system provides feedback such as:
- "Your answer was clear but lacked a measurable outcome. Adding specific numbers would strengthen it."
- "Good use of the STAR structure. Your example effectively demonstrated leadership."

---

## 13. Interview Evaluation

### Overall Evaluation Components

After the interview ends, the scoring engine combines all individual scores:

| Component | Weight for Technical Role | Weight for Non-Technical Role |
|---|---|---|
| Technical Knowledge | 35% | 15% |
| Coding Performance | 25% | 10% |
| Communication | 20% | 35% |
| Behavioral Responses | 15% | 35% |
| Resume Relevance | 5% | 5% |

### Overall Score Formula

```
Overall Score =
  (Technical Score x Weight_T) +
  (Coding Score x Weight_C) +
  (Communication Score x Weight_Comm) +
  (Behavioral Score x Weight_B) +
  (Resume Match Score x Weight_R)
```

### Hiring Decision Indicator

| Score Range | Indicator |
|---|---|
| 85 to 100 | Strong Hire |
| 70 to 84 | Hire |
| 50 to 69 | Needs Improvement |
| Below 50 | Not Ready |

This indicator is not a guarantee of employment. It is a relative assessment of the candidate's readiness for the target role based on available evidence.

---

## 14. Recruiter-Style Report

### What the Report Contains

The recruiter report is the most comprehensive output of InterviewOS. It is written as if a senior recruiter conducted the interview and wrote a formal evaluation.

**Sections of the Report:**
1. **Executive Summary:** A 2-3 paragraph narrative of the candidate's overall performance
2. **Overall Score:** Numerical score out of 100 with a star rating
3. **Score Breakdown:** Technical, coding, communication, behavioral, resume match
4. **Candidate Strengths:** Specific things the candidate did well
5. **Areas for Improvement:** Specific areas where the candidate was weak
6. **Technical Performance:** How the candidate handled technical questions
7. **Coding Performance:** How the coding submission performed
8. **Communication Quality:** How clearly and effectively the candidate expressed themselves
9. **Behavioral Evaluation:** How the candidate responded to HR and situational questions
10. **Job Role Suitability:** How well the candidate fits the target role right now
11. **Resume to Role Match:** Percentage and details of skill alignment
12. **Identified Skill Gaps:** Specific missing or weak skills
13. **Recommended Learning Areas:** What to study next
14. **Interview Readiness:** An honest assessment of how ready the candidate is

### The Report Answers Four Key Questions

- **"What did I do well?"** - Strengths section
- **"Where am I weak?"** - Areas for improvement and skill gaps
- **"What should I learn?"** - Learning recommendations
- **"How ready am I?"** - Overall score and hiring decision indicator

---

## 15. Skill Gap Analysis

### What Is Skill Gap Analysis?

Skill Gap Analysis is the process of comparing what the candidate currently knows against what the target job actually requires, and identifying the difference.

### How It Works

```
Candidate Resume Skills
+ Interview Performance (what they demonstrated)
+ Coding Performance
        |
Compared Against
        |
Job Description Required Skills
+ Role Standard Skills
        |
Result:
  Strong Skills     --> Skills the candidate clearly has
  Partially Developed --> Skills that are present but need deepening
  Missing Skills    --> Skills entirely absent from candidate's profile
```

### Example

**Job Role:** Machine Learning Engineer

**Required Skills:**
Python, SQL, Machine Learning, Deep Learning, NLP, TensorFlow, Feature Engineering

**Candidate Skills (from resume + interview):**
Python (Strong), SQL (Strong), Basic Machine Learning (Partial)

**Skill Gap Result:**

| Skill | Status | Priority |
|---|---|---|
| Python | Strong | None |
| SQL | Strong | None |
| Machine Learning | Partial | High |
| Deep Learning | Missing | High |
| NLP | Missing | Medium |
| TensorFlow | Missing | High |
| Feature Engineering | Missing | Medium |

### Evidence-Based Gap Detection

The skill gap is not based only on what the resume says. If the candidate listed "Machine Learning" on their resume but could not answer basic ML questions during the interview, the system identifies ML as "Partially Developed" rather than a confirmed strength. This makes the gap analysis more accurate and honest.

### Skill Priority Levels

Skills are prioritized based on:
- How frequently they appear in the job description
- How critical they are for the role
- How far the candidate currently is from that skill level

---

## 16. Learning Recommendations

### How Recommendations Are Generated

After the skill gap is identified, the system maps each gap to a structured learning path.

For each missing or partial skill:
```
Skill Gap
    |
Identify Current Level (none / basic / intermediate)
    |
Define Learning Goal
    |
Recommend Topics
    |
Suggest Practice Problems
    |
Suggest Interview Questions to Practice
    |
Suggest Mini Projects
    |
Define Reassessment Point
```

### Example Recommendation - Deep Learning

- **Current Level:** None
- **Goal:** Understand neural networks, CNNs, and RNNs
- **Topics to Study:** Neural Network basics, Backpropagation, CNNs, RNNs, Transfer Learning
- **Resources:** Official TensorFlow tutorials, fast.ai course
- **Practice Problems:** Image classification with CNN, Sentiment analysis with LSTM
- **Project Suggestion:** Build an image classifier using a pre-trained model
- **Reassessment:** Take a new InterviewOS interview after completing this path

### 6-Week Learning Roadmap

| Week | Focus |
|---|---|
| Week 1 | Foundation of identified skill gaps |
| Week 2 | Core concepts and theory |
| Week 3 | Hands-on coding practice |
| Week 4 | Project building |
| Week 5 | Behavioral and communication preparation |
| Week 6 | Full mock interview on InterviewOS |

---

## 17. Interview History

### What Is Stored

Every completed interview session is saved to the database. The Interview History page shows:
- Date and time of interview
- Target job role and company
- Interview type (technical, behavioral, mixed)
- Overall score
- Technical, coding, communication, behavioral scores
- Skill match percentage
- Number of skill gaps identified
- Link to the full recruiter report

### Comparing Attempts

| Attempt | Date | Role | Overall | Technical | Coding |
|---|---|---|---|---|---|
| 1st | Aug 1 | SWE | 52 | 48 | 55 |
| 2nd | Aug 10 | SWE | 64 | 62 | 68 |
| 3rd | Aug 20 | SWE | 75 | 74 | 77 |

This comparison motivates the user and shows them that their preparation is working.

---

## 18. Progress Tracking

### What Is Tracked

InterviewOS tracks the following over time:
- Overall score trend
- Technical score improvement
- Coding performance improvement
- Communication score trend
- Number of skill gaps (decreasing over time ideally)
- Number of interviews completed
- Topics practiced
- Learning roadmap completion percentage

### Visual Dashboard Elements

- **Line chart:** Overall score over multiple attempts
- **Radar/Spider chart:** Current skill distribution across all dimensions
- **Bar chart:** Score per interview session
- **Skill gap reduction tracker:** How many gaps have been closed
- **Activity calendar:** Days when the user practiced or took interviews

These visuals allow the user to see their improvement at a glance without reading through raw numbers.

---

## 19. Settings and Profile

### Profile Information

The user can update:
- Full name and profile photo
- Target job role and target company
- Experience level (fresher, junior, mid, senior)
- University and CGPA
- LinkedIn URL and GitHub URL
- Phone number, location, and professional bio

### Resume Management

The user can upload a new resume at any time. The old resume is archived and the new one becomes active. All future interviews and analyses use the new resume.

### Interview Preferences

- Preferred interview type (technical, behavioral, or mixed)
- Preferred difficulty level
- Preferred interviewer personality
- Preferred programming languages for coding rounds

### Account Settings

- Change password
- Email verification status
- Account deactivation option
- Data export (download all your data)

---

## 20. Backend Working

### Backend Components

**Authentication Service**
Handles user registration, login, token generation, token refresh, and password hashing.

**User Management Service**
Manages user profiles, preferences, and settings.

**Resume Processing Service**
Accepts uploaded files, extracts text content, and sends it to the AI analysis service. Stores structured resume data in the database.

**AI/LLM Service**
Uses Google Gemini (or another LLM) to:
- Analyze resume content
- Generate interview questions
- Evaluate interview answers
- Generate follow-up questions
- Identify skill gaps
- Write recruiter reports
- Generate learning recommendations

**Interview Engine**
Manages the state of a live interview session - which question is current, what answers have been given, when the session starts and ends.

**Coding Execution Engine**
Accepts code submissions, executes them in a sandboxed isolated environment, runs test cases, and returns results.

**Scoring Engine**
Aggregates scores from all components (technical, coding, communication, behavioral) using defined weights and produces the overall score.

**Report Generation Service**
Combines all interview data, scores, and skill gaps to generate the recruiter-style report using the LLM.

**Database**
Stores all persistent data - users, resumes, sessions, questions, answers, scores, reports.

**API Layer**
FastAPI-based REST API that connects the frontend to all backend services. Every operation the user performs in the browser sends an HTTP request to the API.

### Communication Flow

```
User Action (Browser)
      |
React Frontend
      |
HTTP Request --> FastAPI Backend
      |
Authentication Check (JWT)
      |
Business Logic Layer
      |
AI Service (Gemini API) <-- if AI needed
      |
Database (SQLite / PostgreSQL)
      |
Response --> Frontend
      |
UI Update
```

---

## 21. Database

### Tables and Data Stored

| Table | Data Stored |
|---|---|
| users | ID, name, email, hashed password, role, created date |
| user_profiles | Target role, experience level, university, LinkedIn, GitHub, bio |
| resumes | File path, extracted text, extracted skills, ATS score, analysis summary |
| job_descriptions | JD text, company, role title, required skills, match score |
| interview_sessions | User ID, role, type, difficulty, status, start/end time |
| interview_questions | Session ID, question text, type, order |
| interview_answers | Question ID, session ID, answer text, word count, duration |
| ai_analyses | Answer ID, technical score, communication score, feedback |
| coding_submissions | Session ID, language, code, test results, scores |
| recruiter_reports | Session ID, overall score, strengths, weaknesses, recommendations |
| skill_gaps | User ID, skill name, status, priority |
| learning_roadmaps | User ID, weeks plan, focus skills, progress |
| achievements | User ID, badge type, earned date |
| notifications | User ID, message, read status |

**Security Note:** Passwords in plain text are NEVER stored. Only the Argon2 hash is stored. API keys are stored in environment variables only, never in the database.

---

## 22. AI Components

### Where AI Is Used in InterviewOS

| Feature | AI Technique Used |
|---|---|
| Resume Analysis | LLM reads resume text and extracts structured information |
| Skill Extraction | NLP/LLM identifies technical and soft skills from resume text |
| JD Analysis | LLM reads JD and extracts required skills and priorities |
| Interview Question Generation | LLM generates personalized questions from resume + JD + role |
| Dynamic Follow-up Questions | LLM generates follow-ups based on the candidate's actual answer |
| Answer Evaluation | LLM scores and provides feedback on each answer |
| Coding Evaluation | Rule-based (test cases) + LLM for code quality analysis |
| Skill Gap Detection | LLM + comparison logic identifies gaps from evidence |
| Learning Recommendations | LLM maps gaps to study plans |
| Recruiter Report | LLM writes the full narrative report from collected data |
| Mentor Chat | LLM acts as a coaching chatbot for interview tips |

---

## 23. Realistic Scoring System

### Resume Score (out of 100)
```
= (Skill Relevance x 0.25)
+ (Completeness x 0.20)
+ (Project Quality x 0.20)
+ (Experience Match x 0.15)
+ (Keyword Alignment x 0.10)
+ (Clarity x 0.10)
```

### Skill Match Score (out of 100)
```
= (Number of Matching Skills / Total Required Skills) x 100
```

### Technical Score (out of 100)
```
= Average of AI-evaluated scores for each technical question
  (Each question scored 0-100 based on accuracy, depth, clarity)
```

### Coding Score (out of 100)
```
= (Test Cases Passed x 0.50)
+ (Time Efficiency x 0.20)
+ (Space Efficiency x 0.15)
+ (Code Quality x 0.15)
```

### Communication Score (out of 100)
```
= (Answer Relevance x 0.30)
+ (Completeness x 0.25)
+ (Structure x 0.25)
+ (Example Usage x 0.20)
```

### Overall Interview Score (out of 100)
```
= (Technical x 0.35)
+ (Coding x 0.25)
+ (Communication x 0.20)
+ (Behavioral x 0.15)
+ (Resume Match x 0.05)
```

> **Important Note:** These scores are assessment indicators based on the available evidence. They reflect how a candidate performed in this particular simulated interview and should not be interpreted as a guarantee of real-world hiring outcomes.

---

## 24. Complete User Journey

**Example User: Hema, Final Year Student, Targeting Data Science Role**

**Step 1:** Hema visits InterviewOS and creates an account with her email and password.

**Step 2:** She logs in and sees a clean dashboard prompting her to upload a resume and start preparing.

**Step 3:** She uploads her resume (PDF, 2 pages). The system extracts her skills: Python, SQL, Pandas, NumPy, basic Machine Learning, a project on house price prediction.

**Step 4:** Resume is analyzed. ATS Score: 68/100. Missing sections: Certifications. Suggestion: Add measurable outcomes to project descriptions.

**Step 5:** She selects "Data Scientist" as her target role and pastes a JD from a company posting.

**Step 6:** JD Analysis: Required skills: Python, SQL, Machine Learning, Deep Learning, NLP, TensorFlow, Tableau. Skill Match: 57% (Python and SQL match; ML is partial; Deep Learning, NLP, TensorFlow, Tableau are missing).

**Step 7:** She starts a mixed interview - 30 minutes, medium difficulty, friendly interviewer.

**Step 8:** AI Interview begins. First question: "Tell me about yourself and your interest in data science." Hema answers. The AI evaluates the answer as relevant and well-structured.

**Step 9:** Technical question: "Explain the difference between overfitting and underfitting." Hema answers correctly. "How would you handle a highly imbalanced dataset?" Hema gives a partial answer. The AI generates a follow-up: "Are you familiar with SMOTE? Can you explain how it works?"

**Step 10:** Coding round begins. Problem: "Write a function that finds the top 3 most frequent words in a text string." Hema writes a Python solution using Counter. It passes 8 out of 10 test cases. The hidden test case for Unicode characters fails.

**Step 11:** Interview ends. Scoring engine calculates:
- Technical: 72/100
- Coding: 78/100
- Communication: 80/100
- Behavioral: 74/100
- Overall: 75/100

**Step 12:** Skill Gap Generated:
- Deep Learning: Missing (High Priority)
- NLP: Missing (High Priority)
- TensorFlow: Missing (High Priority)
- Machine Learning: Partial (Medium Priority)
- Tableau: Missing (Low Priority)

**Step 13:** Learning Recommendations:
- Week 1-2: Complete the fast.ai deep learning course
- Week 3: Build a sentiment analysis project using NLP
- Week 4: Practice TensorFlow tutorials
- Week 5: Behavioral interview practice
- Week 6: Full mock interview on InterviewOS

**Step 14:** Recruiter Report Generated:
- Overall Score: 75/100 - "Hire with Development Plan"
- Strengths: Strong Python, good communication, solid SQL foundation
- Weaknesses: Deep learning knowledge gap, NLP unfamiliar, coding edge cases missed
- Recommendation: "Candidate shows strong potential. Recommend focused 6-week upskilling in deep learning and NLP before reinterview."

**Step 15:** Over the next 6 weeks, Hema follows the roadmap, completes deep learning modules, builds two NLP projects.

**Step 16:** She returns for her second interview. New scores: Technical: 84, Coding: 86, Overall: 84/100. Status: "Strong Hire."

**Step 17:** Dashboard shows upward trend, reduced skill gaps, and improved readiness indicator.

---

## 25. Frontend Pages

| Page | URL | Purpose |
|---|---|---|
| Landing Page | / | Marketing page with features overview and sign up CTA |
| Login | /login | Email and password authentication |
| Sign Up | /signup | New account creation |
| Forgot Password | /forgot-password | Password reset |
| Dashboard | /dashboard | Main overview with all scores and cards |
| Resume Upload | /resume | Upload and view resume analysis |
| Job Description | /job-description | Enter JD and view skill match |
| Interview Setup | /interview-setup | Configure interview parameters |
| AI Interview Room | /interview-room | Live interview interface |
| Coding Interview | /coding-interview | Code editor and problem interface |
| Recruiter Report | /report/:sessionId | Full recruiter-style report for one session |
| Skill Gap Analysis | /skill-gap | Detailed skill gap visualization |
| Learning Roadmap | /roadmap | 6-week personalized learning plan |
| Interview History | /history | All past sessions with scores |
| Progress | /progress | Charts and trends over time |
| Profile | /profile | Edit personal and professional details |
| Settings | /settings | Account preferences |
| 404 Not Found | * | Error page for invalid routes |

---

## 26. Technologies

### Frontend Technologies

| Technology | Purpose |
|---|---|
| React.js with TypeScript | User interface with interactive components and type safety |
| Vite | Build tool and development server with fast hot-reloading |
| Tailwind CSS | Styling, dark mode, responsive layouts, and animations |
| Zustand | Global state management across all components |
| Axios | HTTP client for API requests from frontend to backend |
| Framer Motion | Smooth page transitions and micro-animations |
| React Router | Client-side routing between pages without browser reload |
| Monaco Editor | Browser-based code editor (same as VS Code) for coding round |

### Backend Technologies

| Technology | Purpose |
|---|---|
| Python with FastAPI | Modern async web framework with auto-generated API documentation |
| SQLAlchemy | ORM for database interactions using Python code instead of raw SQL |
| SQLite (Development) / PostgreSQL (Production) | Database for all application data |
| Argon2 | Password hashing - passwords never stored in plain text |
| JWT (JSON Web Tokens) | Stateless authentication between frontend and backend |
| Google Gemini API | AI engine for all AI-powered features |
| Uvicorn | ASGI server that runs the FastAPI application |

### Infrastructure

| Technology | Purpose |
|---|---|
| Git and GitHub | Version control and code repository |
| Docker (Production) | Containerizes the application for consistent deployment |

---

## 27. Security and Privacy

### Authentication Security
- Passwords hashed using Argon2 (industry-standard, memory-hard hashing)
- JWT tokens signed with a secret key using HS256 algorithm
- Access tokens expire after 60 minutes
- Refresh tokens expire after 30 days
- HTTPS enforced in production

### Authorization
- Every protected API endpoint requires a valid JWT token
- Each user can only access their own data
- Users cannot see other users' resumes, interviews, or reports
- Admin endpoints restricted to users with admin role

### Resume Privacy
- Uploaded resumes stored in a private server directory
- Resume files not publicly accessible via URL
- Only the authenticated user can access their own resume

### Safe Code Execution
- Submitted code runs in an isolated sandbox environment
- The sandbox has no access to the filesystem, network, or system resources
- Execution time is limited to prevent infinite loops
- Memory usage is capped to prevent abuse

### Input Validation
- All API inputs validated using Pydantic schemas
- File uploads restricted to PDF and DOCX only, maximum 10MB
- SQL injection prevented by using SQLAlchemy parameterized queries

### API Key Protection
- Gemini API key stored in .env file, never committed to version control
- .env file listed in .gitignore
- In production, secrets managed through environment variables

---

## 28. Existing System vs Proposed System

### What Users Use Today

- **LeetCode / HackerRank:** Coding practice only, no interview simulation, no personalization
- **Glassdoor / LinkedIn:** Interview question lists shared by others, not personalized
- **YouTube:** Passive video watching, no assessment or feedback
- **Mock interviews with friends:** Limited to friend's knowledge, no AI evaluation
- **Generic quiz websites:** Fixed questions, no resume-based personalization

### Limitations of Existing Platforms

| Limitation | Description |
|---|---|
| Not personalized | Same questions for everyone regardless of resume |
| No resume integration | Cannot analyze what you know vs what you need |
| No coding and interview together | Platforms specialize in one area only |
| No AI feedback | No evaluation of whether your answer was good |
| No skill gap identification | Cannot tell you specifically what to study |
| No recruiter-style report | No comprehensive evaluation document |
| No progress tracking | Cannot see how you have improved |

### What InterviewOS Proposes

InterviewOS integrates all capabilities into one unified platform:
1. Resume-based personalization for questions and analysis
2. Job description matching against the specific job targeted
3. AI interview simulation with dynamic adaptive questioning
4. Coding assessment with code execution and evaluation
5. Evidence-based skill gap analysis
6. Recruiter-style comprehensive written evaluation
7. Structured learning roadmap for closing skill gaps
8. Visual progress tracking across multiple interview attempts

---

## 29. Advantages of InterviewOS

**1. Fully Personalized**
Every interview, question, and recommendation is based on the candidate's actual resume and target job, not on generic templates.

**2. Role-Specific Questions**
Interview questions match the specific job role and job description the user is targeting, making practice directly relevant.

**3. Resume-Based Question Generation**
The AI reads the candidate's resume and asks about their actual projects and experience, simulating how a real interviewer would.

**4. Realistic Interview Experience**
Dynamic follow-up questions and adaptive difficulty create an interview that feels like a real conversation.

**5. Integrated Coding Practice**
Candidates can complete technical and coding rounds in the same session, just like a real interview process.

**6. Data-Based Evaluation**
Scores and feedback are generated from the candidate's actual answers, not from manual assessors or random assignment.

**7. Skill Gap Identification**
The system tells the user not just their score but exactly which skills are missing and why, based on evidence.

**8. Personalized Learning Recommendations**
Study recommendations are specific to the user's identified gaps, not generic advice.

**9. Progress Tracking**
Users can see their improvement over time across multiple interview attempts.

**10. Recruiter-Style Feedback**
The report reads like an actual hiring manager evaluation, giving the user a realistic sense of how they would be assessed in a real process.

---

## 30. Final Project Summary

InterviewOS is a complete, AI-powered interview preparation and assessment platform that takes a job seeker from their first login all the way through to a professional, data-backed recruiter report with personalized improvement recommendations.

**What InterviewOS Is:**
A web application that combines resume intelligence, AI interview simulation, coding assessment, skill gap analysis, and recruiter-style reporting into one unified platform.

**How the User Enters:**
The user signs up with email and password. The system creates a secure account, logs them in, and displays a personalized dashboard.

**What Happens in the Dashboard:**
The dashboard shows current interview readiness, resume score, skill gaps, recent performance, and recommended next actions. Every number is calculated from real assessment data.

**How the Resume Is Analyzed:**
The user uploads a PDF or DOCX resume. AI extracts skills, experience, projects, and education. The resume is scored against the target job description using defined weighted factors.

**How the AI Interview Works:**
The user configures an interview session. The AI generates personalized questions based on the resume and job description. As the user answers, the AI evaluates each response and generates follow-up questions dynamically. The session continues adaptively until all topics are covered.

**How Coding Is Evaluated:**
The user submits code to solve a programming problem. The backend runs the code against visible and hidden test cases in a sandboxed environment. The submission is scored on correctness, efficiency, and code quality.

**How Skill Gap Is Identified:**
The system compares the user's demonstrated skills from resume and interview against the job's required skills. Skills that are missing or insufficiently demonstrated are flagged as gaps with evidence.

**How the Report Is Generated:**
The AI combines all interview data, scores, and skill gaps and writes a recruiter-style report telling the user what they did well, where they are weak, what they should learn, and how ready they are for the target role.

**How Learning Recommendations Are Given:**
For each identified skill gap, the system recommends specific topics, coding problems, projects, and a structured week-by-week learning roadmap.

**How the User Improves Over Time:**
The user follows the recommendations, practices, and takes another interview. The dashboard tracks all attempts and shows whether scores are improving. Skill gaps that have been addressed are removed from the gap list. The recruiter report reflects the improved performance.

InterviewOS is designed to be a candidate's personal interview coach - always available, always personalized, always based on real evidence, and always pointing toward what matters most for the next job.

---

*Document prepared for: Final Year Project Report*
*Project Title: InterviewOS - AI-Powered Interview Preparation and Assessment Platform*
*Technology Stack: React.js + TypeScript + FastAPI + SQLAlchemy + Google Gemini AI*
