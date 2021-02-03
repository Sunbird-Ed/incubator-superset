import React from 'react';
import Select from 'react-select';
import PropTypes from 'prop-types';
import { 
  Button,
  Row,
  Col,
  FormControl,
  FormGroup,
  Badge,
  Radio,
  Checkbox,
  Panel
} from 'react-bootstrap';

import { t } from '@superset-ui/translation';

import ConfigInputControl from './controls/ConfigInputControl';

const propTypes = {
  configData: PropTypes.object,
  methods: PropTypes.object,
  role: PropTypes.string
}

export default function ConfigModalBody ({
  configData,
  methods,
  role
}) {

  const { 
    submitting,
    name,
    description,
    isNewReport,
    isNewChart,
    staticInterval,
    showPercentage,
    showTopRecords,
    noOfTopRecords,
    reportList,
    chartList,
    dimensionsList,
    reportStatus,
    reportName,
    reportDescription,
    reportId,
    reportSummary,
    reportFrequency,
    isIntervalSlider,
    intervalSlider,
    rollingWindow,
    chartId,
    chartName,
    chartDescription,
    chartSummary,
    chartType,
    xAxisLabel,
    yAxisLabel,
    reportStorageAccount,
    reportPath,
    reportFormat,
    chartMode,
    reportType,
    chartGranularity,
    labelMapping,
    filters,
    selectedReport,
    selectedChart,
    metrics,
    metricOptions,
    dimensionType,
    dimensions,
    validations,
    showTable,
    showBignumber,
    bignumberType,
    invalidFields
  } = configData;

  let fieldDisabled = reportStatus != 'draft' && reportStatus != 'rejected' && !!reportStatus

  return (
    <div className="config-modal-body">
      <Panel>
        <Panel.Heading><strong>Report Config</strong></Panel.Heading>
        <Panel.Body>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Radio name="isNewReport"
                       disabled={fieldDisabled}
                       checked={isNewReport}
                       onClick={event => methods.handleRadio("isNewReport", true)} inline>
                  Create new report
                </Radio>{'  '}
                <Radio name="isNewReport"
                       disabled={fieldDisabled}
                       checked={!isNewReport}
                       onClick={event => methods.handleRadio("isNewReport", false)} inline>
                  Add to existing report
                </Radio>
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <ConfigInputControl
                inputType="text"
                title={t('Report Name')}
                fieldName="reportName"
                placeholder="Enter Report Name"
                validation={validations["reportName"]}
                onChange={(event) => {
                  methods.handleInputChange(event);
                  {/*methods.generateId(event.currentTarget.value, "report", isNewReport)*/}
                }}
                disabled={fieldDisabled}
                value={reportName}
              />
            </Col>
            { !isNewReport && (
              <Col md={6}>
                <ConfigInputControl
                  inputType="select"
                  title={t('Reports')}
                  fieldName="reportId"
                  placeholder="Enter Report ID"
                  validation={validations["reportId"]}
                  onChange={(event) => {
                    methods.handleInputChange(event)
                    if (!isNewChart) {
                      methods.handleInputChange({currentTarget: {value: "", name: "chartId"}})
                    }
                    methods.changeAssociates("report", event.currentTarget.value)
                  }}
                  disabled={fieldDisabled}
                  value={reportId}
                >
                  <option value="">Select Report</option>
                  { reportList.map((x) => (<option value={x['reportId']}>{x['reportName']}</option>) )}
                </ConfigInputControl>
              </Col>
            )}
          </Row>
          <Row>
            <Col md={6}>
              <ConfigInputControl
                inputType="textarea"
                title={t('Report Description')}
                fieldName="reportDescription"
                placeholder="Enter Report Description"
                validation={validations["reportDescription"]}
                onChange={methods.handleInputChange}
                disabled={fieldDisabled}
                value={reportDescription}
              />
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Checkbox
                fieldName="staticInterval"
                disabled={fieldDisabled}
                checked={staticInterval}
                onChange={(e) => {methods.handleInputChange({currentTarget: {value: e.currentTarget.checked, name: 'staticInterval'}})}}
              >
                Static Date Range
              </Checkbox>
            </Col>
            <Col md={6}>
                <Checkbox
                  fieldName="isIntervalSlider"
                  disabled={fieldDisabled}
                  checked={isIntervalSlider}
                  onChange={(e) => {methods.handleInputChange({currentTarget: {value: e.currentTarget.checked, name: 'isIntervalSlider'}})}}
                >
                  Add Interval Slider
                </Checkbox>
                { isIntervalSlider && (
                  <Col md={6}>
                    <ConfigInputControl
                      inputType="number"
                      fieldName="intervalSlider"
                      placeholder="No of days"
                      validation={validations["intervalSlider"]}
                      onChange={methods.handleInputChange}
                      disabled={fieldDisabled}
                      value={intervalSlider}
                    />
                  </Col>
                )}
              </Col>
          </Row>
          <Row>
            <Col md={6}>
              <ConfigInputControl
                inputType="select"
                title={t('Report Type')}
                fieldName="reportType"
                placeholder="Enter Report Type"
                validation={validations["reportType"]}
                onChange={methods.handleInputChange}
                disabled={fieldDisabled}
                value={reportType}
              >
                <option value="">Select Report Type</option>
                <option value="scheduled">Scheduled</option>
                <option value="one-time">One Time</option>
              </ConfigInputControl>
            </Col>
            { reportType == "scheduled" && (
              <Col md={6}>
                <ConfigInputControl
                  inputType="select"
                  title={t('Report Frequency')}
                  fieldName="reportFrequency"
                  placeholder="Enter Report Frequency"
                  validation={validations["reportFrequency"]}
                  onChange={methods.handleInputChange}
                  disabled={fieldDisabled}
                  value={reportFrequency}
                >
                  <option value="">Select Report Frequency</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </ConfigInputControl>
              </Col>
            )}
          </Row>
        </Panel.Body>
      </Panel>

      <Panel>
        <Panel.Heading><strong>Chart Config</strong></Panel.Heading>
        <Panel.Body>
          { !isNewReport && (
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Radio name="isNewChart"
                         disabled={fieldDisabled}
                         checked={isNewChart}
                         onClick={event => methods.handleRadio("isNewChart", true)} inline>
                    Create new chart
                  </Radio>{'  '}
                  <Radio name="isNewChart"
                         disabled={fieldDisabled}
                         checked={!isNewChart}
                         onClick={event => methods.handleRadio("isNewChart", false)} inline>
                    Edit Chart
                  </Radio>
                </FormGroup>
              </Col>
            </Row>
          )}

          <Row>
            <Col md={6}>
              <ConfigInputControl
                inputType="text"
                title={t('Chart Name')}
                fieldName="chartName"
                placeholder="Enter Chart Name"
                validation={validations["chartName"]}
                onChange={(event) => {
                  methods.handleInputChange(event);
                  methods.generateId(event.currentTarget.value, "chart", isNewChart)
                }}
                disabled={fieldDisabled}
                value={chartName}
              />
            </Col>
            { !isNewReport && !isNewChart && (
              <Col md={6}>
                <ConfigInputControl
                  inputType="select"
                  title={t('Charts')}
                  fieldName="chartId"
                  validation={validations["chartId"]}
                  onChange={(event) => {
                    methods.handleInputChange(event);
                    methods.changeAssociates("chart", event.currentTarget.value)
                  }}
                  disabled={fieldDisabled}
                  value={chartId}
                >
                  <option value="">Select Chart</option>
                  { chartList.filter((x) => x.reportId == reportId).map((x) => (<option value={x['chartId']}>{x['chartName']}</option>) )}
                </ConfigInputControl>
              </Col>
            )}
          </Row>
          <Row>
            <Col md={6}>
              <ConfigInputControl
                inputType="textarea"
                title={t('Chart Description')}
                fieldName="chartDescription"
                placeholder="Enter Chart chartDescription"
                validation={validations["chartDescription"]}
                onChange={methods.handleInputChange}
                disabled={fieldDisabled}
                value={chartDescription}
              />
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <ConfigInputControl
                inputType="select"
                title={t('Report Granularity')}
                fieldName="chartGranularity"
                validation={validations["chartGranularity"]}
                onChange={methods.handleInputChange}
                disabled={fieldDisabled}
                value={chartGranularity}
              >
                <option value="">Select Report Granularity</option>
                <option value="latest_index">Latest Index</option>
                <option value="DAY">Day</option>
                <option value="WEEK">Week</option>
                <option value="MONTH">Month</option>
                <option value="ALL">All</option>
              </ConfigInputControl>
            </Col>
            <Col md={6}>
              <ConfigInputControl
                inputType="select"
                title={t('Rolling Window')}
                fieldName="rollingWindow"
                validation={validations["rollingWindow"]}
                onChange={methods.handleInputChange}
                disabled={fieldDisabled}
                value={rollingWindow}
              >
                <option value="">Select Rolling Window</option>
                <option value="LastDay">Last 1 Day</option>
                <option value="Last7Days">Last 7 Days</option>
                <option value="LastWeek">Last Week</option>
                <option value="Last30Days">30 days</option>
                <option value="LastMonth">Last month</option>
                <option value="YTD">Year-to-date</option>
                <option value="AcademicYear">Academic year</option>
                {/*<option value="15days">Last 15 Days</option>*/}
                {/*<option value="6months">6 months</option>*/}
              </ConfigInputControl>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <ConfigInputControl
                inputType="select"
                title={t('Chart Type')}
                fieldName="chartType"
                validation={validations["chartType"]}
                onChange={methods.handleInputChange}
                disabled={fieldDisabled}
                value={chartType}
              >
                <option value="">Select Chart Type</option>
                <option value="line">Line</option>
                <option value="bar">Bar</option>
                <option value="pie">Pie</option>
                <option value="bignumber">Big Number</option>
                <option value="stackedbar">Stacked bar</option>
                <option value="horizontalBar">Bar-vertical</option>
              </ConfigInputControl>
            </Col>
            <Col md={6}>
              <ConfigInputControl
                inputType="select"
                title={t('Chart Mode')}
                fieldName="chartMode"
                validation={validations["chartMode"]}
                onChange={methods.handleInputChange}
                disabled={fieldDisabled}
                value={chartMode}
              >
                <option value="">Select Chart Mode</option>
                <option value="replace">Replace</option>
                <option value="add">Add</option>
              </ConfigInputControl>
            </Col>
          </Row>
          { chartType == 'pie' && (
            <Row>
              <Col md={6}>
                <Checkbox
                  fieldName="showPercentage"
                  disabled={fieldDisabled}
                  checked={showPercentage}
                  onChange={(e) => {methods.handleInputChange({currentTarget: {value: e.currentTarget.checked, name: 'showPercentage'}})}}
                >
                  Show percentage
                </Checkbox>
              </Col>
              <Col md={6}>
                <Checkbox
                  fieldName="showTopRecords"
                  disabled={fieldDisabled}
                  checked={showTopRecords}
                  onChange={(e) => {methods.handleInputChange({currentTarget: {value: e.currentTarget.checked, name: 'showTopRecords'}})}}
                >
                  Show top n records
                </Checkbox>
                { showTopRecords && (
                  <Col md={6}>
                    <ConfigInputControl
                      inputType="number"
                      fieldName="noOfTopRecords"
                      placeholder="No of Records"
                      validation={validations["noOfTopRecords"]}
                      onChange={methods.handleInputChange}
                      disabled={fieldDisabled}
                      value={noOfTopRecords}
                    />
                  </Col>
                )}
              </Col>
            </Row>
          )}
          <Row>
            <Col md={6}>
              <ConfigInputControl
                inputType="select"
                title={t('X-Axis Label')}
                fieldName="xAxisLabel"
                validation={validations["xAxisLabel"]}
                onChange={methods.handleInputChange}
                disabled={fieldDisabled}
                value={xAxisLabel}
              >
                <option value="">Select X-Axis</option>
                { dimensionsList.map((x) => (<option value={x['value']}>{x['label']}</option>) )}
              </ConfigInputControl>
            </Col>
            <Col md={6}>
              <ConfigInputControl
                inputType="select"
                title={t('Y-Axis Label')}
                fieldName="yAxisLabel"
                validation={validations["yAxisLabel"]}
                onChange={methods.handleInputChange}
                disabled={fieldDisabled}
                value={yAxisLabel}
              >
                <option value="">Select Y-Axis</option>
                { metrics.map((x) => (<option value={x['value']}>{x['label']}</option>) )}
              </ConfigInputControl>
            </Col>
            <Col md={12}>
              <ConfigInputControl
                inputType="textarea"
                title={t('Label Mapping')}
                fieldName="labelMapping"
                placeholder="Enter JSON (For all fields)"
                validation={validations["labelMapping"]}
                onChange={methods.handleInputChange}
                disabled={fieldDisabled}
                value={labelMapping}
              />
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <label className="control-label" htmlFor="filters">
                  {t('filters')}
                </label>
                <Select
                  isMulti={true}
                  isDisabled={fieldDisabled}
                  name="filters"
                  multi={true}
                  options={dimensionsList}
                  value={filters}
                  onChange={(optionValue) => {
                    methods.handleInputChange({currentTarget: {value: optionValue, name: "filters"}})
                  }}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <Checkbox
                fieldName="showTable"
                disabled={fieldDisabled}
                checked={showTable}
                onChange={(e) => {methods.handleInputChange({currentTarget: {value: e.currentTarget.checked, name: 'showTable'}})}}
              >
                Show Table
              </Checkbox>
            </Col>
          </Row>
          { chartType != 'bignumber' && (
            <Row>
              <Col md={6}>
                <Checkbox
                  fieldName="showBignumber"
                  disabled={fieldDisabled}
                  checked={showBignumber}
                  onChange={(e) => {methods.handleInputChange({currentTarget: {value: e.currentTarget.checked, name: 'showBignumber'}})}}
                >
                  Show Big Number &nbsp;&nbsp;&nbsp;
                </Checkbox>
                { showBignumber && (
                  <FormGroup>
                    <Radio name="bignumberType"
                           disabled={fieldDisabled}
                           checked={bignumberType == "chart"}
                           onClick={event => methods.handleRadio("bignumberType", "chart")} inline>
                      Chart Level
                    </Radio>
                    <Radio name="bignumberType"
                           disabled={fieldDisabled}
                           checked={bignumberType == "report"}
                           onClick={event => methods.handleRadio("bignumberType", "report")} inline>
                      Report Level
                    </Radio>{'  '}
                  </FormGroup>
                )}
              </Col>
            </Row>
          )}
        </Panel.Body>
      </Panel>

      <Panel>
        <Panel.Heading><strong>Chart Output Config</strong></Panel.Heading>
        <Panel.Body>
          <Row>
            <Col md={6}>
              <FormGroup>
                <label className="control-label" htmlFor="dimensions">
                  {t('Dimensions')}
                </label>
                <Select
                  isMulti={false}
                  isDisabled={fieldDisabled}
                  name="dimensions"
                  multi={false}
                  options={dimensionsList}
                  value={dimensions}
                  onChange={(optionValue) => {
                    methods.handleInputChange({currentTarget: {value: optionValue, name: "dimensions"}})
                  }}
                />
              </FormGroup>
            </Col>
            { (!!dimensions && Object.keys(dimensions).length > 0) && (
              <Col md={6}>
                <ConfigInputControl
                  inputType="select"
                  title={t('Dimension Type')}
                  fieldName="dimensionType"
                  validation={validations["dimensionType"]}
                  onChange={methods.handleInputChange}
                  disabled={fieldDisabled}
                  value={dimensionType}
                >
                  <option value="$slug">slug</option>
                  <option value="$state">state</option>
                  <option value="$board">board</option>
                  <option value="$channel">channel</option>
                </ConfigInputControl>
              </Col>
            )}
          </Row>
        </Panel.Body>
      </Panel>
      {role == 'creator' && (reportStatus == 'rejected' || reportStatus == 'draft' || !reportStatus) && (
        <Button
          onClick={() => methods.updateChart()}
          type="button"
          bsSize="sm"
          bsStyle="primary"
          className="m-r-5"
          disabled={false}
        >
          { !submitting ? t('Save'):t('Saving') }
        </Button>
      )}
      { role=='creator' && reportStatus == 'review' && (
        <Badge variant="secondary">Submitted For Review</Badge>
      )}
      { reportStatus == 'live' && (
        <Badge variant="secondary">Published in Portal</Badge>
      )}
    </div>
  )
}

ConfigModalBody.propTypes = propTypes;