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
"""adding_percentage_topn_config_hawkeye

Revision ID: 01defaf2ad37
Revises: bf1ec80c8c9a
Create Date: 2020-05-28 15:02:57.748489

"""

# revision identifiers, used by Alembic.
revision = '01defaf2ad37'
down_revision = 'bf1ec80c8c9a'

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    op.add_column('hawkeye_charts', sa.Column('show_percentage', sa.Boolean(), default=False))
    op.add_column('hawkeye_charts', sa.Column('show_top_records', sa.Boolean(), default=False))
    op.add_column('hawkeye_charts', sa.Column('top_n_records', sa.Integer(), nullable=True))


def downgrade():
    op.drop_column('hawkeye_charts', 'show_percentage')
    op.drop_column('hawkeye_charts', 'show_top_records')
    op.drop_column('hawkeye_charts', 'top_n_records')
