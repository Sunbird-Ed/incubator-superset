import simplejson as json
import pdb
import os
import requests as http_client

from flask_appbuilder.security.decorators import has_access, has_access_api
from flask_appbuilder import expose
from flask import request, g, flash
from flask_babel import lazy_gettext as _

from superset.connectors.connector_registry import ConnectorRegistry
from superset.utils.decorators import etag_cache, stats_timing
from superset.models.hawkeye_chart import HawkeyeChart
from superset.models.hawkeye_report import HawkeyeReport
from superset.models.slice import Slice
from superset import (
    app,
    db,
    security_manager,
    event_logger
)
from superset.views.base import (
    api,
    BaseSupersetView,
    handle_api_exception,
    common_bootstrap_payload,
    json_error_response,
    json_success,
)
from superset.utils import core as utils
from superset.views.utils import (
    apply_display_max_row_limit,
    bootstrap_user_data,
    get_datasource_info,
    get_form_data,
    get_viz,
)

config = app.config
SQLLAB_QUERY_COST_ESTIMATE_TIMEOUT = config["SQLLAB_QUERY_COST_ESTIMATE_TIMEOUT"]
PORTAL_API_HOST = os.environ['PORTAL_API_HOST']
PORTAL_API_KEY = os.environ['PORTAL_API_KEY']
ANALYTICS_API_KEY = os.environ['ANALYTICS_API_KEY']
ANALYTICS_API_HOST = os.environ['ANALYTICS_API_HOST']
PORTAL_HOST = os.environ['PORTAL_HOST']

stats_logger = config["STATS_LOGGER"]
REVIEW = "review"
APPROVED = "approved"
DRAFT = "draft"
PUBLISHED = "live"


def is_owner(obj, user):
    """ Check if user is owner of the slice """
    return obj and user in obj.owners


