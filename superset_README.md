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


Todo:

    Reject in report publish flow

    Hide and show of add or create to new report


now
    report range in report config

    review button near publish

APR -13

    chart as per sai's query

    default value for report storage account 

    dimension field

    horizontal line for section wise separation

    Report Path -> should be chart path

    for creator:

        only status
            don't show link

    for reviewer:

        After review from creator:
            Approved
                |
                V
            Published

        once approved:
            show link
                "Approve link"


Report Config
    - Report ID - Text
    - Report Name - Text
    - Report Description - HTML
    - Report Summary - HTML
    - Report Type - DropDown (Scheduled/One-time)
    - Update Frequency - DropDown (Daily/Weekly)
Chart Config
    - Chart ID - Text
    - Chart Name - Text
    - Chart Description - HTML
    - Chart Summary - HTML
    - Granularity - Dropdown (Daily, Weekly, Monthly)
    - Rolling Window - Dropdown (30 days, 6 months, YTD, ACADMEMIC_YEAR)
    - Chart Type - DropDown (Line, Column, Bar, Pie)
    - Chart Mode - DropDown (Add/Replace)
    - X-axis Label
    - Y-axis Label
    - Label Mapping - JSON
Chart Output Config
    - Format - DropDown (CSV, JSON)
    - Metrics - Keyword/Multi-select (List metrics to be output to file. Defaults to *)
    - Dimensions - Keyword/Multi-select (List of dimensions to be appended to file)
-----
-----
Must do
----------------
1. Setup the superset instance in prod vpc
2. Make the report config changes as suggested above
3. Send for review should only display the message that the report/chart is sent for review. Do not show the report url
Nice to have
---------------
1. Approve and Publish workflow
2. Approve to display the message that the report is saved as draft along with the report link
3. Publish to display the message that the report is live along with the report link
4. UI clean-ups