

todo
    post aggregation lookup


Integration meeting

    Tech review in superset
        review of process and others should be in portal

    reportid is always from superset





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
    - Metrics - Keyword/Multi-select (List metrics to be output to file. Defaults to )
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


-------
Superset
-----------------------------------------
Must Do
---------------------------
- 1. Change "Are you sure you want to submit for review?" to "Please click Save before you submit for review. Are you sure you want to submit for review?"
- 2. Correct the spelling or Report Type for One Time
- 3. Remove the metrics field
- 4. Rename "Add to existing chart" to "Edit Chart"
- 5. "Edit Chart" option is not selectable
- 6. Change the text "Report status: Sent for review" to "Your report has been submitted for review". Style it as bootstrap alert (alert-success)
- 7. Approve message should be changed to "The report is successfully submitted to portal as draft. Click on this link (https://dev.sunbirded.org/dashBoard/reports/e9f4c2f1-c20c-4a30-9a2c-d064c9fba53e) to preview the report" as bootstrap alert
- 8. Add additional options to rolling window - Last 7 Days, Last 15 Days
Nice to do
---------------------------
- 1. Left menu bar UI fix
- 2. Introduce a 3 second delay for "Saving" action
- 3. Report frequency should be disabled when the report type is One time
- 4. Move the "Are you sure you want to publish" to below the messager
- 5. "Save" from the report chart section is not updating the chart.
- 6. Dropdown of the dimensions should come from the query
- 7. Disable left menu query window for reviewer
- 8. the query window should be disabled when sent for review as well
9. And the header new chart should go to report charts page
Don't do
---------------------------
1. Detecting a change in query and alerting user or auto saving during submit for review
2. Introduce a new role called "ReportAdmin". Only this role has permission to add report summary or chart summary and publish the report
3. Report reviewer can only approve the report. He can modify the report/chart summary

Algo:
1. Submit for review Superset
2. Publish as draft
3. Generate Druid Query from superset and store in db
4. Generate Report config for portal and store in db
4.1. If it is a new report
    -> Create new report
    -> Create new chart
4.1. If existing report
    Update existing report by report id
        -> If existing chart, Update existing chart by chart id
        -> If new chart, Create new chart

5.1. By Report service API, create Report config or update report config if it is getting added to report. And update the status back in db.
5.2. After report service API call, create Report config in Analytics API. And update the status back in db.

5. store the report url in db from the report service API


HE-15
-    Remove the add chart summary and report summary sections

-    Auto generate the report and chart id with the report and chart name

-   All fields are required

-    Chart name and id should be unique within a report

-    Report id should be unique

-    Label mapping should be json

-    X and Y axis fields needs to be provided as input. The input should be a single select from the query dimensions and metrics

-    Dimensions should be on one axis and metrics on another. We cannot have the same on both


6 - May - 2020

    script for taking the file from prod blbo to dev blob

    hide output report config

    date as default dimension