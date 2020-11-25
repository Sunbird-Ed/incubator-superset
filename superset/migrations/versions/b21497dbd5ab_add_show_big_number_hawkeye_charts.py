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
"""add_show_big_number_hawkeye_charts

Revision ID: b21497dbd5ab
Revises: 28b9fbb2e723
Create Date: 2020-11-25 12:51:49.706188

"""

# revision identifiers, used by Alembic.
revision = 'b21497dbd5ab'
down_revision = '28b9fbb2e723'

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    op.add_column('hawkeye_charts', sa.Column('show_bignumber', sa.Boolean(), default=True, nullable=True))
    op.add_column('hawkeye_charts', sa.Column('bignumber_type', sa.String(length=250), default='chart', nullable=True))


def downgrade():
    op.drop_column('hawkeye_charts', 'show_bignumber')
    op.drop_column('hawkeye_charts', 'bignumber_type')
