"""Kiểu dữ liệu dùng chung giữa API và frontend."""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field, field_validator


def _now() -> datetime:
    return datetime.now(timezone.utc)


# --------------------------------------------------------------------------
# Khóa học
# --------------------------------------------------------------------------


class SoftwareModule(BaseModel):
    no: int
    name: str
    description: str


class CourseDay(BaseModel):
    no: int
    title: str
    subtitle: str = ""
    topics: list[str] = Field(default_factory=list)
    output: str = ""


class AudienceRow(BaseModel):
    role: str
    duty: str


class Course(BaseModel):
    code: str
    legacyNumber: int
    slug: str
    group: str
    order: int = 0
    featured: bool = False
    title: str
    shortTitle: str
    tagline: str = ""
    duration: str
    durationDays: int
    method: str = ""
    outputSummary: str = ""
    aliases: list[str] = Field(default_factory=list)
    recipients: str = ""
    intro: list[str] = Field(default_factory=list)
    coreGoal: str = ""
    highlight: dict[str, str] = Field(default_factory=dict)
    objectives: list[str] = Field(default_factory=list)
    values: list[dict[str, str]] = Field(default_factory=list)
    audience: dict[str, Any] = Field(default_factory=dict)
    days: list[CourseDay] = Field(default_factory=list)
    deliverables: list[str] = Field(default_factory=list)
    software: dict[str, Any] = Field(default_factory=dict)
    kpis: dict[str, Any] = Field(default_factory=dict)
    dataToBring: list[str] = Field(default_factory=list)
    roadmap: list[str] = Field(default_factory=list)
    longTermGoal: str = ""
    motto: str = ""
    responsibleAi: list[str] = Field(default_factory=list)
    relatedCourses: list[dict[str, str]] = Field(default_factory=list)
    published: bool = True

    @property
    def display_name(self) -> str:
        return f"Khóa {self.code[1:]}"


class CourseSummary(BaseModel):
    """Bản rút gọn dùng cho lưới thẻ và bảng so sánh."""

    code: str
    legacyNumber: int
    slug: str
    group: str
    order: int
    featured: bool
    title: str
    shortTitle: str
    tagline: str
    duration: str
    durationDays: int
    outputSummary: str
    headcount: str = ""
    softwareName: str = ""
    moduleCount: int = 0
    recipients: str = ""


class CourseGroup(BaseModel):
    id: str
    name: str
    shortName: str
    description: str
    targetUnits: str
    accent: str
    order: int


class Faq(BaseModel):
    id: str
    question: str
    answer: str
    category: str = ""
    courseCodes: list[str] = Field(default_factory=list)
    priority: int = 50
    published: bool = True
    order: int = 0


# --------------------------------------------------------------------------
# Chat
# --------------------------------------------------------------------------


class Intent(str, Enum):
    LOOKUP = "lookup"
    COMPARE = "compare"
    ROUTING = "routing"
    REGISTER = "register"
    OUT_OF_SCOPE = "out_of_scope"


class Citation(BaseModel):
    chunkId: str
    courseCode: str | None = None
    section: str = ""
    title: str = ""
    score: float = 0.0


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    sessionId: str = ""
    history: list[ChatMessage] = Field(default_factory=list)
    courseContext: str | None = None
    locale: Literal["vi", "en"] = "vi"

    @field_validator("message")
    @classmethod
    def _not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Câu hỏi không được để trống.")
        return v


class ChatFeedback(BaseModel):
    sessionId: str
    messageId: str
    value: Literal["up", "down"]
    note: str = ""


# --------------------------------------------------------------------------
# Gợi ý khóa học
# --------------------------------------------------------------------------


class RecommendRequest(BaseModel):
    unitType: str = ""
    """Loại đơn vị: dao-tao | dam-bao-chat-luong | khoa-hoc | tap-chi | nhan-su | khoa-bo-mon-kinh-doanh | khoa-bo-mon-ngoai-ngu | cntt | khac"""
    priority: str = ""
    """Ưu tiên: tra-cuu | tu-dong-hoa | phan-tich-du-lieu | day-hoc | nen-tang-chung"""
    headcount: str = ""
    """Số người có thể cử: 1-2 | 3-5 | 6-10 | tren-10"""
    note: str = ""


class RecommendItem(BaseModel):
    code: str
    slug: str
    shortTitle: str
    duration: str
    score: int
    reasons: list[str]
    headcount: str = ""


class RecommendResponse(BaseModel):
    primary: list[RecommendItem]
    alternatives: list[RecommendItem] = Field(default_factory=list)
    note: str = ""


# --------------------------------------------------------------------------
# Lead / đăng ký
# --------------------------------------------------------------------------


class LeadCourseInterest(BaseModel):
    code: str
    attendees: int = Field(default=1, ge=1, le=100)


class LeadCreate(BaseModel):
    fullName: str = Field(min_length=2, max_length=120)
    organization: str = Field(min_length=2, max_length=200)
    position: str = Field(default="", max_length=120)
    email: EmailStr
    phone: str = Field(default="", max_length=40)
    courses: list[LeadCourseInterest] = Field(default_factory=list)
    message: str = Field(default="", max_length=2000)
    source: Literal["form", "chat", "wizard"] = "form"
    sessionId: str = ""


class Lead(LeadCreate):
    id: str
    status: Literal["new", "contacted", "confirmed", "cancelled"] = "new"
    assignedTo: str = ""
    notes: list[dict[str, Any]] = Field(default_factory=list)
    createdAt: datetime = Field(default_factory=_now)


# --------------------------------------------------------------------------
# Quản trị
# --------------------------------------------------------------------------


class AdminUser(BaseModel):
    uid: str
    email: str
    displayName: str = ""
    role: Literal["super_admin", "editor", "viewer"] = "viewer"
    active: bool = True


class AuditLogEntry(BaseModel):
    id: str = ""
    actor: str
    action: str
    target: str
    before: dict[str, Any] | None = None
    after: dict[str, Any] | None = None
    at: datetime = Field(default_factory=_now)


class KbChunk(BaseModel):
    id: str
    courseCode: str | None = None
    courseGroup: str | None = None
    sourceDoc: str
    section: str
    title: str
    content: str
    tokens: int = 0
    active: bool = True


class RetrievalHit(BaseModel):
    chunk: KbChunk
    score: float
