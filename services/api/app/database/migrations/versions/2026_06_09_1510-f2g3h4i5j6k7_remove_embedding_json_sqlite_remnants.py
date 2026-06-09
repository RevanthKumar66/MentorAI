"""remove embedding_json sqlite remnants

Revision ID: f2g3h4i5j6k7
Revises: e1f2g3h4i5j6
Create Date: 2026-06-09 15:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f2g3h4i5j6k7'
down_revision: Union[str, None] = 'e1f2g3h4i5j6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop embedding_json column from document_chunks table
    op.drop_column('document_chunks', 'embedding_json')


def downgrade() -> None:
    op.add_column('document_chunks', sa.Column('embedding_json', sa.Text(), nullable=True))
