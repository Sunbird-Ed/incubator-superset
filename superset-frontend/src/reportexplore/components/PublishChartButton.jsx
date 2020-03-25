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
import { getExploreLongUrl } from '../exploreUtils';
import * as saveModalActions from '../actions/saveModalActions';
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
      report_status: !!props.slice ? props.slice.form_data.report_status: ''
    };
  }

  handleInputChange(e) {
    const value = e.currentTarget.value;
    const name = e.currentTarget.name;
    const data = {};
    data[name] = value;
    this.setState(data);
  }

  // componentWillMount(){
  //   SupersetClient.get({
  //     url: "/superset/chart_config",
  //   }).then(({ json }) => {
  //     console.log(json)
  //   }).catch(() =>
  //     console.log("asdasd")
  //   );
  // }

  publishChart = () => {
    this.setState({ submitting: true });
    const { slice, role } = this.props
    const {
      name,
      description,
      x_axis_label,
      y_axis_label
    } = this.state
    let sliceParams = {};
    sliceParams.slice_name = slice.slice_name;
    sliceParams.action = 'overwrite';
    sliceParams.slice_id = slice.slice_id;
    slice.form_data.report_name = name
    slice.form_data.report_description = description
    slice.form_data.report_x_axis_label = x_axis_label
    slice.form_data.report_y_axis_label = y_axis_label
    slice.form_data.report_status = role == 'reviewer' ? 'published' : 'review_submitted'

    const { url, payload } = getExploreUrlAndPayload({
      formData: slice.form_data,
      endpointType: 'base',
      force: false,
      curUrl: null,
      requestParams: sliceParams,
    });

    SupersetClient.post({ url, postPayload: { form_data: payload } }).then(({ json }) => {
      if(role == 'reviewer') {
        SupersetClient.post({
          url: "/superset/publish_chart",
          postPayload: { form_data: slice.form_data, chart_data: { name, description, x_axis_label, y_axis_label } },
        }).then(({ json }) => {
          console.log(json)
          this.setState({ submitting: false, report_status: slice.form_data.report_status });
        }).catch(() => {
          this.setState({ submitting: false })
          console.log("Submission Failed")
        });
      } else {
        this.setState({ report_status: slice.form_data.report_status, submitting: false })
        console.log("Successfully submitted for review")
      }
    })
    .catch(() => {
      console.log("Save failed::Submission")
    });
  }

  renderQueryModalBody(){
    const { submitting,
            name,
            description,
            x_axis_label,
            y_axis_label,
            report_status
    } = this.state;

    const { role } = this.props

    return (
      <div>
        <Row>
          <Col md={6}>
            <FormGroup>
              <label className="control-label" htmlFor="name">
                {t('Name')}
              </label>
              <FormControl
                name="name"
                type="text"
                bsSize="sm"
                value={name}
                onChange={event => this.handleInputChange(event)}
              />
            </FormGroup>
            <FormGroup>
              <label className="control-label" htmlFor="description">
                {t('Description')}
              </label>
              <FormControl
                name="description"
                type="text"
                componentClass="textarea"
                bsSize="sm"
                value={description}
                onChange={event => this.handleInputChange(event)}
                style={{ maxWidth: '100%' }}
              />
              <p className="help-block">
                {t(
                  'The description will be displayed in the portal dashboard.',
                )}
              </p>
            </FormGroup>
            <FormGroup>
              <label className="control-label" htmlFor="x_axis_label">
                {t('X-Axis Label')}
              </label>
              <FormControl
                name="x_axis_label"
                type="text"
                bsSize="sm"
                value={x_axis_label}
                onChange={event => this.handleInputChange(event)}
              />
            </FormGroup>
            <FormGroup>
              <label className="control-label" htmlFor="y_axis_label">
                {t('Y-Axis Label')}
              </label>
              <FormControl
                name="y_axis_label"
                type="text"
                bsSize="sm"
                value={y_axis_label}
                onChange={event => this.handleInputChange(event)}
              />
            </FormGroup>
          </Col>
        </Row>
        {((role == 'creator' && !report_status) || (role=='reviewer' && report_status != 'published')) && (
          <Button
            onClick={this.publishChart}
            type="button"
            bsSize="sm"
            bsStyle="primary"
            className="m-r-5"
            disabled={submitting || ( role=='creator' && report_status == 'review_submitted')}
          >
            {role=='reviewer' && (!submitting ? t('Publish'):t('Publishing'))}
            {role=='creator' && (!submitting ? t('Submit For Review'):t('Submitting'))}
          </Button>
        )}
        { role=='creator' && report_status == 'review_submitted' && (
          <Badge variant="secondary">Submitted For Review</Badge>
        )}
        { report_status == 'published' && (
          <Badge variant="secondary">Published in Portal</Badge>
        )}
      </div>
    )
  }
  render() {
    const { report_status } = this.state
    const { role } = this.props
    return role == 'creator' || !!report_status ? (
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
