import simplejson as json
import pdb
import requests as http_client

from flask_appbuilder.security.decorators import has_access, has_access_api
from flask_appbuilder import expose
from flask import request, g, flash
from flask_babel import lazy_gettext as _

from superset.connectors.connector_registry import ConnectorRegistry
from superset.utils.decorators import etag_cache, stats_timing
from superset.models.report import Report
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
PORTAL_API_HOST = "https://hawkeye-reports-server.herokuapp.com"
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

        report = db.session.query(Report).filter_by(slice_id=slice_id).one_or_none()

        if not report:
            report = Report(slice_id=slice_id)

        report.is_new_report = form_data["isNewReport"]
        report.is_new_chart = form_data["isNewChart"]

        report.report_id = form_data["reportId"]
        report.report_name = form_data["reportName"]
        report.report_description = form_data["reportDescription"]
        report.report_summary = form_data["reportSummary"]
        report.report_type = form_data["reportType"]
        report.report_frequency = form_data["reportFrequency"]

        report.chart_id = form_data["chartId"]
        report.chart_name = form_data["chartName"]
        report.chart_description = form_data["chartDescription"]
        report.chart_summary = form_data["chartSummary"]
        report.chart_granularity = form_data["chartGranularity"]
        report.rolling_window = form_data["rollingWindow"]
        report.chart_type = form_data["chartType"]
        report.chart_mode = form_data["chartMode"]
        report.x_axis_label = form_data["xAxisLabel"]
        report.y_axis_label = form_data["yAxisLabel"]
        report.label_mapping = form_data["labelMapping"]

        report.report_format = form_data["reportFormat"]
        report.dimensions = json.dumps(form_data["dimensions"])

        report.slice_id = form_data['sliceId']
        report.report_status = DRAFT

        if report.id:
            self.overwrite_record(report)
        else:
            self.save_record(report)

        return json_success(json.dumps({"status": "SUCCESS", "report_status": report.report_status}))


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

        report = db.session.query(Report).filter_by(slice_id=slice_id).one_or_none()

        if not report:
            return json_error_response(
                _("You don't have the rights to ") + _("alter this ") + _("report"),
                status=400,
            )

        report.report_status = REVIEW

        self.overwrite_record(report)

        return json_success(json.dumps({"status": "SUCCESS", "report_status": report.report_status}))


    @event_logger.log_this
    @handle_api_exception
    @expose(
        "/report_config/<slice_id>", methods=["GET"]
    )
    def report_config(self, slice_id=None):
        report = db.session.query(Report).filter_by(slice_id=slice_id).one_or_none()

        return json_success(json.dumps({"data": report.data if report is not None else {}}))


    @event_logger.log_this
    @handle_api_exception
    @expose(
        "/list_reports", methods=["GET"]
    )
    def list_reports(self, slice_id=None):
        
        # url = "{}/report/list".format(PORTAL_API_HOST)

        # payload = {
        #     "request": {
        #         "filters": {
        #         }
        #     }
        # }
        # headers = {
        #   'Content-Type': 'application/json'
        # }

        # response = http_client.request("POST", url, headers=headers, data = json.dumps(payload))
        # reports = response.json()['result']['reports']

        reports = [{"reportid":"e97ccdb8-c4b5-4c07-85f9-8b53d6d4263e","title":"Hello","description":"<span> <b> Content Plays in UP </b>, <b> Total Devices in UP </b>  and <b> Devices comparison - New vs. Old </b> </span>","authorizedroles":["ORG_ADMIN"],"status":"draft","type":"public","reportaccessurl":"\"https://dev.sunbirded.org\"/dashBoard/reports/e97ccdb8-c4b5-4c07-85f9-8b53d6d4263e","createdon":"2020-04-14T11:38:50.369Z","updatedon":"2020-04-14T11:38:50.369Z","createdby":"ravinder kumar","reportconfig":{"id":"up_data","label":"Uttar Pradesh Last Week Data","table":{"valuesExpr":"tableData","columnsExpr":"keys"},"title":"Uttar Pradesh Last Week Data","charts":[{"chartid":"adfddb8-c4b5-4c07-85f9-834256234adb","title":"Total Plays V/s Goal of content Plays","description":"Description of Total Plays V/s Goal of content Plays","colors":[{"borderColor":"rgb(35, 28, 242)","backgroundColor":"rgba(35, 28, 242, 0.4)"},{"borderColor":"rgb(55, 70, 73)"}],"options":{"title":{"text":"Total Plays V/s Goal of content Plays","display":True,"fontSize":16},"scales":{"xAxes":[{"scaleLabel":{"display":True,"labelString":"Districts"}}],"yAxes":[{"scaleLabel":{"display":True,"labelString":"Total Plays, Goal of Content Plays"}}]},"tooltips":{"mode":"x-axis","intersect":False,"bodySpacing":5,"titleSpacing":5},"responsive":True},"summary":[{"text":["70% of states have not achieved their Goal of Content Plays for the Week","The % of states achieving their goals on a week-on-week basis is lesser than the % of states not achieving","State not on track to achieve overall Content Play goals for the month"],"label":"Observation"},{"text":["Offer better incentives for teachers to ensure usage of digital content in schools","Content coverage needs to be increased to get more content plays","Content quality needs to be examined to see if this is a factor"],"label":"Actions"}],"datasets":[{"label":"Total Plays","dataExpr":"Total Plays"},{"type":"line","label":"Goal of content plays","dataExpr":"Goal of content plays","lineThickness":1}],"chartType":"bar","bigNumbers":[{"footer":"Total Plays","header":"Total Plays of all districts","dataExpr":"Total Plays"},{"footer":"Goal of content plays","header":"Goal of content plays for all districts","dataExpr":"Goal of content plays"}],"labelsExpr":"District"},{"chartid":"85f9db8-c4b5-4c07-85f9-c4b5562385f9","title":"Overall Users (Goal vs. Actual)","description":"Description of Overall Users (Goal vs. Actual)","colors":[{"borderColor":"rgb(35, 28, 242)","backgroundColor":"rgba(35, 28, 242, 0.4)"},{"borderColor":"rgb(55, 70, 73)"}],"filters":[{"reference":"District","controlType":"multi-select","displayName":"Select District"}],"options":{"title":{"text":"Overall Users (Goal vs. Actual)","display":True,"fontSize":16},"scales":{"xAxes":[{"scaleLabel":{"display":True,"labelString":"Districts"}}],"yAxes":[{"scaleLabel":{"display":True,"labelString":"Overall Users (Goal vs. Actual)"}}]},"tooltips":{"mode":"x-axis","intersect":False,"bodySpacing":5,"titleSpacing":5},"responsive":True},"summary":[{"text":["There are not enough devices being used across the State - achievement of monthly target at risk","Despite 25000 devices being provided across districts in the last month, only 11000 devices have registered usage over the last week."],"label":"Observation"},{"text":["Identify if enough devices are available to teachers, or if devices are being locked up and not charged/ used","Penalise non usage of devices despite these being available at schools"],"label":"Actions"}],"datasets":[{"label":"Total Users","dataExpr":"Total Devices"},{"type":"line","label":"Goal of Devices","dataExpr":"Goal of Devices","lineThickness":1}],"chartType":"bar","labelsExpr":"District"}],"dataSource":"/reports/fetch/sunbird/up_report.json","description":"<span> <b> Content Plays in UP </b>, <b> Total Devices in UP </b>  and <b> Devices comparison - New vs. Old </b> </span>","downloadUrl":"/reports/fetch/sunbird/up_report.csv"},"templateurl":None,"slug":"sunbird","reportgenerateddate":"2020-04-12T00:00:00.000Z","reportduration":{"enddate":"Sun Apr 12 2020","startdate":"Sun Apr 12 2020"},"tags":["usage","plays"],"updatefrequency":"DAILY"}]

        def report_data_func(x):
            return {
                'report_id': x['reportid'],
                'report_name': x['title'],
                'report_description': x['description'],
                'report_summary': x['reportconfig'].get('summary', ""),
                'charts': x['reportconfig']['charts']
            }

        reports = map(report_data_func, reports)
        reports = [item for item in reports]

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

        report = db.session.query(Report).filter_by(slice_id=slice_id).one_or_none()

        if not report or (report.report_status != REVIEW and report.report_status != APPROVED):
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

        report.report_status = PUBLISHED if report.report_status == APPROVED else APPROVED
        report.druid_query = query

        # self.publish_report_portal(report.data)

        self.overwrite_record(report)

        return json_success(json.dumps({"status": "SUCCESS", "report_status": report.report_status}))


    def publish_report_portal(self, report):
        report_config = self.generate_config(report_data)
        
        report_config


    def generate_config(self, report_data, report_name):
        config_template = {
            "id": report_data['report_id'],
            "label": report_data['report_name'],
            "title": report_data['report_name'],
            "description": report_data['report_description'],
            "dataSource": "/reports/tn/{}.json".format(report_name),
            "charts": [
                {
                    "datasets": [
                        {
                            "dataExpr": report_data['y_axis_label'],
                            "label": report_data['y_axis_label']
                        }
                    ],
                    "colors": [
                        {
                            "borderColor": "rgb(0, 199, 134)",
                            "backgroundColor": "rgba(0, 199, 134, 0.5)"
                        },
                        {
                            "borderColor": "rgb(255, 161, 29)",
                            "backgroundColor": "rgba(255, 161, 29, 0.5)"
                        },
                        {
                            "borderColor": "rgb(255, 69, 88)",
                            "backgroundColor": "rgba(255, 69, 88, 0.5)"
                        }
                    ],
                    "labelsExpr": report_data['x_axis_label'],
                    "chartType": report_data['report_type'],
                    "options": {
                        "scales": {
                            "yAxes": [
                                {
                                    "scaleLabel": {
                                        "display": True,
                                        "labelString": report_data['y_axis_label']
                                    }
                                }
                            ],
                            "xAxes": [
                                {
                                    "scaleLabel": {
                                        "display": True,
                                        "labelString": report_data['x_axis_label']
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
                            "text": report_data['chart_name']
                        },
                        "legend": {
                            "display": False
                        },
                        "responsive": True,
                        "showLastUpdatedOn": True
                    }
                }
            ],
            "table": []
        }
        return config_template


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
        slc.is_report = True
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