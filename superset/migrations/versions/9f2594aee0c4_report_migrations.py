# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
"""report migrations

Revision ID: 9f2594aee0c4
Revises: f9a30386bd74
Create Date: 2020-04-01 00:28:20.122372

"""

# revision identifiers, used by Alembic.
revision = '9f2594aee0c4'
down_revision = 'f9a30386bd74'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.create_table(
        "hawkeye_reports",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("created_on", sa.DateTime(), nullable=False),
        sa.Column("changed_on", sa.DateTime(), nullable=False),
        sa.Column("report_name", sa.String(length=250), nullable=False),
        sa.Column("report_description", sa.String(length=250), nullable=False),
        sa.Column("report_summary", sa.Text(), nullable=True),
        sa.Column("report_type", sa.String(length=250), nullable=False),
        sa.Column("report_frequency", sa.String(length=250), nullable=True),
        sa.Column("report_status", sa.String(length=250), nullable=True),
        sa.Column("published_report_id", sa.String(length=250), nullable=True),
        sa.Column("published_report_status", sa.String(length=100), nullable=True),

        sa.Column(
            "created_by_fk", sa.Integer(), sa.ForeignKey("ab_user.id"), nullable=True
        ),
        sa.Column(
            "changed_by_fk", sa.Integer(), sa.ForeignKey("ab_user.id"), nullable=True
        ),
        
        sa.PrimaryKeyConstraint("id")
    )

    op.create_table(
        "hawkeye_charts",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("created_on", sa.DateTime(), nullable=False),
        sa.Column("changed_on", sa.DateTime(), nullable=False),
        sa.Column("reviewed_on", sa.DateTime(), nullable=True),
        sa.Column("published_on", sa.DateTime(), nullable=True),
        sa.Column("is_new_report", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_new_chart", sa.Boolean(), nullable=False, default=True),
        sa.Column("chart_id", sa.String(length=250), nullable=False),
        sa.Column("chart_name", sa.String(length=250), nullable=False),
        sa.Column("chart_description", sa.String(length=250), nullable=True),
        sa.Column("chart_summary", sa.Text(), nullable=True),
        sa.Column("chart_granularity", sa.String(length=250), nullable=True),
        sa.Column("rolling_window", sa.String(length=250), nullable=True),
        sa.Column("chart_type", sa.String(length=250), nullable=False),
        sa.Column("chart_mode", sa.String(length=250), nullable=False),
        sa.Column("x_axis_label", sa.String(length=250), nullable=False),
        sa.Column("y_axis_label", sa.String(length=250), nullable=False),
        sa.Column("label_mapping", sa.JSON(), nullable=False),
        sa.Column("dimensions", sa.JSON(), nullable=True),
        sa.Column("druid_query", sa.JSON(), nullable=True),
        sa.Column("submitted_as_job", sa.Boolean(), nullable=True),
        sa.Column("chart_status", sa.String(length=100), nullable=False),
        sa.Column("created_by", sa.String(length=100), nullable=True),
        sa.Column("reviewed_by", sa.String(length=100), nullable=True),
        sa.Column(
            "hawkeye_report_id", sa.Integer(), sa.ForeignKey("hawkeye_reports.id"), nullable=True
        ),
        sa.Column(
            "slice_id", sa.Integer(), sa.ForeignKey("slices.id"), nullable=True
        ),
        sa.Column(
            "created_by_fk", sa.Integer(), sa.ForeignKey("ab_user.id"), nullable=True
        ),
        sa.Column(
            "changed_by_fk", sa.Integer(), sa.ForeignKey("ab_user.id"), nullable=True
        ),
        sa.Column(
            "reviewed_by_fk", sa.Integer(), sa.ForeignKey("ab_user.id"), nullable=True
        ),
        sa.PrimaryKeyConstraint("id")
    )


def downgrade():
    op.drop_table("hawkeye_charts")
    op.drop_table("hawkeye_reports")
