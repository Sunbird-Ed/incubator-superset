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
import json
from flask import g

from flask_appbuilder import expose, has_access
from flask_appbuilder.models.sqla.interface import SQLAInterface
from flask_babel import lazy_gettext as _

from superset import app, db
from superset.connectors.connector_registry import ConnectorRegistry
from superset.constants import RouteMethod
from superset.models.slice import Slice
from superset.utils import core as utils
from superset.views.base import check_ownership, DeleteMixin, SupersetModelView
from superset.views.chart.mixin import SliceMixin


class SliceModelView(
    SliceMixin, SupersetModelView, DeleteMixin
):  # pylint: disable=too-many-ancestors
    route_base = "/chart"
    datamodel = SQLAInterface(Slice)
    include_route_methods = RouteMethod.CRUD_SET | {
        RouteMethod.DOWNLOAD,
        RouteMethod.API_READ,
        RouteMethod.API_DELETE,
    }

    def pre_add(self, item):
        utils.validate_json(item.params)

    def pre_update(self, item):
        utils.validate_json(item.params)
        check_ownership(item)

    def pre_delete(self, item):
        check_ownership(item)

    @expose("/add", methods=["GET", "POST"])
    @has_access
    def add(self):
        datasources = ConnectorRegistry.get_all_datasources(db.session)
        datasources = [
            {"value": str(d.id) + "__" + d.type, "label": repr(d)} for d in datasources
        ]
        return self.render_template(
            "superset/add_slice.html",
            bootstrap_data=json.dumps(
                {"datasources": sorted(datasources, key=lambda d: d["label"])}
            ),
        )

    @expose("/list/")
    @has_access
    def list(self):
        if not app.config["ENABLE_REACT_CRUD_VIEWS"]:
            return super().list()

        return super().render_app_template()


class ReportSliceModelView(
    SliceMixin, SupersetModelView, DeleteMixin
):  # pylint: disable=too-many-ancestors
    route_base = "/reportchart"
    datamodel = SQLAInterface(Slice)
    include_route_methods = RouteMethod.CRUD_SET | {
        RouteMethod.DOWNLOAD,
        RouteMethod.API_READ,
        RouteMethod.API_DELETE,
    }

    def pre_add(self, item):
        utils.validate_json(item.params)

    def pre_update(self, item):
        utils.validate_json(item.params)
        check_ownership(item)

    def pre_delete(self, item):
        check_ownership(item)

    @expose("/add", methods=["GET", "POST"])
    @has_access
    def add(self):
        datasources = ConnectorRegistry.get_all_datasources(db.session)
        datasources = [
            {"value": str(d.id) + "__" + d.type, "label": repr(d)} for d in datasources
        ]
        return self.render_template(
            "superset/add_slice.html",
            bootstrap_data=json.dumps(
                {"datasources": sorted(datasources, key=lambda d: d["label"])}
            ),
        )

    @expose("/list/")
    @has_access
    def list(self):
        # Print user permissions when accessing report list
        print("\n=== User Permissions for Report List Page ===")
        user = g.user
        if user:
            print(f"User: {user.username}")
            print("\nRoles:")
            for role in user.roles:
                print(f"\nRole: {role.name}")
                print("Permissions:")
                for perm in role.permissions:
                    if perm.permission and perm.view_menu:
                        print(f"- {perm.permission.name} on {perm.view_menu.name}")

        # Check specific report permissions
        security_manager = self.appbuilder.sm
        can_create = security_manager.can_access('can_add', 'ReportSliceModelView')
        can_edit = security_manager.can_access('can_edit', 'ReportSliceModelView')
        can_delete = security_manager.can_access('can_delete', 'ReportSliceModelView')
        can_list = security_manager.can_access('can_list', 'ReportSliceModelView')
        
        print("\nReport-specific Permissions:")
        print(f"Can Create Reports: {can_create}")
        print(f"Can Edit Reports: {can_edit}")
        print(f"Can Delete Reports: {can_delete}")
        print(f"Can List Reports: {can_list}")
        
        # Check if user has reviewer permissions
        can_review = security_manager.can_access('can_reject_report', 'ReportAPI')
        print(f"Is Report Reviewer: {can_review}")
        
        return super().render_app_template()


class SliceAsync(SliceModelView):  # pylint: disable=too-many-ancestors
    route_base = "/sliceasync"
    include_route_methods = {RouteMethod.API_READ}

    list_columns = [
        "changed_on",
        "changed_on_humanized",
        "creator",
        "datasource_id",
        "datasource_link",
        "datasource_name_text",
        "datasource_type",
        "description",
        "description_markeddown",
        "edit_url",
        "icons",
        "id",
        "modified",
        "owners",
        "params",
        "slice_link",
        "slice_name",
        "slice_url",
        "viz_type",
    ]
    label_columns = {"icons": " ", "slice_link": _("Chart")}
