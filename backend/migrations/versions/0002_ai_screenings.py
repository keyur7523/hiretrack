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
    screening_status = sa.Enum('pending', 'processing', 'completed', 'failed', name='screening_status')
    screening_recommendation = sa.Enum('strong_match', 'good_match', 'partial_match', 'weak_match', name='screening_recommendation')

    screening_status.create(op.get_bind(), checkfirst=True)
    screening_recommendation.create(op.get_bind(), checkfirst=True)

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
    sa.Enum(name='screening_recommendation').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='screening_status').drop(op.get_bind(), checkfirst=True)
