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
    reportList,
    chartList,
    dimensionsList,
    reportStatus,
    reportName,
    reportDescription,
    reportId,
    reportSummary,
    reportFrequency,
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
    selectedReport,
    selectedChart,
    metrics,
    metricOptions,
    dimensions,
    validations,
    invalidFields
  } = configData;

  let fieldDisabled = reportStatus != 'draft' && !!reportStatus

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
                  methods.generateId(event.currentTarget.value, "report", isNewReport)
                }}
                disabled={fieldDisabled}
                value={reportName}
              />
            </Col>
            { !isNewReport && (
              <Col md={6}>
                <ConfigInputControl
                  inputType="select"
                  title={t('Report ID')}
                  fieldName="reportId"
                  placeholder="Enter Report ID"
                  validation={validations["reportId"]}
                  onChange={(event) => {
                    methods.handleInputChange(event)
                    if (!isNewChart) {
                      methods.handleInputChange({currentTarget: {value: "", name: "chartId"}})
                    }
                  }}
                  disabled={fieldDisabled}
                  value={reportId}
                >
                  <option value="">Select Report</option>
                  { reportList.map((x) => (<option value={x['reportid']}>{x['report_name']}</option>) )}
                </ConfigInputControl>
              </Col>
            )}
            { isNewReport && (
              <Col md={6}>
                <ConfigInputControl
                  inputType="text"
                  title={t('Report ID')}
                  fieldName="reportId"
                  placeholder="Enter Report ID"
                  validation={validations["reportId"]}
                  onChange={methods.handleInputChange}
                  disabled={fieldDisabled}
                  value={reportId}
                />
              </Col>
            )}
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
            {/*<Col md={6}>
              <FormGroup>
                <label className="control-label" htmlFor="reportSummary">
                  {t('Report Summary')}
                </label>
                <FormControl
                  disabled={fieldDisabled}
                  name="reportSummary"
                  placeholder="Enter Report Summary"
                  type="text"
                  componentClass="textarea"
                  bsSize="sm"
                  value={reportSummary}
                  onChange={event => methods.handleInputChange(event)}
                  style={{ maxWidth: '100%' }}
                />
              </FormGroup>
            </Col>*/}
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
          </Row>
          <Row>
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
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
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
                  onChange={methods.handleInputChange}
                  disabled={fieldDisabled}
                  value={chartId}
                >
                  <option value="">Select Chart</option>
                  { chartList.filter((x) => x.reportid == reportId).map((x) => (<option value={x['chartid']}>{x['title']}</option>) )}
                </ConfigInputControl>
              </Col>
            )}

            { (isNewReport || isNewChart) && (
              <Col md={6}>
                <ConfigInputControl
                  inputType="text"
                  title={t('Chart ID')}
                  fieldName="chartId"
                  placeholder="Enter Chart ID"
                  validation={validations["chartId"]}
                  onChange={methods.handleInputChange}
                  disabled={fieldDisabled}
                  value={chartId}
                />
              </Col>
            )}
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
            {/*<Col md={6}>
              <FormGroup>
                <label className="control-label" htmlFor="chartSummary">
                  {t('Chart Summary')}
                </label>
                <FormControl
                  disabled={fieldDisabled}
                  name="chartSummary"
                  placeholder="Enter Chart Summary"
                  type="text"
                  componentClass="textarea"
                  bsSize="sm"
                  value={chartSummary}
                  onChange={event => methods.handleInputChange(event)}
                  style={{ maxWidth: '100%' }}
                />
              </FormGroup>
            </Col>*/}
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
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
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
                <option value="7days">Last 7 Days</option>
                <option value="15days">Last 15 Days</option>
                <option value="1month">30 days</option>
                <option value="6months">6 months</option>
                <option value="ytd">Year-to-date</option>
                <option value="academic">Academic year</option>
              </ConfigInputControl>
            </Col>
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
                <option value="Line">Line</option>
                <option value="column">Column</option>
                <option value="bar">Bar</option>
                <option value="pie">Pie</option>
                <option value="stackedbar">Stacked bar</option>
                <option value="barvertical">Bar-vertical</option>
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
        </Panel.Body>
      </Panel>

      <Panel>
        <Panel.Heading><strong>Chart Output Config</strong></Panel.Heading>
        <Panel.Body>
          <Row>
            <Col md={6}>
              <ConfigInputControl
                inputType="select"
                title={t('Report Format')}
                fieldName="reportFormat"
                validation={validations["reportFormat"]}
                onChange={methods.handleInputChange}
                disabled={fieldDisabled}
                value={reportFormat}
              >
                <option value="">Select Report Format</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </ConfigInputControl>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label className="control-label" htmlFor="dimensions">
                  {t('Dimensions')}
                </label>
                <Select
                  isMulti
                  isDisabled={fieldDisabled}
                  name="dimensions"
                  className={!!validations["dimensions"] ? 'not-selected': ''}
                  multi={true}
                  options={dimensionsList}
                  value={dimensions}
                  onChange={(optionValue) => {
                    methods.handleInputChange({currentTarget: {value: optionValue, name: "dimensions"}})
                  }}
                />
              </FormGroup>
            </Col>
          </Row>
        </Panel.Body>
      </Panel>

      {role == 'creator' && (reportStatus == 'draft' || !reportStatus) && (
        <Button
          onClick={() => methods.updateChart()}
          type="button"
          bsSize="sm"
          bsStyle="primary"
          className="m-r-5"
          disabled={submitting}
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