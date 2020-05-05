import simplejson as json
import pdb

from flask_appbuilder import Model
from typing import Any, Dict

from sqlalchemy import Column, ForeignKey, Integer, String, Table, Text, Boolean
from superset.models.helpers import AuditMixinNullable, ImportMixin

class HawkeyeReport(
    Model, AuditMixinNullable, ImportMixin
):  # pylint: disable=too-many-public-methods

    """A report"""
    __tablename__ = 'hawkeye_reports'

    id = Column(Integer, primary_key=True)  # pylint: disable=invalid-name
    is_new_report = Column(Boolean)

    report_name = Column(String(250))
    report_description = Column(String(250))
    report_summary = Column(Text)
    report_type = Column(String(250))
    report_frequency = Column(String(250))
    report_status = Column(String(100))
    published_report_id = Column(String(250))
    published_report_status = Column(String(250))
    # report_granularity = Column(String(250))

    @property
    def data(self) -> Dict[str, Any]:
        return {
            'reportId': self.id,
            'reportName': self.report_name,
            'reportDescription': self.report_description,
            'reportSummary': self.report_summary,
            'reportType': self.report_type,
            'reportFrequency': self.report_frequency,
            'charts': [item.data for item in self.charts]
        }