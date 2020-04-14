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
  Badge,
  Radio
} from 'react-bootstrap';

import { t } from '@superset-ui/translation';
import { SupersetClient } from '@superset-ui/connection';

import CopyToClipboard from './../../components/CopyToClipboard';
import ModalTrigger from './../../components/ModalTrigger';
import ConfigModalBody from './ConfigModalBody';
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
      reportList: [],
      chartList: [],
      isNewReport: true,
      isNewChart: true,
      reportStatus: '',
      reportName: '',
      reportDescription: '',
      reportId: '',
      reportSummary: '',
      reportFrequency: '',
      rollingWindow: '',
      chartId: '',
      chartName: '',
      chartDescription: '',
      chartSummary: '',
      chartGranularity: '',
      chartType: '',
      chartMode: '',
      xAxisLabel: '',
      yAxisLabel: '',
      reportStorageAccount: '',
      reportPath: '',
      reportFormat: '',
      reportType: '',
      reportGranularity: '',
      labelMapping: '{}',
      confirmationPopupTitle: "",
      metrics: [],
      metricOptions: [{label: "Count", value: "count"}, {label: "Count Distinct", value: "countDistinct"}],
      dimensions: [],
      dimensionOptions: [{label: "Board", value: "Board"}, {label: "District", value: "District"}]
    };
  }

  handleInputChange = (e) => {
    const value = e.currentTarget.value;
    const name = e.currentTarget.name;
    const data = {};
    data[name] = value;
    this.setState(data);
  }

  handleRadio = (name, value) => {
    let additionalChanges = {}
    const { chartId, reportId, reportList } = this.state

    if(['isNewReport', 'isNewChart'].includes(name)){
      if(name == "isNewReport" && value) {
        additionalChanges.reportName = ''
        additionalChanges.reportDescription = ''
        additionalChanges.reportId = ''
        additionalChanges.reportSummary = ''
        additionalChanges.isNewChart = true
      } else if(name == "isNewReport") {
        if (!!reportId){
          let selectedReportObj = reportList.filter((x) => x.report_id == reportId)
          additionalChanges.reportId = selectedReportObj.report_id
          additionalChanges.reportName = selectedReportObj.report_name
          additionalChanges.reportDescription = selectedReportObj.report_description
          additionalChanges.reportSummary = selectedReportObj.report_summary
          additionalChanges.isNewChart = true
        }
      }

      if(name == "isNewChart" && value) {
        additionalChanges.chartId = ''
        additionalChanges.chartName = ''
        additionalChanges.chartDescription = ''
        additionalChanges.chartSummary = ''
      } else if(name == "isNewChart") {
        if (!!reportId) {
          let selectedChartObj = reportList.charts.filter((x) => x.report_id == chartId)
          additionalChanges.chartId = selectedChartObj.chartid
          additionalChanges.chartName = selectedChartObj.title
          additionalChanges.chartDescription = selectedChartObj.description
          additionalChanges.chartSummary = selectedChartObj.summary
        }
      }
    }

    this.setState({
      [name]: value
    });
  }

  componentWillMount = async function(){
    let report_config = await SupersetClient.get({
      url: `/reportapi/report_config/${this.props.slice.slice_id}`,
    }).catch(() =>
      console.log("error::report config loaded")
    );

    let reportList = await SupersetClient.get({
      url: "/reportapi/list_reports",
    }).catch(() =>
      console.log("error::reports loaded")
    );

    // reportList

    await this.setState({
      ...this.state,
      ...report_config.json.data,
      reportList: reportList.json.data,
      chartList: reportList.json.data[0].charts
    })
  }

  updateChart = () => {
    this.setState({ submitting: true });
    const { slice, role } = this.props

    let reportParams = {
      reportId: this.state.reportId,
      reportName: this.state.reportName,
      reportDescription: this.state.reportDescription,
      reportSummary: this.state.reportSummary,
      reportType: this.state.reportType,
      reportFrequency: this.state.reportFrequency,
      chartId: this.state.chartId,
      chartName: this.state.chartName,
      chartDescription: this.state.chartDescription,
      chartSummary: this.state.chartSummary,
      chartGranularity: this.state.chartGranularity,
      rollingWindow: this.state.rollingWindow,
      chartType: this.state.chartType,
      chartMode: this.state.chartMode,
      xAxisLabel: this.state.xAxisLabel,
      yAxisLabel: this.state.yAxisLabel,
      labelMapping: this.state.labelMapping,
      reportFormat: this.state.reportFormat,
      metrics: this.state.metrics,
      dimensions: this.state.dimensions,
      sliceId: slice.slice_id
    };

    SupersetClient.post({ url: "/reportapi/update_report", postPayload: { form_data: reportParams } }).then(({ json }) => {
      this.setState({ reportStatus: json.report_status, submitting: false })
      console.log("Successfully updated")
    })
    .catch(() => {
      console.log("Save failed::Submission")
    });
  }

  publishChart = () => {
    this.setState({ submitting: true });

    const { slice, role } = this.props

    let reportParams = { sliceId: slice.slice_id };

    // slice.form_data.report_status = role == 'reviewer' ? 'published' : 'review_submitted'
    const url = role == 'reviewer' ? "/reportapi/publish_report" : "/reportapi/submit_report"


    SupersetClient.post({ url, postPayload: { form_data: reportParams } }).then(({ json }) => {
      this.setState({ reportStatus: json.report_status, submitting: false })
      console.log("Successfully submitted for review")
    })
    .catch(() => {
      console.log("Save failed::Submission")
    });
  }

  renderQueryModalBody(){
    const { role } = this.props

    return (
      <ConfigModalBody
        configData={this.state}
        methods={{
          handleRadio: this.handleRadio,
          handleInputChange: this.handleInputChange,
          publishChart: this.publishChart,
          updateChart: this.updateChart
        }}
        role={role}
      />
    )
  }

  renderConfirmationBody() {
    const { submitting, reportStatus } = this.state;
    const { role } = this.props

    return (
      <div>
        { role == "creator" && reportStatus=='draft' && (
          <Row>
            Are you sure you want to submit for review?
            <br/>
            <br/>
            <div>
              <Button
                onClick={this.publishChart}
                type="button"
                bsSize="sm"
                bsStyle="primary"
                className="m-r-5"
                disabled={submitting}
              >
                {role=='creator' && (!submitting ? t('Submit'):t('Submitting'))}
              </Button>
            </div>
          </Row>
        )}
        { role == "reviewer" && reportStatus=='review' && (
          <Row>
            Are you sure you want to publish?
            <br/>
            <br/>
            <div>
              <Button
                onClick={this.publishChart}
                type="button"
                bsSize="sm"
                bsStyle="primary"
                className="m-r-5"
                disabled={submitting}
              >
                {role=='reviewer' && (!submitting ? t('Publish'):t('Publishing'))}
              </Button>
            </div>
          </Row>
        )}
        <br/>
        { (
            (role == "creator" && reportStatus!='draft') || 
            (role == "reviewer" && ['live', 'approved'].includes(reportStatus))
          ) && (
          <Row>
            <div>
              Report status: {"  "}
              <strong>
              {
                reportStatus == 'live' ? 'Published' : 'Sent for review'
              }
              </strong>
            </div>
          </Row>
        )}
        { (
            (role == "creator" && reportStatus == 'live') || 
            (role == "reviewer" && ['live', 'approved'].includes(reportStatus))
          ) && (
          <Row>
            <div>
              <br/>
              <br/>
              Report Link: {"  "}
              <a href="https://dev.sunbirded.org/dashBoard/reports/3daa3e65-e419-4f71-bfcf-1032c3ad4c5d">
                {"https://dev.sunbirded.org/dashBoard/reports/3daa3e65-e419-4f71-bfcf-1032c3ad4c5d"}
              </a>
            </div>
          </Row>
        )}
      </div>
    )
  }

  render() {
    const { reportStatus } = this.state
    const { role } = this.props
    // return role == 'creator' || !!report_status ? (
    return role == 'creator' || role == 'reviewer' ? (
      <span>
        <ModalTrigger
          isButton
          animation={this.props.animation}
          triggerNode={role == 'creator' ? t('Edit Config') : t('Report Config')}
          modalTitle={role == 'creator' ? t('Chart config for portal dashboard') : t('Chart config for portal dashboard')}
          bsSize="large"
          modalBody={this.renderQueryModalBody()}
        />
        <ModalTrigger
          isButton
          animation={this.props.animation}
          triggerNode={role == 'creator' ? t('Submit for review') : t('Publish')}
          modalTitle={role == 'creator' ? t('Submit for review'): t('Publish chart to portal dashboard')}
          bsSize="large"
          modalBody={this.renderConfirmationBody()}
        />
      </span>
    ) : (<></>);
  }
}

PublishChartButton.propTypes = propTypes;
