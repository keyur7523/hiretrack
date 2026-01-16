import enum
import uuid
from datetime import datetime
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class UserRole(str, enum.Enum):
    applicant = 'applicant'
    employer = 'employer'
    admin = 'admin'


class EmploymentType(str, enum.Enum):
    full_time = 'full_time'
    part_time = 'part_time'
    contract = 'contract'


class JobStatus(str, enum.Enum):
    active = 'active'
    archived = 'archived'


class ApplicationStatus(str, enum.Enum):
    applied = 'applied'
    reviewed = 'reviewed'
    interview = 'interview'
    rejected = 'rejected'
    accepted = 'accepted'


class User(Base):
    __tablename__ = 'users'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name='user_role'), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    jobs = relationship('Job', back_populates='employer', cascade='all, delete-orphan')


class Job(Base):
    __tablename__ = 'jobs'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('users.id'), index=True, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    company: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    employment_type: Mapped[EmploymentType] = mapped_column(Enum(EmploymentType, name='employment_type'), nullable=False)
    remote: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[JobStatus] = mapped_column(Enum(JobStatus, name='job_status'), default=JobStatus.active, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    employer = relationship('User', back_populates='jobs')
    applications = relationship('Application', back_populates='job', cascade='all, delete-orphan')


class Application(Base):
    __tablename__ = 'applications'
    __table_args__ = (
        UniqueConstraint('job_id', 'applicant_id', name='uq_applications_job_applicant'),
        Index('ix_applications_job_id', 'job_id'),
        Index('ix_applications_applicant_id', 'applicant_id'),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('jobs.id'), nullable=False)
    applicant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    resume_text: Mapped[str] = mapped_column(Text, nullable=False)
    cover_letter: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ApplicationStatus] = mapped_column(Enum(ApplicationStatus, name='application_status'), default=ApplicationStatus.applied, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    job = relationship('Job', back_populates='applications')


class StatusHistory(Base):
    __tablename__ = 'status_history'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('applications.id'), index=True, nullable=False)
    status: Mapped[ApplicationStatus] = mapped_column(Enum(ApplicationStatus, name='status_history_status'), nullable=False)
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    changed_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)


class AuditLog(Base):
    __tablename__ = 'audit_logs'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey('users.id'), index=True, nullable=True)
    action: Mapped[str] = mapped_column(Text, index=True, nullable=False)
    entity_type: Mapped[str] = mapped_column(Text, index=True, nullable=False)
    entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    metadata_: Mapped[dict] = mapped_column('metadata', JSONB, default=dict, nullable=False)
