from datetime import datetime
from typing import Any
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, EmailStr

from app.models import ApplicationStatus, EmploymentType, JobStatus, UserRole


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    role: UserRole

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    accessToken: str
    user: UserResponse


class JobBase(BaseModel):
    title: str
    company: str
    location: str
    description: str
    employmentType: EmploymentType = Field(alias='employmentType')
    remote: bool
    status: JobStatus


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    title: str | None = None
    company: str | None = None
    location: str | None = None
    description: str | None = None
    employmentType: EmploymentType | None = Field(default=None, alias='employmentType')
    remote: bool | None = None
    status: JobStatus | None = None


class JobResponse(BaseModel):
    id: UUID
    title: str
    company: str
    location: str
    description: str
    employmentType: EmploymentType = Field(alias='employmentType')
    remote: bool
    status: JobStatus
    created_at: datetime = Field(alias='createdAt')

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class PaginatedResponse(BaseModel):
    items: list[Any]
    page: int
    pageSize: int
    total: int


class ApplicationCreate(BaseModel):
    jobId: UUID
    resumeText: str
    coverLetter: str | None = None


class ApplicationResponse(BaseModel):
    id: UUID
    jobId: UUID
    applicantId: UUID
    status: ApplicationStatus
    createdAt: datetime
    resumeText: str | None = None
    coverLetter: str | None = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ApplicationDetails(BaseModel):
    application: ApplicationResponse
    job: dict[str, Any]
    statusHistory: list[dict[str, Any]]


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class AuditLogResponse(BaseModel):
    id: UUID
    actorId: UUID | None = Field(alias='actor_id')
    action: str
    entityType: str = Field(alias='entity_type')
    entityId: UUID | None = Field(alias='entity_id')
    createdAt: datetime = Field(alias='created_at')
    metadata: dict = Field(alias='metadata_')

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class HealthComponent(BaseModel):
    name: str
    status: str
    message: str | None = None


class HealthResponse(BaseModel):
    status: str
    components: list[HealthComponent]
