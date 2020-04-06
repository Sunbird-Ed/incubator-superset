/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React from 'react';
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
  Badge
} from 'react-bootstrap';

import { t } from '@superset-ui/translation';
import { SupersetClient } from '@superset-ui/connection';

import CopyToClipboard from './../../components/CopyToClipboard';
import ModalTrigger from './../../components/ModalTrigger';
import { getExploreUrlAndPayload } from '../exploreUtils';

const propTypes = {
  slice: PropTypes.object,
  role: PropTypes.string
};

export default class PublishChartButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      submitting: false,
      name: !!props.slice ? props.slice.form_data.report_name: '',
      description: !!props.slice ? props.slice.form_data.report_name: '',
      x_axis_label: !!props.slice ? props.slice.form_data.report_x_axis_label: '',
      y_axis_label: !!props.slice ? props.slice.form_data.report_y_axis_label: '',
      report_status: '',
      report_name: '',
      report_description: '',
      report_id: '',
      report_summary: '',
      chart_name: '',
      chart_description: '',
      chart_id: '',
      chart_summary: '',
      chart_type: '',
      x_axis_label: '',
      y_axis_label: '',
      report_storage_account: '',
      report_path: '',
      report_format: '',
      report_mode: '',
      report_type: '',
      report_granularity: '',
      label_mapping: '{}'
    };
  }

  handleInputChange(e) {
    const value = e.currentTarget.value;
    const name = e.currentTarget.name;
    const data = {};
    data[name] = value;
    this.setState(data);
  }

  componentWillMount(){
    SupersetClient.get({
      url: `/reportapi/report_config/${this.props.slice.slice_id}`,
    }).then(({ json }) => {
      this.setState({
        ...this.state,
        ...json.data
      })
      console.log(json)
    }).catch(() =>
      console.log("report config loaded")
    );
  }

  publishChart = () => {
    this.setState({ submitting: true });
    const { slice, role } = this.props
    const {
      report_name,
      report_description,
      report_id,
      report_summary,
      chart_name,
      chart_description,
      chart_id,
      chart_summary,
      chart_type,
      x_axis_label,
      y_axis_label,
      report_storage_account,
      report_path,
      report_format,
      report_mode,
      report_type,
      report_granularity,
      label_mapping
    } = this.state
    let reportParams = {
      report_name,
      report_description,
      report_id,
      report_summary,
      chart_name,
      chart_description,
      chart_id,
      chart_summary,
      chart_type,
      x_axis_label,
      y_axis_label,
      report_storage_account,
      report_path,
      report_format,
      report_mode,
      report_type,
      report_granularity,
      label_mapping,
      slice_id: slice.slice_id
    };
    slice.form_data.report_status = role == 'reviewer' ? 'published' : 'review_submitted'
    const url = role == 'reviewer' ? "/reportapi/publish_report" : "/reportapi/submit_report"


    SupersetClient.post({ url, postPayload: { form_data: reportParams } }).then(({ json }) => {
      this.setState({ report_status: json.report_status, submitting: false })
      console.log("Successfully submitted for review")
    })
    .catch(() => {
      console.log("Save failed::Submission")
    });
  }

  renderQueryModalBody(){
    const { 
      submitting,
      name,
      description,
      report_status,
      report_name,
      report_description,
      report_id,
      report_summary,
      chart_name,
      chart_description,
      chart_id,
      chart_summary,
      chart_type,
      x_axis_label,
      y_axis_label,
      report_storage_account,
      report_path,
      report_format,
      report_mode,
      report_type,
      report_granularity,
      label_mapping
    } = this.state;

    const { role } = this.props

    return (
      <div>
        <Row>
          <Col md={6}>
            <FormGroup>
              <label className="control-label" htmlFor="report_name">
                {t('Report Name')}
              </label>
              <FormControl
                name="report_name"
                type="text"
                placeholder="Enter Report Name"
                bsSize="sm"
                value={report_name}
                onChange={event => this.handleInputChange(event)}
              />
            </FormGroup>
          </Col>
          <Col md={6}>
            <FormGroup>
              <label className="control-label" htmlFor="report_description">
                {t('Report Description')}
              </label>
              <FormControl
                name="report_description"
                placeholder="Enter Report Description"
                type="text"
                componentClass="textarea"
                bsSize="sm"
                value={report_description}
                onChange={event => this.handleInputChange(event)}
                style={{ maxWidth: '100%' }}
              />
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <FormGroup>
              <label className="control-label" htmlFor="report_id">
                {t('Report ID')}
              </label>
              <FormControl
                name="report_id"
                placeholder="Enter Report ID"
                type="text"
                bsSize="sm"
                value={report_id}
                onChange={event => this.handleInputChange(event)}
              />
            </FormGroup>
          </Col>
          <Col md={6}>
            <FormGroup>
              <label className="control-label" htmlFor="report_summary">
                {t('Report Summary')}
              </label>
              <FormControl
                name="report_summary"
                placeholder="Enter Report Summary"
                type="text"
                componentClass="textarea"
                bsSize="sm"
                value={report_summary}
                onChange={event => this.handleInputChange(event)}
                style={{ maxWidth: '100%' }}
              />
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <FormGroup>
              <label className="control-label" htmlFor="chart_name">
                {t('Chart Name')}
              </label>
              <FormControl
                name="chart_name"
                placeholder="Enter Chart Name"
                type="text"
                bsSize="sm"
                value={chart_name}
                onChange={event => this.handleInputChange(event)}
              />
            </FormGroup>
          </Col>
          <Col md={6}>
            <FormGroup>
              <label className="control-label" htmlFor="chart_description">
                {t('Chart Description')}
              </label>
              <FormControl
                name="chart_description"
                placeholder="Enter Chart Description"
                type="text"
                componentClass="textarea"
                bsSize="sm"
                value={chart_description}
                onChange={event => this.handleInputChange(event)}
                style={{ maxWidth: '100%' }}
              />
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <FormGroup>
              <label className="control-label" htmlFor="chart_id">
                {t('Chart ID')}
              </label>
              <FormControl
                name="chart_id"
                placeholder="Enter Chart ID"
                type="text"
                bsSize="sm"
                value={chart_id}
                onChange={event => this.handleInputChange(event)}
              />
            </FormGroup>
          </Col>
          <Col md={6}>
            <FormGroup>
              <label className="control-label" htmlFor="chart_summary">
                {t('Chart Summary')}
              </label>
              <FormControl
                name="chart_summary"
                placeholder="Enter Chart Summary"
                type="text"
                componentClass="textarea"
                bsSize="sm"
                value={chart_summary}
                onChange={event => this.handleInputChange(event)}
                style={{ maxWidth: '100%' }}
              />
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <FormGroup>
              <label className="control-label" htmlFor="chart_type">
                {t('Chart Type')}
              </label>
              <FormControl
                name="chart_type"
                componentClass="select"
                bsSize="sm"
                value={chart_type}
                onChange={event => this.handleInputChange(event)}
              >
                <option value="line">line</option>
                <option value="bar">bar</option>
                <option value="stackedbar">Stacked bar</option>
                <option value="barvertical">Bar-vertical</option>
              </FormControl>
            </FormGroup>
          </Col>
          <Col md={6}>
            <FormGroup>
              <label className="control-label" htmlFor="x_axis_label">
                {t('X-Axis Label')}
              </label>
              <FormControl
                name="x_axis_label"
                placeholder="Enter X-Axis Label"
                type="text"
                bsSize="sm"
                value={x_axis_label}
                onChange={event => this.handleInputChange(event)}
              />
            </FormGroup>
          </Col>
          <Col md={6}>
            <FormGroup>
              <label className="control-label" htmlFor="y_axis_label">
                {t('Y-Axis Label')}
              </label>
              <FormControl
                name="y_axis_label"
                placeholder="Enter Y-Axis Label"
                type="text"
                bsSize="sm"
                value={y_axis_label}
                onChange={event => this.handleInputChange(event)}
              />
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <FormGroup>
              <label className="control-label" htmlFor="report_storage_account">
                {t('Report Storage Account')}
              </label>
              <FormControl
                name="report_storage_account"
                placeholder="Enter Report Storage Account"
                type="text"
                bsSize="sm"
                value={report_storage_account}
                onChange={event => this.handleInputChange(event)}
              />
            </FormGroup>
          </Col>
          <Col md={6}>
            <FormGroup>
              <label className="control-label" htmlFor="report_path">
                {t('Report Path')}
              </label>
              <FormControl
                name="report_path"
                placeholder="Enter Report Path"
                type="text"
                bsSize="sm"
                value={report_path}
                onChange={event => this.handleInputChange(event)}
              />
            </FormGroup>
          </Col>
          <Col md={6}>
            <FormGroup>
              <label className="control-label" htmlFor="report_format">
                {t('Report Format')}
              </label>
              <FormControl
                name="report_format"
                placeholder="Enter Report Format"
                componentClass="select"
                bsSize="sm"
                value={report_format}
                onChange={event => this.handleInputChange(event)}
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </FormControl>
            </FormGroup>
          </Col>
          <Col md={6}>
            <FormGroup>
              <label className="control-label" htmlFor="report_mode">
                {t('Report Mode')}
              </label>
              <FormControl
                name="report_mode"
                placeholder="Enter Report Mode"
                componentClass="select"
                bsSize="sm"
                value={report_mode}
                onChange={event => this.handleInputChange(event)}
              >
                <option value="merge">Merge</option>
                <option value="add">Add</option>
              </FormControl>
            </FormGroup>
          </Col>
          <Col md={6}>
            <FormGroup>
              <label className="control-label" htmlFor="report_type">
                {t('Report Type')}
              </label>
              <FormControl
                name="report_type"
                placeholder="Enter Report Type"
                componentClass="select"
                bsSize="sm"
                value={report_type}
                onChange={event => this.handleInputChange(event)}
              >
                <option value="scheduled">Scheduled</option>
                <option value="on-time">On-Time</option>
              </FormControl>
            </FormGroup>
          </Col>
          <Col md={6}>
            <FormGroup>
              <label className="control-label" htmlFor="report_granularity">
                {t('Report Granularity')}
              </label>
              <FormControl
                name="report_granularity"
                placeholder="Enter Report Granularity"
                componentClass="select"
                bsSize="sm"
                value={report_granularity}
                onChange={event => this.handleInputChange(event)}
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </FormControl>
            </FormGroup>
          </Col>
          <Col md={6}>
            <FormGroup>
              <label className="control-label" htmlFor="label_mapping">
                {t('Label Mapping')}
              </label>
              <FormControl
                name="label_mapping"
                type="text"
                componentClass="textarea"
                placeholder="Enter JSON (For all fields)"
                bsSize="sm"
                value={label_mapping}
                onChange={event => this.handleInputChange(event)}
                style={{ maxWidth: '100%' }}
              />
            </FormGroup>
          </Col>
        </Row>


        {(report_status != 'live' &&
         ((role == 'creator' && report_status != 'review') || role == 'reviewer' && report_status == 'review')) && (
          <Button
            onClick={this.publishChart}
            type="button"
            bsSize="sm"
            bsStyle="primary"
            className="m-r-5"
            disabled={submitting}
          >
            {role=='reviewer' && (!submitting ? t('Publish'):t('Publishing'))}
            {role=='creator' && (!submitting ? t('Submit For Review'):t('Submitting'))}
          </Button>
        )}
        { role=='creator' && report_status == 'review' && (
          <Badge variant="secondary">Submitted For Review</Badge>
        )}
        { report_status == 'live' && (
          <Badge variant="secondary">Published in Portal</Badge>
        )}
      </div>
    )
  }
  render() {
    const { report_status } = this.state
    const { role } = this.props
    // return role == 'creator' || !!report_status ? (
    return role == 'creator' || role == 'reviewer' ? (
      <ModalTrigger
        isButton
        animation={this.props.animation}
        triggerNode={role == 'creator' ? t('submit for review') : t('publish')}
        modalTitle={t('Publish chart to portal dashboard')}
        bsSize="large"
        modalBody={this.renderQueryModalBody()}
      />
    ) : (<></>);
  }
}

PublishChartButton.propTypes = propTypes;
