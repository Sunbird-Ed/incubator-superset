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
import PublishStatusBody from './PublishStatusBody';
import { getExploreUrlAndPayload } from '../exploreUtils';

import ToastPresenter from '../../messageToasts/components/ToastPresenter';

const propTypes = {
  slice: PropTypes.object,
  role: PropTypes.string,
  reportData: PropTypes.object,
};

export default class PublishChartButton extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      submitting: false,
      rejectPanelIsSelected: false,
      reportList: [],
      chartList: [],
      dimensionsList: [],
      toasts: [],
      isNewReport: true,
      isNewChart: true,
      staticInterval: true,
      showPercentage: false,
      showTopRecords: false,
      noOfTopRecords: 10,
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
      comments: '',
      confirmationPopupTitle: "",
      metricOptions: [{label: "Count", value: "count"}, {label: "Count Distinct", value: "countDistinct"}],
      filters: [],
      dimensions: {},
      dimensionType: "$slug",
      metrics: [],
      invalidFields: [],
      validations: {},
      publishedReportId: "",
      portalHost: "",
      isIntervalSlider: false,
      showTable: true,
      showBignumber: false,
      bignumberType: "chart",
      intervalSlider: 2,
      ...props.reportData,
    };
  }

  handleInputChange = (e) => {
    const value = e.currentTarget.value;
    const name = e.currentTarget.name;
    const data = {};
    data[name] = value;
    this.setState(data, () => { 
      let fieldType = ["labelMapping", "dimensions"].includes(name) ? name == "dimensions" ? "array" : "json": "string"
      if (!['dimensions', 'filters'].includes(name)) {
        this.validateField(name, fieldType)        
      }
    });
  }

  handleRadio = (name, value) => {
    let additionalChanges = {}
    const {
      chartId,
      reportId,
      reportList,
      chartList,
      reportName,
      chartName
    } = this.state

    if(['isNewReport', 'isNewChart'].includes(name) && value){
      if(name == "isNewReport") {
        // this.generateId(reportName, "report", true)
        additionalChanges.isNewChart = true
        this.changeAssociates("report", null)
      } else {
        this.changeAssociates("chart", null)
      }

      this.generateId(chartName, "chart", true)
    } else if(['isNewReport', 'isNewChart'].includes(name) && !value) {
      if(name == "isNewReport") {
        additionalChanges.reportId = undefined
      } else {
        additionalChanges.chartId = ""
      }
    }

    this.setState({
      [name]: value,
      ...additionalChanges
    });
  }

  changeAssociates = (fieldType, value=null) => {
    let additionalChanges = {}

    if (fieldType == "report" && !!value) {
      let report = this.state.reportList.find(x => x.reportId == value)
      additionalChanges.reportName = report.reportName
      additionalChanges.reportDescription = report.reportDescription
      additionalChanges.reportType = report.reportType
      additionalChanges.reportFrequency = report.reportFrequency
      additionalChanges.staticInterval = report.staticInterval
      additionalChanges.isIntervalSlider = report.isIntervalSlider
      additionalChanges.intervalSlider = report.intervalSlider
    } else if (fieldType == "report") {
      additionalChanges.reportName = ""
      additionalChanges.reportDescription = ""
      additionalChanges.reportType = ""
      additionalChanges.reportFrequency = ""
      additionalChanges.staticInterval = false
    } else if (fieldType == "chart" && !!value) {
      let chart = this.state.chartList.find(x => x.chartId == value)

      additionalChanges.chartName = chart.chartName
      additionalChanges.chartDescription = chart.chartDescription
      additionalChanges.chartType = chart.chartType
      additionalChanges.chartGranularity = chart.chartGranularity
      additionalChanges.rollingWindow = chart.rollingWindow
      additionalChanges.chartMode = chart.chartMode
      additionalChanges.xAxisLabel = chart.xAxisLabel
      additionalChanges.yAxisLabel = chart.yAxisLabel
      additionalChanges.labelMapping = chart.labelMapping
      additionalChanges.dimensions = chart.dimensions
      additionalChanges.filters = chart.filters
      additionalChanges.dimensionType = chart.dimensionType
      additionalChanges.showBignumber = chart.showBignumber
      additionalChanges.bignumberType = chart.bignumberType
    } else if (fieldType == "chart") {
      additionalChanges.chartName = ""
      additionalChanges.chartDescription = ""
      additionalChanges.chartType = ""
      additionalChanges.chartGranularity = ""
      additionalChanges.rollingWindow = ""
      additionalChanges.chartMode = ""
      additionalChanges.xAxisLabel = ""
      additionalChanges.yAxisLabel = ""
      additionalChanges.labelMapping = ""
      additionalChanges.dimensions = {}
      additionalChanges.filters = []
      additionalChanges.dimensionType = "$slug"
      additionalChanges.showBignumber = false
      additionalChanges.bignumberType = "chart"
    }

    this.setState({
      ...additionalChanges
    })
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      ...nextProps.reportData
    })
  }

  generateId = (value, type, isNew) => {
    if(isNew) {
      let newId = value.replace(/[^A-Z0-9]+/ig, "_").toLowerCase();
      let stateVar = `${type}Id`

      let isAvailable = this.state[`${type}List`].find((value) => {
        return value[stateVar] == newId
      })

      newId = !!isAvailable ? newId + "_new" : newId

      this.setState({
        [stateVar]: newId
      })
      this.validateField(stateVar)
    }
  }

  validateField = (fieldName, fieldType='string') => {
    let { validations } = this.state
    let fieldValue = this.state[fieldName]
    if (fieldType=='string') {
      if (!!!fieldValue) {
        validations[fieldName] = {
          message: "Required field"
        }
      } else {
        validations[fieldName] = null
      }
    } else if (fieldType=='array' || fieldType=='json') {

      validations[fieldName] = null
      let value = undefined;
      if(typeof(fieldValue) == "object") {
        value = fieldValue
      } else {
        try {
          value = JSON.parse(fieldValue)
        } catch(err) {
          validations[fieldName] = {
            message: `Invalid ${fieldType}`
          }
        }
      }

      if (!!!validations[fieldName]) {
        value = fieldType=='array' ? value : Object.keys(value)
        if(value.length < 1) {
          validations[fieldName] = {
            message: "Required field"
          }
        }
      }
    }
    this.setState({
      validations
    })
    return !!!validations[fieldName]
  }

  isValidForm = () => {
    let configs = [
      "reportId","reportName","reportDescription","reportType",
      "reportFrequency","chartId","chartName","chartDescription",
      "chartGranularity","rollingWindow","chartType","chartMode","xAxisLabel",
      "yAxisLabel","labelMapping", "noOfTopRecords"
    ]

    if (this.state.reportType == 'one-time') {
      configs.splice(configs.indexOf("reportFrequency"), 1)
    }

    if (!this.state.showTopRecords) {
      configs.splice(configs.indexOf("noOfTopRecords"), 1)
    }
    if (this.state.isNewReport) {
      configs.splice(configs.indexOf("reportId"), 1)
    }
    let invalidFields = configs.filter((name) => {
      let fieldType = ["labelMapping", "dimensions"].includes(name) ? name == "dimensions" ? "array" : "json": "string"
      return !this.validateField(name, fieldType)
    })
    return invalidFields.length == 0
  }

  updateChart = () => {
    if (!this.isValidForm()) {
      return false
    }
    this.setState({ submitting: true, toasts: [] });
    const { slice, role } = this.props

    let reportParams = {
      isNewReport: this.state.isNewReport,
      isNewChart: this.state.isNewChart,
      staticInterval: this.state.staticInterval,
      reportId: this.state.reportId,
      reportName: this.state.reportName,
      reportDescription: this.state.reportDescription,
      reportSummary: this.state.reportSummary,
      reportType: this.state.reportType,
      reportFrequency: this.state.reportFrequency,
      isIntervalSlider: this.state.isIntervalSlider,
      intervalSlider: this.state.intervalSlider,
      chartId: this.state.chartId,
      chartName: this.state.chartName,
      chartDescription: this.state.chartDescription,
      chartSummary: this.state.chartSummary,
      chartGranularity: this.state.chartGranularity,
      rollingWindow: this.state.rollingWindow,
      chartType: this.state.chartType,
      showPercentage: this.state.showPercentage,
      showTopRecords: this.state.showTopRecords,
      noOfTopRecords: this.state.noOfTopRecords,
      chartMode: this.state.chartMode,
      xAxisLabel: this.state.xAxisLabel,
      yAxisLabel: this.state.yAxisLabel,
      labelMapping: this.state.labelMapping,
      filters: this.state.filters,
      showTable: this.state.showTable,
      dimensions: this.state.dimensions,
      dimensionType: this.state.dimensionType,
      showBignumber: this.state.showBignumber,
      bignumberType: this.state.bignumberType,
      sliceId: slice.slice_id
    };

    SupersetClient.post({ url: "/reportapi/update_report", postPayload: { form_data: reportParams } }).then(({ json }) => {
      let toasts = [{
        id: "sample",
        toastType: "SUCCESS_TOAST",
        text: "<h5>Report config is updated successfully</h5>",
        duration: 3000
      }]
      this.setState({ reportStatus: json.report_status, reportId: json.report_id, submitting: false, toasts })
      console.log("Successfully updated")
    })
    .catch(() => {
      let toasts = [{
        id: "sample",
        toastType: "DANGER_TOAST",
        text: "<h5>Report config update is failed</h5>",
        duration: 3000
      }]
      this.setState({ submitting: false, toasts })
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
      this.setState({
        reportStatus: json.report_status,
        submitting: false,
        publishedReportId: json.report_id
      })
      console.log("Successfully submitted for review")
    })
    .catch(() => {
      let toasts = [{
        id: "sample",
        toastType: "DANGER_TOAST",
        text: "<h5>Report publish to portal is failed</h5>",
        duration: 3000
      }]
      this.setState({ submitting: false, toasts })
      console.log("Save failed::Submission")
    });
  }

  rejectChart = () => {
    this.setState({ submitting: true });

    let url = '/reportapi/reject_report'
    let reportParams = { sliceId: this.props.slice.slice_id, comments: this.state.comments };

    SupersetClient.post({ url, postPayload: { form_data: reportParams } }).then(({ json }) => {
      this.setState({
        reportStatus: json.report_status,
        submitting: false
      })
      console.log("Successfully Rejected")
    })
    .catch(() => {
      let toasts = [{
        id: "sample",
        toastType: "DANGER_TOAST",
        text: "<h5>Report Rejection is failed</h5>",
        duration: 3000
      }]
      this.setState({ submitting: false, toasts })
      console.log("Reject failed::Submission")
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
          updateChart: this.updateChart,
          generateId: this.generateId,
          changeAssociates: this.changeAssociates
        }}
        role={role}
      />
    )
  }

  renderConfirmationBody() {
    return (
      <PublishStatusBody
        submitting={this.state.submitting}
        role={this.props.role}
        reportStatus={this.state.reportStatus}
        publishChart={this.publishChart}
        rejectChart={this.rejectChart}
        publishedReportId={this.state.publishedReportId}
        portalHost={this.state.portalHost}
        comments={this.state.comments}
        handleInputChange={this.handleInputChange}
        rejectPanelIsSelected={this.state.rejectPanelIsSelected}
      />
    )
  }

  render() {

    const { reportStatus, toasts } = this.state
    const { role } = this.props

    return role == 'creator' || (role == 'reviewer' && reportStatus != "draft" && !!reportStatus) ? (
      <span>
        <ModalTrigger
          isButton
          animation={this.props.animation}
          triggerNode={role == 'creator' ? t('Edit Config') : t('View Config')}
          modalTitle={role == 'creator' ? t('Add/Edit Config') : t('Report Config')}
          bsSize="large"
          modalBody={this.renderQueryModalBody()}
        />
        <ModalTrigger
          isButton
          animation={this.props.animation}
          triggerNode={role == 'creator' ? t('Submit') : t('Publish')}
          modalTitle={role == 'creator' ? t('Submit'): t('Publish Report/Chart as Draft')}
          bsSize="large"
          modalBody={this.renderConfirmationBody()}
        />
        <ToastPresenter
          toasts={toasts}
          removeToast={(toastId) => {}}
        />
      </span>
    ) : (<></>);
  }
}

PublishChartButton.propTypes = propTypes;
