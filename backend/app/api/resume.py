import io
import json
import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.core.config import settings
from app.services.resume_analyzer import analyze_resume

router = APIRouter(prefix="/resume", tags=["Resume"])


def _extract_text(content: bytes, ext: str, filepath: str) -> str:
    """Extract plain text from PDF, DOCX, or TXT files."""
    try:
        if ext == ".txt":
            return content.decode("utf-8", errors="ignore")

        if ext == ".pdf":
            try:
                from pypdf import PdfReader
                reader = PdfReader(io.BytesIO(content))
                pages = []
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        pages.append(text)
                extracted = "\n".join(pages).strip()
                if extracted:
                    return extracted
            except Exception as e:
                print(f"[PDF] pypdf failed: {e}")
            return ""

        if ext == ".docx":
            try:
                import docx
                doc = docx.Document(io.BytesIO(content))
                return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
            except Exception as e:
                print(f"[DOCX] python-docx failed: {e}")
            return ""

    except Exception as e:
        print(f"[TextExtract] Error: {e}")
    return ""


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload, extract text, AI-analyze, save, and return full resume analysis."""
    allowed = [".pdf", ".docx", ".txt"]
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"File type '{ext}' not supported. Use PDF, DOCX, or TXT.")

    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large. Max size is {settings.MAX_FILE_SIZE_MB} MB.")

    # Save file to disk
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    safe_name = f"resume_{current_user.id}_{file.filename}"
    filepath = os.path.join(settings.UPLOAD_DIR, safe_name)
    with open(filepath, "wb") as f:
        f.write(content)

    # Extract text from PDF/DOCX/TXT
    text_content = _extract_text(content, ext, filepath)
    print(f"[Resume] Extracted {len(text_content)} chars from '{file.filename}' for user {current_user.id}")

    if not text_content.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not extract text from this file. Please upload a text-readable PDF or DOCX (not a scanned image)."
        )

    # Deactivate previous resumes for this user
    db.query(Resume).filter(
        Resume.user_id == current_user.id,
        Resume.is_active == 1
    ).update({"is_active": 0})

    # Create resume DB record
    resume = Resume(
        user_id=current_user.id,
        filename=file.filename,
        file_path=filepath,
        content_text=text_content,
    )
    db.add(resume)
    db.flush()  # get resume.id without full commit

    # Run AI analysis
    analysis = await analyze_resume(text_content, resume.id, current_user.id)

    # Persist all analysis fields
    resume.extracted_skills      = json.dumps(analysis.get("skills", []))
    resume.missing_skills        = json.dumps(analysis.get("missing_skills", []))
    resume.experience_json       = json.dumps(analysis.get("experience", []))
    resume.education_json        = json.dumps(analysis.get("education", []))
    resume.projects_json         = json.dumps(analysis.get("projects", []))
    resume.certifications_json   = json.dumps(analysis.get("certifications", []))
    resume.ats_score             = analysis.get("resume_score") or analysis.get("ats_score") or 0.0
    resume.analysis_summary      = json.dumps({
        "candidate_name":        analysis.get("candidate_name", ""),
        "resume_score":          resume.ats_score,
        "summary":               analysis.get("summary", ""),
        "strengths":             analysis.get("strengths", []),
        "areas_for_improvement": analysis.get("areas_for_improvement", []),
        "achievements":          analysis.get("achievements", []),
    })
    resume.is_active = 1

    db.commit()
    db.refresh(resume)

    return _build_response(resume, analysis)



def _build_response(resume, analysis: dict = None) -> dict:
    """Build the full API response from a resume DB object + optional fresh analysis dict."""
    # Parse the analysis_summary JSON blob
    summary_blob = {}
    raw = resume.analysis_summary or ""
    try:
        summary_blob = json.loads(raw) if raw.startswith("{") else {}
    except Exception:
        summary_blob = {}

    skills        = json.loads(resume.extracted_skills      or "[]")
    missing       = json.loads(resume.missing_skills        or "[]")
    experience    = json.loads(resume.experience_json       or "[]")
    education     = json.loads(resume.education_json        or "[]")
    projects      = json.loads(resume.projects_json         or "[]")
    certifications = json.loads(resume.certifications_json  or "[]")

    # Prefer fresh analysis values when available (right after upload)
    if analysis:
        skills         = analysis.get("skills", skills)
        missing        = analysis.get("missing_skills", missing)
        experience     = analysis.get("experience", experience)
        education      = analysis.get("education", education)
        projects       = analysis.get("projects", projects)
        certifications = analysis.get("certifications", certifications)

    return {
        "id":                   resume.id,
        "filename":             resume.filename,
        "resume_score":         resume.ats_score,
        "ats_score":            resume.ats_score,
        "candidate_name":       summary_blob.get("candidate_name", ""),
        "skills":               skills,
        "missing_skills":       missing,
        "experience":           experience,
        "education":            education,
        "projects":             projects,
        "certifications":       certifications,
        "strengths":            summary_blob.get("strengths", []),
        "areas_for_improvement": summary_blob.get("areas_for_improvement", []),
        "achievements":         summary_blob.get("achievements", []),
        "summary":              summary_blob.get("summary", raw if not raw.startswith("{") else ""),
        "uploaded_at":          resume.created_at,
    }


@router.get("/latest")
def get_latest_resume(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get the user's most recent active resume with full analysis."""
    resume = db.query(Resume).filter(
        Resume.user_id == current_user.id,
        Resume.is_active == 1
    ).order_by(Resume.created_at.desc()).first()

    if not resume:
        return None

    return _build_response(resume)


@router.get("/{resume_id}")
def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific resume by ID."""
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    return _build_response(resume)
