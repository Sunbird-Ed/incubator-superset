import simplejson as json
import pdb

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
stats_logger = config["STATS_LOGGER"]
REVIEW = "review"
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
        if security_manager.can_access("can_create_report", "ReportAPI"):
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
        "/submit_report", methods=["POST"]
    )
    def create_report(self):
        form_data = json.loads(request.form.get("form_data"))
        user_id = g.user.get_id() if g.user else None
        slice_id = form_data.get("slice_id")
        slc = db.session.query(Slice).filter_by(id=slice_id).one_or_none()

        if not is_owner(slc, g.user):
            return json_error_response(
                _("You don't have the rights to ") + _("alter this ") + _("report"),
                status=400,
            )

        report = db.session.query(Report).filter_by(slice_id=slice_id).one_or_none()

        if not report:
            report = Report(slice_id=slice_id)

        report.report_name = form_data['report_name']
        report.report_description = form_data['report_description']
        report.report_id = form_data['report_id']
        report.report_summary = form_data['report_summary']
        report.chart_name = form_data['chart_name']
        report.chart_description = form_data['chart_description']
        report.chart_id = form_data['chart_id']
        report.chart_summary = form_data['chart_summary']
        report.chart_type = form_data['chart_type']
        report.x_axis_label = form_data['x_axis_label']
        report.y_axis_label = form_data['y_axis_label']
        report.report_storage_account = form_data['report_storage_account']
        report.report_path = form_data['report_path']
        report.report_format = form_data['report_format']
        report.report_mode = form_data['report_mode']
        report.report_type = form_data['report_type']
        report.report_granularity = form_data['report_granularity']
        report.label_mapping = form_data['label_mapping']
        report.slice_id = form_data['slice_id']
        report.report_status = REVIEW

        if report.id:
            self.overwrite_record(report)
        else:
            self.save_record(report)

        return json_success(json.dumps({"status": "SUCCESS", "report_status": report.report_status}))

    @event_logger.log_this
    @handle_api_exception
    @expose(
        "/report_config/<slice_id>", methods=["GET"]
    )
    def report_config(self, slice_id=None):
        slc = db.session.query(Slice).filter_by(id=slice_id).one_or_none()

        report = db.session.query(Report).filter_by(slice_id=slice_id).one_or_none()

        return json_success(json.dumps({"data": report.data}))

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
        slice_id = form_data.get("slice_id")
        slc = db.session.query(Slice).filter_by(id=slice_id).one_or_none()

        if not security_manager.can_access("can_publish_report", "ReportAPI"):
            return json_error_response(
                _("You don't have the rights to ") + _("alter this ") + _("report"),
                status=400,
            )

        report = db.session.query(Report).filter_by(slice_id=slice_id).one_or_none()

        if not report or report.report_status != REVIEW:
            return json_error_response(
                _("Report is not submitted for review yet"),
                status=400,
            )

        report.report_status = PUBLISHED

        self.overwrite_record(report)

        return json_success(json.dumps({"status": "SUCCESS", "report_status": report.report_status}))



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