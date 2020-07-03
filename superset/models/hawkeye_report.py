import simplejson as json
import pdb
import itertools 

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

    report_name = Column(String(250))
    report_description = Column(String(250))
    report_summary = Column(Text)
    report_type = Column(String(250))
    report_frequency = Column(String(250))
    report_status = Column(String(100))
    published_report_id = Column(String(250))
    published_report_status = Column(String(250))
    static_interval = Column(Boolean)
    is_interval_slider = Column(Boolean)
    interval_slider = Column(Integer)

    @property
    def data(self) -> Dict[str, Any]:
        charts = sorted(self.charts, key=lambda i: i.id, reverse=True)

        associated_charts = []

        for chart_id, chart_group in itertools.groupby(charts, lambda x : x.chart_id):
            associated_charts.append([item for item in chart_group][0].data)

        return {
            'reportId': self.id,
            'reportName': self.report_name,
            'reportDescription': self.report_description,
            'reportSummary': self.report_summary,
            'reportType': self.report_type,
            'reportFrequency': self.report_frequency,
            'staticInterval': self.static_interval if self.static_interval is not None else False,
            'isIntervalSlider': self.is_interval_slider,
            'intervalSlider': self.interval_slider,
            'charts': associated_charts
        }