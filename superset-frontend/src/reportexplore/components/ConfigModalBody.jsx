import React from 'react';
import Select from 'react-select';
import PropTypes from 'prop-types';
import { 
  Popover,
  OverlayTrigger,
  Button,
  Modal,
  Row,
  Col,
  FormControl,
  FormGroup,
  Badge,
  Radio,
  Panel
} from 'react-bootstrap';

import { t } from '@superset-ui/translation';

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
    dimensionOptions
  } = configData;

  let fieldDisabled = reportStatus != 'draft' && !!reportStatus

  return (
    <div>
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
            { !isNewReport && (
              <Col md={6}>
                <FormGroup>
                  <label className="control-label" htmlFor="reportId">
                    {t('Reports')}
                  </label>
                  <FormControl
                    disabled={fieldDisabled}
                    name="reportId"
                    componentClass="select"
                    bsSize="sm"
                    value={reportId}
                    onChange={event => methods.handleInputChange(event)}
                  >
                    <option value="">Select Report</option>
                    { reportList.map((x) => (<option value={x['report_id']}>{x['report_name']}</option>) )}
                  </FormControl>
                </FormGroup>
              </Col>
            )}
            { isNewReport && (
              <Col md={6}>
                <FormGroup>
                  <label className="control-label" htmlFor="reportId">
                    {t('Report ID')}
                  </label>
                  <FormControl
                    disabled={fieldDisabled}
                    name="reportId"
                    placeholder="Enter Report ID"
                    type="text"
                    bsSize="sm"
                    value={reportId}
                    onChange={event => methods.handleInputChange(event)}
                  />
                </FormGroup>
              </Col>
            )}
            <Col md={6}>
              <FormGroup>
                <label className="control-label" htmlFor="reportName">
                  {t('Report Name')}
                </label>
                <FormControl
                  disabled={fieldDisabled}
                  name="reportName"
                  type="text"
                  placeholder="Enter Report Name"
                  bsSize="sm"
                  value={reportName}
                  onChange={event => methods.handleInputChange(event)}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label className="control-label" htmlFor="reportDescription">
                  {t('Report Description')}
                </label>
                <FormControl
                  disabled={fieldDisabled}
                  name="reportDescription"
                  placeholder="Enter Report Description"
                  type="text"
                  componentClass="textarea"
                  bsSize="sm"
                  value={reportDescription}
                  onChange={event => methods.handleInputChange(event)}
                  style={{ maxWidth: '100%' }}
                />
              </FormGroup>
            </Col>              
            <Col md={6}>
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
            </Col>
            <Col md={6}>
              <FormGroup>
                <label className="control-label" htmlFor="reportType">
                  {t('Report Type')}
                </label>
                <FormControl
                  disabled={fieldDisabled}
                  name="reportType"
                  placeholder="Enter Report Type"
                  componentClass="select"
                  bsSize="sm"
                  value={reportType}
                  onChange={event => methods.handleInputChange(event)}
                >
                  <option value="">Select Report Type</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="on-time">On-Time</option>
                </FormControl>
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label className="control-label" htmlFor="reportFrequency">
                  {t('Report Frequency')}
                </label>
                <FormControl
                  disabled={fieldDisabled}
                  name="reportFrequency"
                  placeholder="Enter Report Frequency"
                  componentClass="select"
                  bsSize="sm"
                  value={reportFrequency}
                  onChange={event => methods.handleInputChange(event)}
                >
                  <option value="">Select Report Frequency</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </FormControl>
              </FormGroup>
            </Col>
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
                    Add to existing chart
                  </Radio>
                </FormGroup>
              </Col>
            </Row>
          )}

          <Row>
            { !isNewReport && !isNewChart && (
              <Col md={6}>
                <FormGroup>
                  <label className="control-label" htmlFor="chartId">
                    {t('Charts')}
                  </label>
                  <FormControl
                    disabled={fieldDisabled}
                    name="chartId"
                    componentClass="select"
                    bsSize="sm"
                    value={chartId}
                    onChange={event => methods.handleInputChange(event)}
                  >
                    <option value="">Select Chart</option>
                    { chartList.map((x) => (<option value={x['chartid']}>{x['title']}</option>) )}
                  </FormControl>
                </FormGroup>
              </Col>
            )}

            { (isNewReport || isNewChart) && (
              <Col md={6}>
                <FormGroup>
                  <label className="control-label" htmlFor="chartId">
                    {t('Chart ID')}
                  </label>
                  <FormControl
                    disabled={fieldDisabled}
                    name="chartId"
                    placeholder="Enter Chart ID"
                    type="text"
                    bsSize="sm"
                    value={chartId}
                    onChange={event => methods.handleInputChange(event)}
                  />
                </FormGroup>
              </Col>
            )}
            <Col md={6}>
              <FormGroup>
                <label className="control-label" htmlFor="chartName">
                  {t('Chart Name')}
                </label>
                <FormControl
                  disabled={fieldDisabled}
                  name="chartName"
                  placeholder="Enter Chart Name"
                  type="text"
                  bsSize="sm"
                  value={chartName}
                  onChange={event => methods.handleInputChange(event)}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label className="control-label" htmlFor="chartDescription">
                  {t('Chart Description')}
                </label>
                <FormControl
                  disabled={fieldDisabled}
                  name="chartDescription"
                  placeholder="Enter Chart Description"
                  type="text"
                  componentClass="textarea"
                  bsSize="sm"
                  value={chartDescription}
                  onChange={event => methods.handleInputChange(event)}
                  style={{ maxWidth: '100%' }}
                />
              </FormGroup>
            </Col>            
            <Col md={6}>
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
            </Col>
            <Col md={6}>
              <FormGroup>
                <label className="control-label" htmlFor="chartGranularity">
                  {t('Report Granularity')}
                </label>
                <FormControl
                  disabled={fieldDisabled}
                  name="chartGranularity"
                  placeholder="Enter Report Granularity"
                  componentClass="select"
                  bsSize="sm"
                  value={chartGranularity}
                  onChange={event => methods.handleInputChange(event)}
                >
                  <option value="">Select Report Granularity</option>
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </FormControl>
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label className="control-label" htmlFor="rollingWindow">
                  {t('Rolling Window')}
                </label>
                <FormControl
                  disabled={fieldDisabled}
                  name="rollingWindow"
                  placeholder="Rolling Window"
                  componentClass="select"
                  bsSize="sm"
                  value={rollingWindow}
                  onChange={event => methods.handleInputChange(event)}
                >
                  <option value="">Select Rolling Window</option>
                  <option value="1month">30 days</option>
                  <option value="6months">6 months</option>
                  <option value="ytd">Year-to-date</option>
                  <option value="academic">Academic year</option>
                </FormControl>
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label className="control-label" htmlFor="chartType">
                  {t('Chart Type')}
                </label>
                <FormControl
                  disabled={fieldDisabled}
                  name="chartType"
                  componentClass="select"
                  bsSize="sm"
                  value={chartType}
                  onChange={event => methods.handleInputChange(event)}
                >
                  <option value="">Select Chart Type</option>
                  <option value="Line">Line</option>
                  <option value="column">Column</option>
                  <option value="bar">Bar</option>
                  <option value="pie">Pie</option>
                  <option value="stackedbar">Stacked bar</option>
                  <option value="barvertical">Bar-vertical</option>
                </FormControl>
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label className="control-label" htmlFor="chartMode">
                  {t('Chart Mode')}
                </label>
                <FormControl
                  disabled={fieldDisabled}
                  name="chartMode"
                  placeholder="Enter Chart Mode"
                  componentClass="select"
                  bsSize="sm"
                  value={chartMode}
                  onChange={event => methods.handleInputChange(event)}
                >
                  <option value="">Select Chart Mode</option>
                  <option value="replace">Replace</option>
                  <option value="add">Add</option>
                </FormControl>
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label className="control-label" htmlFor="xAxisLabel">
                  {t('X-Axis Label')}
                </label>
                <FormControl
                  disabled={fieldDisabled}
                  name="xAxisLabel"
                  placeholder="Enter X-Axis Label"
                  type="text"
                  bsSize="sm"
                  value={xAxisLabel}
                  onChange={event => methods.handleInputChange(event)}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label className="control-label" htmlFor="yAxisLabel">
                  {t('Y-Axis Label')}
                </label>
                <FormControl
                  disabled={fieldDisabled}
                  name="yAxisLabel"
                  placeholder="Enter Y-Axis Label"
                  type="text"
                  bsSize="sm"
                  value={yAxisLabel}
                  onChange={event => methods.handleInputChange(event)}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label className="control-label" htmlFor="labelMapping">
                  {t('Label Mapping')}
                </label>
                <FormControl
                  disabled={fieldDisabled}
                  name="labelMapping"
                  type="text"
                  componentClass="textarea"
                  placeholder="Enter JSON (For all fields)"
                  bsSize="sm"
                  value={labelMapping}
                  onChange={event => methods.handleInputChange(event)}
                  style={{ maxWidth: '100%' }}
                />
              </FormGroup>
            </Col>
          </Row>
        </Panel.Body>
      </Panel>

      <Panel>
        <Panel.Heading><strong>Chart Config</strong></Panel.Heading>
        <Panel.Body>
          <Row>
            <Col md={6}>
              <FormGroup>
                <label className="control-label" htmlFor="reportFormat">
                  {t('Report Format')}
                </label>
                <FormControl
                  disabled={fieldDisabled}
                  name="reportFormat"
                  placeholder="Enter Report Format"
                  componentClass="select"
                  bsSize="sm"
                  value={reportFormat}
                  onChange={event => methods.handleInputChange(event)}
                >
                  <option value="">Select Report Format</option>
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </FormControl>
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label className="control-label" htmlFor="metrics">
                  {t('Metrics')}
                </label>
                <Select
                  isMulti
                  isDisabled={fieldDisabled}
                  name="metrics"
                  multi={true}
                  options={metricOptions}
                  value={metrics}
                  onChange={(optionValue) => {
                    methods.handleInputChange({currentTarget: {value: optionValue, name: "metrics"}})
                  }}
                />
              </FormGroup>
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
                  multi={true}
                  options={dimensionOptions}
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
{/*
      <Row>

      </Row>
      <Row>
        <Col md={6}>
          <FormGroup>
            <label className="control-label" htmlFor="reportStorageAccount">
              {t('Report Storage Account')}
            </label>
            <FormControl
              disabled={fieldDisabled}
              name="reportStorageAccount"
              placeholder="Enter Report Storage Account"
              type="text"
              bsSize="sm"
              value={reportStorageAccount}
              onChange={event => methods.handleInputChange(event)}
            />
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup>
            <label className="control-label" htmlFor="reportPath">
              {t('Report Path')}
            </label>
            <FormControl
              disabled={fieldDisabled}
              name="reportPath"
              placeholder="Enter Report Path"
              type="text"
              bsSize="sm"
              value={reportPath}
              onChange={event => methods.handleInputChange(event)}
            />
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup>
            <label className="control-label" htmlFor="reportFormat">
              {t('Report Format')}
            </label>
            <FormControl
              disabled={fieldDisabled}
              name="reportFormat"
              placeholder="Enter Report Format"
              componentClass="select"
              bsSize="sm"
              value={reportFormat}
              onChange={event => methods.handleInputChange(event)}
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </FormControl>
          </FormGroup>
        </Col>
      </Row>*/}


      {role == 'creator' && (reportStatus == 'draft' || !reportStatus) && (
        <Button
          onClick={methods.updateChart}
          type="button"
          bsSize="sm"
          bsStyle="primary"
          className="m-r-5"
          disabled={submitting}
        >
          {role=='creator' && (!submitting ? t('Save'):t('Saving'))}
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