from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    badge_type = Column(String(100), nullable=False)
    badge_label = Column(String(255), nullable=False)
    badge_desc = Column(Text, nullable=True)
    badge_color = Column(String(100), default="from-blue-500 to-cyan-500")
    earned_at = Column(DateTime(timezone=True), server_default=func.now())
    meta_json = Column(Text, default="{}")

    user = relationship("User", back_populates="achievements")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(50), default="info")  # info | success | warning | achievement
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    action_url = Column(String(500), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications")
