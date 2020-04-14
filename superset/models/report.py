import simplejson as json

from flask_appbuilder import Model
from typing import Any, Dict

from sqlalchemy import Column, ForeignKey, Integer, String, Table, Text, Boolean
from superset.models.helpers import AuditMixinNullable, ImportMixin

class Report(
    Model, AuditMixinNullable, ImportMixin
):  # pylint: disable=too-many-public-methods

    """A report"""
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True)  # pylint: disable=invalid-name
    is_new_report = Column(Boolean)
    is_new_chart = Column(Boolean)

    report_id = Column(String(250))
    report_name = Column(String(250))
    report_description = Column(String(250))
    report_summary = Column(Text)
    report_type = Column(String(250))
    report_frequency = Column(String(250))
    # report_granularity = Column(String(250))

    chart_id = Column(String(250))
    chart_name = Column(String(250))
    chart_description = Column(String(250))
    chart_summary = Column(Text)
    chart_granularity = Column(String(250))
    rolling_window = Column(String(250))
    chart_type = Column(String(250))
    chart_mode = Column(String(250))
    x_axis_label = Column(String(250))
    y_axis_label = Column(String(250))
    label_mapping = Column(Text)

    report_format = Column(String(250))
    metrics = Column(String(250))
    dimensions = Column(String(250))
    report_status = Column(String(100))

    report_storage_account = Column(String(250))
    report_path = Column(String(250))
    druid_query = Column(Text)
    slice_id = Column(Integer)

    @property
    def data(self) -> Dict[str, Any]:
        return {
            "isNewReport": True if self.is_new_report is None or self.is_new_report else False ,
            "isNewChart": True if self.is_new_chart is None or self.is_new_chart else False,

            "reportId": self.report_id,
            "reportName": self.report_name,
            "reportDescription": self.report_description,
            "reportSummary": self.report_summary,
            "reportType": self.report_type,
            "reportFrequency": self.report_frequency,

            "chartId": self.chart_id,
            "chartName": self.chart_name,
            "chartDescription": self.chart_description,
            "chartSummary": self.chart_summary,
            "chartGranularity": self.chart_granularity,
            "rollingWindow": self.rolling_window,
            "chartType": self.chart_type,
            "chartMode": self.chart_mode,
            "xAxisLabel": self.x_axis_label,
            "yAxisLabel": self.y_axis_label,
            "labelMapping": self.label_mapping,

            "reportFormat": self.report_format,
            "metrics": json.loads(self.metrics),
            "dimensions": json.loads(self.dimensions),
            "reportStatus": self.report_status,

            # "reportStorageAccount": self.report_storage_account,
            # "reportPath": self.report_path,
            # "reportGranularity": self.report_granularity,
            "sliceId": self.slice_id
        }