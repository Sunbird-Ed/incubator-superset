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
"""add_interval_slider_hawkeye_report.py

Revision ID: 11954187b979
Revises: c5ecb4ef2220
Create Date: 2020-07-01 03:21:51.424372

"""

# revision identifiers, used by Alembic.
revision = '11954187b979'
down_revision = 'c5ecb4ef2220'

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    op.add_column('hawkeye_reports', sa.Column('is_interval_slider', sa.Boolean(), default=False))
    op.add_column('hawkeye_reports', sa.Column('interval_slider', sa.Integer(), nullable=True))


def downgrade():
    op.drop_column('hawkeye_reports', 'is_interval_slider')
    op.drop_column('hawkeye_reports', 'interval_slider')
