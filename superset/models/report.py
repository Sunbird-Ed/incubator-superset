from flask_appbuilder import Model
from typing import Any, Dict

from sqlalchemy import Column, ForeignKey, Integer, String, Table, Text
from superset.models.helpers import AuditMixinNullable, ImportMixin

class Report(
    Model, AuditMixinNullable, ImportMixin
):  # pylint: disable=too-many-public-methods

    """A report"""
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True)  # pylint: disable=invalid-name
    report_name = Column(String(250))
    report_description = Column(String(250))
    report_id = Column(String(250))
    report_summary = Column(Text)
    chart_name = Column(String(250))
    chart_description = Column(String(250))
    chart_id = Column(String(250))
    chart_summary = Column(Text)
    chart_type = Column(String(250))
    x_axis_label = Column(String(250))
    y_axis_label = Column(String(250))
    report_storage_account = Column(String(250))
    report_path = Column(String(250))
    report_format = Column(String(250))
    report_mode = Column(String(250))
    report_type = Column(String(250))
    report_granularity = Column(String(250))
    report_status = Column(String(100))
    label_mapping = Column(Text)
    slice_id = Column(Integer)

    @property
    def data(self) -> Dict[str, Any]:
        return {
            "report_name": self.report_name,
            "report_description": self.report_description,
            "report_id": self.report_id,
            "report_summary": self.report_summary,
            "chart_name": self.chart_name,
            "chart_description": self.chart_description,
            "chart_id": self.chart_id,
            "chart_summary": self.chart_summary,
            "chart_type": self.chart_type,
            "x_axis_label": self.x_axis_label,
            "y_axis_label": self.y_axis_label,
            "report_storage_account": self.report_storage_account,
            "report_path": self.report_path,
            "report_format": self.report_format,
            "report_mode": self.report_mode,
            "report_type": self.report_type,
            "report_granularity": self.report_granularity,
            "report_status": self.report_status,
            "label_mapping": self.label_mapping,
            "slice_id": self.slice_id
        }