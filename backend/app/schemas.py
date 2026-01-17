from datetime import datetime
from typing import Any
from uuid import UUID
from pydantic import AliasChoices, BaseModel, ConfigDict, Field, EmailStr

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
    employmentType: EmploymentType = Field(
        validation_alias=AliasChoices('employment_type', 'employmentType'),
        serialization_alias='employmentType',
    )
    remote: bool
    status: JobStatus
    createdAt: datetime = Field(
        validation_alias=AliasChoices('created_at', 'createdAt'),
        serialization_alias='createdAt',
    )

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
    jobId: UUID = Field(validation_alias='job_id', serialization_alias='jobId')
    applicantId: UUID = Field(validation_alias='applicant_id', serialization_alias='applicantId')
    status: ApplicationStatus
    createdAt: datetime = Field(validation_alias='created_at', serialization_alias='createdAt')
    resumeText: str | None = Field(default=None, validation_alias='resume_text', serialization_alias='resumeText')
    coverLetter: str | None = Field(default=None, validation_alias='cover_letter', serialization_alias='coverLetter')

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ApplicationDetails(BaseModel):
    application: ApplicationResponse
    job: dict[str, Any]
    statusHistory: list[dict[str, Any]]


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class AuditLogResponse(BaseModel):
    id: UUID
    actorId: UUID | None = Field(validation_alias='actor_id', serialization_alias='actorId')
    action: str
    entityType: str = Field(validation_alias='entity_type', serialization_alias='entityType')
    entityId: UUID | None = Field(validation_alias='entity_id', serialization_alias='entityId')
    createdAt: datetime = Field(validation_alias='created_at', serialization_alias='createdAt')
    metadata: dict = Field(validation_alias='metadata_', serialization_alias='metadata')

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class HealthComponent(BaseModel):
    name: str
    status: str
    message: str | None = None


class HealthResponse(BaseModel):
    status: str
    components: list[HealthComponent]
