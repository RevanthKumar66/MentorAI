"""sprint5_workspace_collections

Revision ID: 8fe160e92d03
Revises: c1c0a45d28bb
Create Date: 2026-06-08 16:22:38.999449

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '8fe160e92d03'
down_revision: Union[str, None] = 'c1c0a45d28bb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add color and icon to collections
    op.add_column('collections', sa.Column('color', sa.String(length=20), nullable=True))
    op.add_column('collections', sa.Column('icon', sa.String(length=50), nullable=True))

    # 2. Create collection_chats junction table
    op.create_table(
        'collection_chats',
        sa.Column('collection_id', sa.Uuid(), nullable=False),
        sa.Column('chat_session_id', sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(['collection_id'], ['collections.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['chat_session_id'], ['chat_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('collection_id', 'chat_session_id')
    )

    # 3. Create notes table
    op.create_table(
        'notes',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('collection_id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(length=255), server_default='Untitled Note', nullable=False),
        sa.Column('content', sa.Text(), server_default='', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['collection_id'], ['collections.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notes_id'), 'notes', ['id'], unique=False)
    op.create_index(op.f('ix_notes_collection_id'), 'notes', ['collection_id'], unique=False)
    op.create_index(op.f('ix_notes_user_id'), 'notes', ['user_id'], unique=False)

    # 4. Create workspace_settings table
    op.create_table(
        'workspace_settings',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('default_collection', sa.Uuid(), nullable=True),
        sa.Column('auto_rag_enabled', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('citation_enabled', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('workspace_memory_enabled', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['default_collection'], ['collections.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_workspace_settings_id'), 'workspace_settings', ['id'], unique=False)
    op.create_index(op.f('ix_workspace_settings_user_id'), 'workspace_settings', ['user_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_workspace_settings_user_id'), table_name='workspace_settings')
    op.drop_index(op.f('ix_workspace_settings_id'), table_name='workspace_settings')
    op.drop_table('workspace_settings')
    
    op.drop_index(op.f('ix_notes_user_id'), table_name='notes')
    op.drop_index(op.f('ix_notes_collection_id'), table_name='notes')
    op.drop_index(op.f('ix_notes_id'), table_name='notes')
    op.drop_table('notes')
    
    op.drop_table('collection_chats')
    
    op.drop_column('collections', 'icon')
    op.drop_column('collections', 'color')
