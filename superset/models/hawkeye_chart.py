import simplejson as json
import os

from flask_appbuilder import Model
from typing import Any, Dict

from sqlalchemy import Column, ForeignKey, Integer, String, Table, Text, Boolean, JSON
from sqlalchemy.orm import backref, relationship
from superset.models.helpers import AuditMixinNullable, ImportMixin
from superset.models.hawkeye_report import HawkeyeReport

class HawkeyeChart(
    Model, AuditMixinNullable, ImportMixin
):  # pylint: disable=too-many-public-methods

    """A report"""
    __tablename__ = "hawkeye_charts"

    id = Column(Integer, primary_key=True)  # pylint: disable=invalid-name
    is_new_chart = Column(Boolean)
    is_new_report = Column(Boolean)

    hawkeye_report_id = Column(Integer, ForeignKey("hawkeye_reports.id"), nullable=False)
    slice_id = Column(Integer, ForeignKey("slices.id"), nullable=False)
    chart_id = Column(String(250))
    chart_name = Column(String(250))
    chart_description = Column(String(250))
    chart_summary = Column(Text)
    chart_granularity = Column(String(250))
    rolling_window = Column(String(250))
    chart_type = Column(String(250))
    show_percentage = Column(Boolean)
    show_top_records = Column(Boolean)
    top_n_records = Column(Integer)
    chart_mode = Column(String(250))
    x_axis_label = Column(String(250))
    y_axis_label = Column(String(250))
    label_mapping = Column(Text)
    dimensions = Column(Text)
    filters = Column(Text)
    dimension_type = Column(String(250))
    druid_query = Column(JSON)
    submitted_as_job = Column(Boolean)
    comments = Column(Text)
    show_table = Column(Boolean)
    show_bignumber = Column(Boolean)
    bignumber_type = Column(String(250))

    chart_status = Column(String(100))
    # created_by = Column(String(100))
    # reviewed_by = Column(String(100))


    hawkeye_report = relationship(
        HawkeyeReport,
        foreign_keys=[hawkeye_report_id],
        backref=backref("charts", cascade="all, delete-orphan"),
    )

    slice_rec = relationship(
        "Slice",
        foreign_keys=[slice_id],
        backref=backref("charts", cascade="all, delete-orphan"),
    )

    @property
    def data(self) -> Dict[str, Any]:
        return {
            "isNewReport": self.is_new_report,
            "isNewChart": self.is_new_chart,

            "reportId": self.hawkeye_report.id,
            "reportName": self.hawkeye_report.report_name,
            "reportDescription": self.hawkeye_report.report_description,
            "reportSummary": self.hawkeye_report.report_summary,
            "reportType": self.hawkeye_report.report_type,
            "reportFrequency": self.hawkeye_report.report_frequency,
            "publishedReportId": self.hawkeye_report.published_report_id,
            "staticInterval": self.hawkeye_report.static_interval if self.hawkeye_report.static_interval is not None else False,
            "isIntervalSlider": self.hawkeye_report.is_interval_slider if self.hawkeye_report.is_interval_slider is not None else False,
            "intervalSlider": self.hawkeye_report.interval_slider,

            "chartId": self.chart_id,
            "comments": self.comments,
            "chartName": self.chart_name,
            "chartDescription": self.chart_description,
            "chartSummary": self.chart_summary,
            "chartGranularity": self.chart_granularity,
            "rollingWindow": self.rolling_window,
            "chartType": self.chart_type,
            "showPercentage": self.show_percentage,
            "showTopRecords": self.show_top_records,
            "noOfTopRecords": self.top_n_records,
            "chartMode": self.chart_mode,
            "xAxisLabel": self.x_axis_label,
            "yAxisLabel": self.y_axis_label,
            "labelMapping": json.dumps(self.label_mapping),
            "filters": self.filters,
            "showTable": self.show_table,
            "showBignumber": self.show_bignumber,
            "bignumberType": self.bignumber_type,

            "dimensions": self.dimensions,
            "dimensionType": self.dimension_type,
            "reportStatus": self.chart_status,

            "sliceId": self.slice_id
        }