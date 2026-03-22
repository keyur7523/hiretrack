"""add ai_screenings table

Revision ID: 0002_ai_screenings
Revises: 0001_initial
Create Date: 2026-03-21 00:00:00
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0002_ai_screenings'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum types via raw SQL (IF NOT EXISTS handles re-runs)
    op.execute("DO $$ BEGIN CREATE TYPE screening_status AS ENUM ('pending', 'processing', 'completed', 'failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE screening_recommendation AS ENUM ('strong_match', 'good_match', 'partial_match', 'weak_match'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;")

    # Use postgresql.ENUM with create_type=False to reference existing enums
    screening_status = postgresql.ENUM('pending', 'processing', 'completed', 'failed', name='screening_status', create_type=False)
    screening_recommendation = postgresql.ENUM('strong_match', 'good_match', 'partial_match', 'weak_match', name='screening_recommendation', create_type=False)

    op.create_table(
        'ai_screenings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('application_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('applications.id'), unique=True, nullable=False),
        sa.Column('status', screening_status, nullable=False, server_default='pending'),
        sa.Column('score', sa.Integer(), nullable=True),
        sa.Column('recommendation', screening_recommendation, nullable=True),
        sa.Column('result', postgresql.JSONB(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_ai_screenings_application_id', 'ai_screenings', ['application_id'], unique=True)
    op.create_index('ix_ai_screenings_score', 'ai_screenings', ['score'])


def downgrade() -> None:
    op.drop_index('ix_ai_screenings_score')
    op.drop_index('ix_ai_screenings_application_id')
    op.drop_table('ai_screenings')
    op.execute('DROP TYPE IF EXISTS screening_recommendation')
    op.execute('DROP TYPE IF EXISTS screening_status')
