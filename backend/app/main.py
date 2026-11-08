"""
InterviewOS Backend — FastAPI Application Entry Point
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.database import create_tables
from app.api import auth, users, resume, interviews, reports, dashboard, ai, admin, coding, aptitude


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Create database tables on startup
    create_tables()
    # Ensure uploads directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    print(f"[OK] InterviewOS backend started - DB: {settings.DATABASE_URL}")
    print(f"[OK] AI Available: {'Yes (Gemini)' if settings.GOOGLE_API_KEY else 'No (set GOOGLE_API_KEY in .env)'}")
    yield
    print("[STOP] InterviewOS backend shutting down")


app = FastAPI(
    title="InterviewOS API",
    description="AI-powered Interview Preparation Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS — allow frontend on any common dev port
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Mount uploads as static files
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Register all routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(resume.router, prefix="/api")
app.include_router(interviews.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(coding.router, prefix="/api")
app.include_router(aptitude.router, prefix="/api")


@app.get("/")
def root():
    return {
        "app": "InterviewOS API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "healthy", "ai_enabled": bool(settings.GOOGLE_API_KEY)}
