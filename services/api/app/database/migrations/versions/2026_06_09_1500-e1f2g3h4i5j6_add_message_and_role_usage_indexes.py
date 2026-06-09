"""add message and role usage indexes

Revision ID: e1f2g3h4i5j6
Revises: d7e8f9a1b2c3
Create Date: 2026-06-09 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e1f2g3h4i5j6'
down_revision: Union[str, None] = 'd7e8f9a1b2c3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add index on created_at for chat_messages
    op.create_index(
        op.f('ix_chat_messages_created_at'),
        'chat_messages',
        ['created_at'],
        unique=False
    )
    # Add index on last_used_at for role_usage
    op.create_index(
        op.f('ix_role_usage_last_used_at'),
        'role_usage',
        ['last_used_at'],
        unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_role_usage_last_used_at'), table_name='role_usage')
    op.drop_index(op.f('ix_chat_messages_created_at'), table_name='chat_messages')
