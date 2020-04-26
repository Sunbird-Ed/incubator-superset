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
      reportList: [],
      chartList: [],
      dimensionsList: [],
      toasts: [],
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
      metricOptions: [{label: "Count", value: "count"}, {label: "Count Distinct", value: "countDistinct"}],
      dimensions: [],
      metrics: [],
      invalidFields: [],
      validations: {},
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
      this.validateField(name, fieldType)
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
        this.generateId(reportName, "report", true)
        additionalChanges.isNewChart = true
      }

      this.generateId(chartName, "chart", true)
    } else if(['isNewReport', 'isNewChart'].includes(name) && !value) {
      if(name == "isNewReport") {
        additionalChanges.reportId = ""
      } else {
        additionalChanges.chartId = ""
      }
    }

    this.setState({
      [name]: value,
      ...additionalChanges
    });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      ...nextProps.reportData
    })
  }

  generateId = (value, type, isNew) => {
    if(isNew) {
      let newId = value.replace(/[^A-Z0-9]+/ig, "_");
      let stateVar = `${type}Id`

      let isAvailable = this.state[`${type}List`].find((value) => {
        return value[`${type}id`] == newId
      })

      newId = !!isAvailable ? newId + "1" : newId

      this.setState({
        [stateVar]: newId
      })
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
      "yAxisLabel","labelMapping","reportFormat","dimensions"
    ]

    if (this.state.reportType == 'one-time') {
      configs.splice(configs.indexOf("reportFrequency"), 1)
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
      dimensions: this.state.dimensions,
      sliceId: slice.slice_id
    };

    SupersetClient.post({ url: "/reportapi/update_report", postPayload: { form_data: reportParams } }).then(({ json }) => {
      let toasts = [{
        id: "sample",
        toastType: "SUCCESS_TOAST",
        text: "<h5>Report config is updated successfully</h5>",
        duration: 3000
      }]
      this.setState({ reportStatus: json.report_status, submitting: false, toasts })
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
          updateChart: this.updateChart,
          generateId: this.generateId
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
          triggerNode={role == 'creator' ? t('Submit for review') : t('Publish')}
          modalTitle={role == 'creator' ? t('Submit for review'): t('Publish chart to portal dashboard')}
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
