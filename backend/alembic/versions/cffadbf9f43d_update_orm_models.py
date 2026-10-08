
"""Update ORM models.

Revision ID: cffadbf9f43d
Revises: b64f53024192
"""

from alembic import op
import sqlalchemy as sa


revision = "cffadbf9f43d"
down_revision = "b64f53024192"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "surveys",
        sa.Column("created_by", sa.Integer(), nullable=True),
    )

    op.create_foreign_key(
        "fk_surveys_created_by_users",
        "surveys",
        "users",
        ["created_by"],
        ["id"],
        ondelete="SET NULL",
    )

    op.add_column(
        "users",
        sa.Column("full_name", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "notify_new_surveys",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "notify_results",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "notify_pollution",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "notify_pollution")
    op.drop_column("users", "notify_results")
    op.drop_column("users", "notify_new_surveys")
    op.drop_column("users", "created_at")
    op.drop_column("users", "full_name")

    op.drop_constraint(
        "fk_surveys_created_by_users",
        "surveys",
        type_="foreignkey",
    )
    op.drop_column("surveys", "created_by")