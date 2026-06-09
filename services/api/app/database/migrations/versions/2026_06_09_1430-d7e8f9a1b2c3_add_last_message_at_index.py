"""add_last_message_at_index

Revision ID: d7e8f9a1b2c3
Revises: caa3239d6169
Create Date: 2026-06-09 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd7e8f9a1b2c3'
down_revision: Union[str, None] = 'caa3239d6169'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add index on last_message_at for efficient ORDER BY queries on chat_sessions
    op.create_index(
        op.f('ix_chat_sessions_last_message_at'),
        'chat_sessions',
        ['last_message_at'],
        unique=False
    )
    # Add index on created_at for time-range filtering on chat_sessions
    op.create_index(
        op.f('ix_chat_sessions_created_at'),
        'chat_sessions',
        ['created_at'],
        unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_chat_sessions_created_at'), table_name='chat_sessions')
    op.drop_index(op.f('ix_chat_sessions_last_message_at'), table_name='chat_sessions')
