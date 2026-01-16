"""initial

Revision ID: 0001_initial
Revises: 
Create Date: 2025-01-01 00:00:00
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    user_role = sa.Enum('applicant', 'employer', 'admin', name='user_role')
    employment_type = sa.Enum('full_time', 'part_time', 'contract', name='employment_type')
    job_status = sa.Enum('active', 'archived', name='job_status')
    application_status = sa.Enum('applied', 'reviewed', 'interview', 'rejected', 'accepted', name='application_status')
    status_history_status = sa.Enum('applied', 'reviewed', 'interview', 'rejected', 'accepted', name='status_history_status')

    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', user_role, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    op.create_table(
        'jobs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('employer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('company', sa.Text(), nullable=False),
        sa.Column('location', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('employment_type', employment_type, nullable=False),
        sa.Column('remote', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('status', job_status, server_default=sa.text("'active'"), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_jobs_employer_id', 'jobs', ['employer_id'])

    op.create_table(
        'applications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('job_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('jobs.id'), nullable=False),
        sa.Column('applicant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('resume_text', sa.Text(), nullable=False),
        sa.Column('cover_letter', sa.Text(), nullable=True),
        sa.Column('status', application_status, server_default=sa.text("'applied'"), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('job_id', 'applicant_id', name='uq_applications_job_applicant'),
    )
    op.create_index('ix_applications_job_id', 'applications', ['job_id'])
    op.create_index('ix_applications_applicant_id', 'applications', ['applicant_id'])

    op.create_table(
        'status_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('application_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('applications.id'), nullable=False),
        sa.Column('status', status_history_status, nullable=False),
        sa.Column('changed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('changed_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
    )
    op.create_index('ix_status_history_application_id', 'status_history', ['application_id'])

    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('actor_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('action', sa.Text(), nullable=False),
        sa.Column('entity_type', sa.Text(), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('metadata', postgresql.JSONB(), server_default=sa.text("'{}'::jsonb"), nullable=False),
    )
    op.create_index('ix_audit_logs_actor_id', 'audit_logs', ['actor_id'])
    op.create_index('ix_audit_logs_action', 'audit_logs', ['action'])
    op.create_index('ix_audit_logs_entity_type', 'audit_logs', ['entity_type'])


def downgrade() -> None:
    op.drop_index('ix_audit_logs_entity_type', table_name='audit_logs')
    op.drop_index('ix_audit_logs_action', table_name='audit_logs')
    op.drop_index('ix_audit_logs_actor_id', table_name='audit_logs')
    op.drop_table('audit_logs')

    op.drop_index('ix_status_history_application_id', table_name='status_history')
    op.drop_table('status_history')

    op.drop_index('ix_applications_applicant_id', table_name='applications')
    op.drop_index('ix_applications_job_id', table_name='applications')
    op.drop_table('applications')

    op.drop_index('ix_jobs_employer_id', table_name='jobs')
    op.drop_table('jobs')

    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')

    op.execute('DROP TYPE IF EXISTS status_history_status')
    op.execute('DROP TYPE IF EXISTS application_status')
    op.execute('DROP TYPE IF EXISTS job_status')
    op.execute('DROP TYPE IF EXISTS employment_type')
    op.execute('DROP TYPE IF EXISTS user_role')