class ReportAPI(BaseSupersetView):

    @event_logger.log_this
    @has_access
    @expose("/report_explore/<datasource_type>/<datasource_id>/", methods=["GET", "POST"])
    @expose("/report_explore/", methods=["GET", "POST"])
    def report_explore(self, datasource_type=None, datasource_id=None):
        user_id = g.user.get_id() if g.user else None
        form_data, slc = get_form_data(use_slice_data=True)

        # Flash the SIP-15 message if the slice is owned by the current user and has not
        # been updated, i.e., is not using the [start, end) interval.
        if (
            config["SIP_15_ENABLED"]
            and slc
            and g.user in slc.owners
            and (
                not form_data.get("time_range_endpoints")
                or form_data["time_range_endpoints"]
                != (
                    utils.TimeRangeEndpoint.INCLUSIVE,
                    utils.TimeRangeEndpoint.EXCLUSIVE,
                )
            )
        ):
            url = Href("/reportapi/report_explore/")(
                {
                    "form_data": json.dumps(
                        {
                            "slice_id": slc.id,
                            "time_range_endpoints": (
                                utils.TimeRangeEndpoint.INCLUSIVE.value,
                                utils.TimeRangeEndpoint.EXCLUSIVE.value,
                            ),
                        }
                    )
                }
            )

            flash(Markup(config["SIP_15_TOAST_MESSAGE"].format(url=url)))

        error_redirect = "/reportchart/list/"
        try:
            datasource_id, datasource_type = get_datasource_info(
                datasource_id, datasource_type, form_data
            )
        except SupersetException:
            return redirect(error_redirect)

        datasource = ConnectorRegistry.get_datasource(
            datasource_type, datasource_id, db.session
        )
        if not datasource:
            flash(DATASOURCE_MISSING_ERR, "danger")
            return redirect(error_redirect)

        if config["ENABLE_ACCESS_REQUEST"] and (
            not security_manager.datasource_access(datasource)
        ):
            flash(
                __(security_manager.get_datasource_access_error_msg(datasource)),
                "danger",
            )
            return redirect(
                "superset/request_access/?"
                f"datasource_type={datasource_type}&"
                f"datasource_id={datasource_id}&"
            )

        viz_type = form_data.get("viz_type")
        if not viz_type and datasource.default_endpoint:
            return redirect(datasource.default_endpoint)

        # slc perms
        slice_add_perm = security_manager.can_access("can_add", "ReportSliceModelView")
        slice_overwrite_perm = is_owner(slc, g.user)
        slice_download_perm = security_manager.can_access(
            "can_download", "ReportSliceModelView"
        )

        form_data["datasource"] = str(datasource_id) + "__" + datasource_type

        # On explore, merge legacy and extra filters into the form data
        utils.convert_legacy_filters_into_adhoc(form_data)
        utils.merge_extra_filters(form_data)

        # merge request url params
        if request.method == "GET":
            utils.merge_request_params(form_data, request.args)

        # handle save or overwrite
        action = request.args.get("action")

        if action == "overwrite" and not slice_overwrite_perm:
            return json_error_response(
                _("You don't have the rights to ") + _("alter this ") + _("chart"),
                status=400,
            )

        if action == "saveas" and not slice_add_perm:
            return json_error_response(
                _("You don't have the rights to ") + _("create a ") + _("chart"),
                status=400,
            )

        if action in ("saveas", "overwrite"):
            return self.save_or_overwrite_slice(
                request.args,
                slc,
                slice_add_perm,
                slice_overwrite_perm,
                slice_download_perm,
                datasource_id,
                datasource_type,
                datasource.name,
            )

        standalone = (
            request.args.get(utils.ReservedUrlParameters.STANDALONE.value) == "true"
        )
        if security_manager.can_access("can_submit_report", "ReportAPI"):
            role = "creator"
        elif security_manager.can_access("can_publish_report", "ReportAPI"):
            role = "reviewer"
        else:
            role = "any"

        bootstrap_data = {
            "can_add": slice_add_perm,
            "can_download": slice_download_perm,
            "can_overwrite": slice_overwrite_perm,
            "datasource": datasource.data,
            "form_data": form_data,
            "datasource_id": datasource_id,
            "datasource_type": datasource_type,
            "slice": slc.data if slc else None,
            "standalone": standalone,
            "user_id": user_id,
            "forced_height": request.args.get("height"),
            "common": common_bootstrap_payload(),
            "role": role
        }
        table_name = (
            datasource.table_name
            if datasource_type == "table"
            else datasource.datasource_name
        )
        if slc:
            title = slc.slice_name
        else:
            title = _("Explore - %(table)s", table=table_name)
        return self.render_template(
            "superset/basic.html",
            bootstrap_data=json.dumps(
                bootstrap_data, default=utils.pessimistic_json_iso_dttm_ser
            ),
            entry="reportexplore",
            title=title,
            standalone_mode=standalone,
        )


    @event_logger.log_this
    @api
    @has_access_api
    @handle_api_exception
    @expose(
        "/update_report", methods=["POST"]
    )
    def update_report_chart(self):
        form_data = json.loads(request.form.get("form_data"))
        user_id = g.user.get_id() if g.user else None
        slice_id = form_data.get("sliceId")
        slc = db.session.query(Slice).filter_by(id=slice_id).one_or_none()

        if not is_owner(slc, g.user):
            return json_error_response(
                _("You don't have the rights to ") + _("alter this ") + _("report"),
                status=400,
            )

        chart = db.session.query(HawkeyeChart).filter_by(slice_id=slice_id).one_or_none()

        if not chart:
            chart = HawkeyeChart(slice_id=slice_id)
        print(form_data.get("reportId"))
        if form_data.get("reportId") is None or form_data.get("reportId") == "":
            report = HawkeyeReport()
        else:
            report = db.session.query(HawkeyeReport).filter_by(id=form_data["reportId"]).one_or_none()
        
        report.report_name = form_data["reportName"]
        report.report_description = form_data["reportDescription"]
        report.report_summary = form_data["reportSummary"]
        report.report_type = form_data["reportType"]
        report.report_frequency = form_data["reportFrequency"]
        report.is_new_report = form_data["isNewReport"]
        if report.id:
            self.overwrite_record(report)
        else:
            self.save_record(report)

        chart.is_new_chart = form_data["isNewChart"]
        chart.hawkeye_report_id = report.id
        chart.chart_id = form_data["chartId"]
        chart.chart_name = form_data["chartName"]
        chart.chart_description = form_data["chartDescription"]
        chart.chart_summary = form_data["chartSummary"]
        chart.chart_granularity = form_data["chartGranularity"]
        chart.rolling_window = form_data["rollingWindow"]
        chart.chart_type = form_data["chartType"]
        chart.chart_mode = form_data["chartMode"]
        chart.x_axis_label = form_data["xAxisLabel"]
        chart.y_axis_label = form_data["yAxisLabel"]
        chart.label_mapping = form_data["labelMapping"]

        # chart.dimensions = json.dumps(form_data["dimensions"])

        chart.slice_id = form_data['sliceId']
        chart.chart_status = DRAFT

        

        if chart.id:
            self.overwrite_record(chart)
        else:
            self.save_record(chart)

        return json_success(json.dumps({"status": "SUCCESS", "report_status": chart.chart_status, "report_id": report.id}))


    @event_logger.log_this
    @api
    @has_access_api
    @handle_api_exception
    @expose(
        "/submit_report", methods=["POST"]
    )
    def submit_report(self):
        form_data = json.loads(request.form.get("form_data"))
        user_id = g.user.get_id() if g.user else None
        slice_id = form_data.get("sliceId")
        slc = db.session.query(Slice).filter_by(id=slice_id).one_or_none()

        if not is_owner(slc, g.user):
            return json_error_response(
                _("You don't have the rights to ") + _("alter this ") + _("report"),
                status=401,
            )

        chart = db.session.query(HawkeyeChart).filter_by(slice_id=slice_id).one_or_none()

        if not chart:
            return json_error_response(
                _("You don't have the rights to ") + _("alter this ") + _("report"),
                status=400,
            )

        chart.chart_status = REVIEW

        self.overwrite_record(chart)

        return json_success(json.dumps({"status": "SUCCESS", "report_status": chart.chart_status}))


    @event_logger.log_this
    @handle_api_exception
    @expose(
        "/report_config/<slice_id>", methods=["GET"]
    )
    def report_config(self, slice_id=None):
        report = db.session.query(HawkeyeChart).filter_by(slice_id=slice_id).one_or_none()

        report_cofig = report.data if report is not None else {}

        report_cofig.update({
            "portalHost": PORTAL_HOST
        })

        return json_success(json.dumps({"data": report_cofig}))


    @event_logger.log_this
    @handle_api_exception
    @expose(
        "/list_reports", methods=["GET"]
    )
    def list_reports(self, slice_id=None):
        reports = db.session.query(HawkeyeReport).all()
        
        reports = [item.data for item in reports]

        return json_success(json.dumps({"data": reports}))


    @event_logger.log_this
    @api
    @has_access_api
    @handle_api_exception
    @expose(
        "/publish_report", methods=["POST"]
    )
    def publish_report(self, slice_id=None):
        form_data = json.loads(request.form.get("form_data"))
        user_id = g.user.get_id() if g.user else None
        slice_id = form_data.get("sliceId")
        slc = db.session.query(Slice).filter_by(id=slice_id).one_or_none()

        if not security_manager.can_access("can_publish_report", "ReportAPI"):
            return json_error_response(
                _("You don't have the rights to ") + _("alter this ") + _("report"),
                status=400,
            )

        chart = db.session.query(HawkeyeChart).filter_by(slice_id=slice_id).one_or_none()

        if not chart or (chart.chart_status != REVIEW and chart.chart_status != APPROVED):
            return json_error_response(
                _("Report is not submitted for review yet"),
                status=400,
            )


        viz_obj = get_viz(
            datasource_type=slc.datasource_type,
            datasource_id=slc.datasource_id,
            form_data=json.loads(slc.params),
            force=False,
        )

        query = None

        try:
            query_obj = viz_obj.query_obj()
            if query_obj:
                query = viz_obj.datasource.get_query_str(query_obj)
        except Exception as e:
            logger.exception(e)
            return json_error_response(e)

        # chart.chart_status = PUBLISHED if chart.chart_status == APPROVED else APPROVED
        chart.chart_status = PUBLISHED
        chart.druid_query = json.loads(query) if isinstance(query, str) else query

        report_id = None

        if chart.chart_status == PUBLISHED:
            report_id = self.publish_report_portal(chart)
            self.publish_job_analytics(chart)

        chart.hawkeye_report.published_report_id = report_id
        chart.submitted_as_job = True

        self.overwrite_record(chart)

        return json_success(json.dumps({
            "status": "SUCCESS",
            "report_status": chart.chart_status,
            "report_id": chart.hawkeye_report.published_report_id
        }))


    def publish_job_analytics(self, chart):
        job_config = self.get_job_config(chart.chart_id)
        
        if job_config is None:
            job_config = self.job_config_template(chart)
        else:
            y_axis_label = chart.label_mapping.get(chart.y_axis_label)
            y_axis_label = y_axis_label if y_axis_label is not None else chart.y_axis_label

            metric = {
                'metric': chart.label_mapping[chart.y_axis_label],
                'label': chart.label_mapping[chart.label_mapping[chart.y_axis_label]],
                'druidQuery': self.generate_druid_query(chart, chart.druid_query)
            }

            job_config['config']['reportConfig']['metrics'].append(metric)

            job_config['config']['reportConfig']['labels'] = chart.label_mapping

            job_config['config']['reportConfig']['output'][0]['metrics'].append(chart.label_mapping[chart.y_axis_label])

            job_config['description'] = chart.hawkeye_report.report_description
            job_config['reportSchedule'] = chart.hawkeye_report.report_frequency
            job_config['config']['reportConfig']['dateRange'] = {
                'staticInterval': chart.rolling_window,
                'granularity': chart.chart_granularity.lower()
            }
            job_config['createdBy'] = 'User1'

        self.post_job_config(job_config, chart)


    def publish_report_portal(self, chart):
        published_report_id = chart.hawkeye_report.published_report_id
        if published_report_id is None or published_report_id is "":
            report_config = self.report_config_template(chart)
        else:
            report_config = self.get_report_config(published_report_id)
            try:
                report_config.pop("templateurl")
                report_config.pop("reportid")
                report_config.pop("reportaccessurl")
            except Exception as e:
                pass

        if chart.is_new_chart:
            chart_config = self.report_chart_template(chart)

            report_config['reportconfig']['charts'].append(chart_config)
        else:
            charts = [c for c in filter(lambda x: x['chartId'] == chart.chart_id, report_config['reportconfig']['charts'])]
            chart_config = charts[0]

            y_axis_label = chart.label_mapping[chart.label_mapping[chart.y_axis_label]]

            chart_config['datasets'].append({
                "dataExpr": y_axis_label,
                "label": y_axis_label
            })

            for i, x in enumerate(report_config['reportconfig']['charts']):
                if x['chartId'] == chart.chart_id:
                    report_config['reportconfig']['charts'][i] = chart_config

        report_id = self.post_report_config(report_config, published_report_id)

        return report_id


    def get_job_config(self, chart_id):
        url = "{}/report/jobs/{}".format(ANALYTICS_API_HOST, chart_id)
        headers = {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer {}'.format(ANALYTICS_API_KEY)
        }

        response = http_client.request("GET", url, headers=headers, data = {})

        return response.json().get('result')


    def post_job_config(self, job_config, chart):
        if chart.is_new_chart:
            url = "{}/report/jobs/submit".format(ANALYTICS_API_HOST)
            method = "POST"
        else:
            url = "{}/report/jobs/{}".format(ANALYTICS_API_HOST, chart.chart_id)
            method = "POST"

        headers = {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer {}'.format(ANALYTICS_API_KEY)
        }

        job_config = {
            "request": job_config
        }

        response = http_client.request(method, url, headers=headers, data=json.dumps(job_config))

        print(response.json())



    def generate_druid_query(self, chart, druid_query):

        def change_filter(filters):
            result_filter = []
            for i, fil in enumerate(filters):
                if fil.get('type') == "selector":
                    fil['type'] = "equals"
                    fil = [fil]
                elif fil.get('fields') is not None and fil.get('type') == 'or':
                    fil = {
                        'type': 'in',
                        'dimension': fil.get('fields')[0]['dimension'],
                        'values': [item for item in map(lambda x: x['value'], fil.get('fields'))]
                    }
                    fil = [fil]
                elif fil.get('fields'):
                    fil = change_filter(fil.get('fields'))

                result_filter = result_filter + fil
            return result_filter

        druid_query['queryType'] = "groupBy"
        druid_query.pop("intervals")

        if druid_query.get("dimension"):
            query_dims = druid_query.pop("dimension")
            druid_query['dimensions'] = [{
                "fieldName": query_dims,
                "aliasName": chart.label_mapping[query_dims]
            }]
        elif druid_query.get("dimensions"):
            query_dims = druid_query.pop("dimensions")
            druid_query['dimensions'] = [{
                "fieldName": item,
                "aliasName": chart.label_mapping[item]
            } for item in query_dims]

        if druid_query.get('filter') is not None:
            druid_query['filters'] = druid_query.pop('filter')
            if druid_query['filters'].get('fields') is not None:
                druid_query['filters'] = druid_query['filters']['fields']
            else:
                druid_query['filters'] = [druid_query['filters']]

        druid_query['filters'] = change_filter(druid_query['filters'])

        if druid_query.get('granularity') is not None:
            druid_query['granularity'] = chart.chart_granularity.lower()
        else:
            druid_query['granularity'] = "all"

        if druid_query.get("aggregations"):
            for i, aggregation in enumerate(druid_query['aggregations']):
                if aggregation['name'] == "count":
                    druid_query['aggregations'][i] = {
                        "name": chart.label_mapping[chart.y_axis_label],
                        "type": "longSum",
                        "fieldName": "total_count"
                    }

        return druid_query

    def job_config_template(self, chart):
        # dimensions = map(lambda x: x['value'], chart.dimensions)
        # dimensions = [chart.label_mapping[item] for item in dimensions]

        report_frequency = "ONCE" if chart.hawkeye_report.report_type == 'one-time' else \
                            chart.hawkeye_report.report_frequency

        druid_query = self.generate_druid_query(chart, chart.druid_query)

        merge_config = {
          "basePath": "/mount/data/analytics/tmp",
          "reportPath": "{}.csv".format(chart.chart_id),
          "container": "reports",
          "rollup": 0
        }

        rollup_ages = {
            "AcademicYear": "ACADEMIC_YEAR",
            "YTD": "GEN_YEAR",
            "LastMonth": "MONTH",
            "Last30Days": "MONTH",
            "LastWeek": "WEEK",
            "Last7Days": "WEEK",
            "LastDay": "DAY"
        }


        if chart.chart_mode == 'add':
            merge_config.update({
              "rollupRange": 1,
              "rollupAge": rollup_ages[chart.rolling_window],
              "rollupCol": chart.label_mapping[chart.x_axis_label],
              "frequency": report_frequency,
              "container": "reports",
              "rollup": 1
            })

        config_template = {
            'reportId': chart.chart_id, # Unique id of the report
            'createdBy': 'User1', # ID of the user who requested the report
            'description': chart.chart_description, # Short Description about the report
            'reportSchedule': report_frequency, # Type of report (ONCE/DAILY/WEEKLY/MONTHLY)
            'config': { # Config of the report
                'reportConfig': {
                    'id': chart.chart_id, # Unique id of the report
                    'queryType': druid_query.get('queryType'), # Query type of the report - groupBy, topN
                    'dateRange': {
                        'staticInterval': chart.rolling_window, # One of LastDay, LastMonth, Last7Days, Last30Days, LastWeek, YTD, AcademicYear
                        'granularity': chart.chart_granularity.lower() # Granularity of the report - DAY, WEEK, MONTH, ALL
                    },
                    'mergeConfig': merge_config,
                    'metrics': [
                        {
                            'metric': chart.label_mapping[chart.y_axis_label], # Unique metric ID
                            'label': chart.label_mapping[chart.y_axis_label], # Metric Label
                            'druidQuery': druid_query # Actual druid query
                        }
                    ],
                    'labels': chart.label_mapping,
                    'output': [
                        {
                            'type': 'csv', # Output type - csv, json
                            'metrics': [chart.label_mapping[chart.y_axis_label]], # Metrics to be output. Defaults to *
                            'dims': ['date'], # Dimensions to be used to split the data into smaller files
                            'fileParameters': ['id', 'dims'] # Dimensions to be used in the file name. Defaults to [report_id, date]
                        }
                    ]
                },
                'store': 'azure', # Output store location. One of local, azure, s3
                'container': 'reports', # Output container.
                'key': 'hawk-eye/' # File prefix if any
            },
        }

        return config_template


    def get_report_config(self, published_report_id):
        url = "{}/report/get/{}".format(PORTAL_API_HOST, published_report_id)

        headers = {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer {}'.format(PORTAL_API_KEY)
        }

        response = http_client.request("GET", url, headers=headers, data = {})

        if response.json()['result'].get("reports") is not None:
            return response.json()['result']["reports"][0]
        else:
            return None 


    def post_report_config(self, report_config, published_report_id=None):
        if published_report_id is None or published_report_id == '':
            url = "{}/report/create".format(PORTAL_API_HOST)
            method = "POST"
        else:
            url = "{}/report/update/{}".format(PORTAL_API_HOST, published_report_id)
            method = "PATCH"

        headers = {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer {}'.format(PORTAL_API_KEY)
        }

        report_config = {
            "request": {
                "report": report_config
            }
        }

        response = http_client.request(method, url, headers=headers, data=json.dumps(report_config))

        print(response.json())

        report_id = response.json()['result']['reportId']
        
        return report_id


    def report_config_template(self, chart):
        report_frequency = chart.hawkeye_report.report_frequency if chart.hawkeye_report.report_type == "scheduled" else chart.hawkeye_report.report_type
        template = {
            "title": chart.hawkeye_report.report_name,
            "description": chart.hawkeye_report.report_description,
            "authorizedroles": [
                "ORG_ADMIN",
                "REPORT_VIEWER"
            ],
            "tags": ["1Bn"],
            "updatefrequency": report_frequency,
            "createdby": "kumar",
            "type": "public",
            "slug": "hawk-eye",
            "reportduration": {
                "startdate": "12-02-2020",
                "enddate": "12-02-2020"
            },
            "reportgenerateddate": "12-02-2020",
            "reportconfig": {
                "label": chart.hawkeye_report.report_name,
                "title": chart.hawkeye_report.report_name,
                "description": chart.hawkeye_report.report_description,
                "dataSource": [
                    {
                        "id": chart.chart_id,
                        "path": "/reports/fetch/hawk-eye/{}.json".format(chart.chart_id)
                    }
                ],
                "charts": []
            }
        }

        return template


    def report_chart_template(self, chart):
        x_axis_label = chart.label_mapping[chart.x_axis_label]

        y_axis_label = chart.label_mapping[chart.label_mapping[chart.y_axis_label]]

        report_chart = {
            "chartId": chart.chart_id,
            "datasets": [
                {
                    "dataExpr": y_axis_label,
                    "label": y_axis_label
                }
            ],
            "labelsExpr": x_axis_label,
            "chartType": chart.chart_type,
            "options": {
                "scales": {
                    "yAxes": [
                        {
                            "scaleLabel": {
                                "display": True,
                                "labelString": "Count"
                            }
                        }
                    ],
                    "xAxes": [
                        {
                            "scaleLabel": {
                                "display": True,
                                "labelString": x_axis_label
                            }
                        }
                    ]
                },
                "tooltips": {
                    "intersect": False,
                    "mode": "x-axis",
                    "titleSpacing": 5,
                    "bodySpacing": 5
                },
                "title": {
                    "fontSize": 16,
                    "display": True,
                    "text": chart.chart_name
                },
                "legend": {
                    "display": False
                },
                "responsive": True,
                "showLastUpdatedOn": True
            },
            "dataSource": {
                "ids": [
                    chart.chart_id
                ],
                "commonDimension": x_axis_label
            }
        }

        return report_chart


    def save_or_overwrite_slice(
        self,
        args,
        slc,
        slice_add_perm,
        slice_overwrite_perm,
        slice_download_perm,
        datasource_id,
        datasource_type,
        datasource_name,
    ):
        """Save or overwrite a slice"""
        slice_name = args.get("slice_name")
        action = args.get("action")
        form_data = get_form_data()[0]

        if action in ("saveas"):
            if "slice_id" in form_data:
                form_data.pop("slice_id")  # don't save old slice_id
            slc = Slice(owners=[g.user] if g.user else [])

        form_data["adhoc_filters"] = self.remove_extra_filters(
            form_data.get("adhoc_filters", [])
        )

        slc.params = json.dumps(form_data, indent=2, sort_keys=True)
        slc.datasource_name = datasource_name
        slc.viz_type = form_data["viz_type"]
        slc.datasource_type = datasource_type
        slc.datasource_id = datasource_id
        slc.slice_name = slice_name

        if action in ("saveas") and slice_add_perm:
            self.save_record(slc)
        elif action == "overwrite" and slice_overwrite_perm:
            self.overwrite_record(slc)

        # Adding slice to a dashboard if requested
        dash = None

        if dash and slc not in dash.slices:
            dash.slices.append(slc)
            db.session.commit()

        response = {
            "can_add": slice_add_perm,
            "can_download": slice_download_perm,
            "can_overwrite": is_owner(slc, g.user),
            "form_data": slc.form_data,
            "slice": slc.data,
            "dashboard_id": dash.id if dash else None,
        }

        if request.args.get("goto_dash") == "true":
            response.update({"dashboard": dash.url})

        return json_success(json.dumps(response))

    @staticmethod
    def remove_extra_filters(filters):
        """Extra filters are ones inherited from the dashboard's temporary context
        Those should not be saved when saving the chart"""
        return [f for f in filters if not f.get("isExtra")]

    def save_record(self, record):
        session = db.session()
        msg = _("[{}] [{}] has been saved").format(record.__class__.__name__, record.id)
        session.add(record)
        session.commit()
        flash(msg, "info")

    def overwrite_record(self, record):
        session = db.session()
        session.merge(record)
        session.commit()
        msg = _("[{}] [{}] has been overwritten").format(record.__class__.__name__, record.id)
        flash(msg, "info")
