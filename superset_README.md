processes for Superset new page

    create permissions 
        can_publish_chart
        can_review_chart
        can_report_explore

        add these permissions to ab_permission_view
            view_menu_id -  `Superset` id

    add ReportSliceModelView in ab_view_menu

    add ReportCharts in ab_view_menu

    add ab_permission_view as follows
        permission_id - menu_access
        view_menu_id - ReportCharts ab_view_menu id

    add ab_permission_view as follows
        permission_ids - menu_access_ids whatever SliceModelView is having
        view_menu_id - ReportCharts ab_view_menu id