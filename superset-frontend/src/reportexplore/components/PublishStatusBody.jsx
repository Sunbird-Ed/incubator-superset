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
  Panel,
  Alert
} from 'react-bootstrap';

import { t } from '@superset-ui/translation';

const propTypes = {
  publishChart: PropTypes.func,
  role: PropTypes.string,
  reportStatus: PropTypes.string,
  publishedReportId: PropTypes.string,
  portalHost: PropTypes.string,
  submitting: PropTypes.bool,
  rejectPanelIsSelected: PropTypes.bool,
  handleInputChange: PropTypes.func,
  rejectChart: PropTypes.func,
  comments: PropTypes.string
}

export default function PublishStatusBody ({
  publishChart,
  role,
  reportStatus,
  publishedReportId,
  portalHost,
  submitting,
  rejectPanelIsSelected,
  handleInputChange,
  rejectChart,
  comments
}) {

  return (
      <div>
        { role == "creator" && !reportStatus && (
          <Row>
            Please add report configuration details before submit for review
          </Row>
        )}
        { role == "creator" && reportStatus == 'review' && (
          <Alert bsStyle="success">
            Your report has been submitted for review
          </Alert>
        )}
        { ['live', 'approved', 'portal_live', 'retired', 'review'].includes(reportStatus) && (
          <Row>
            <div>
              { reportStatus == 'retired' && (
                <Alert bsStyle="success">
                  { role == 'creator' ? 'Your': 'This'} report has been retired
                </Alert>
              )}
              {/*{ role == "reviewer" && reportStatus == 'approved' && (
                <Alert>
                  The report is successfully submitted to portal as <strong>Draft</strong>. Click on this link (
                    <a target="_blank" href={`${portalHost}/dashBoard/reports/${publishedReportId}`}>
                      <u>{`${portalHost}/dashBoard/reports/${publishedReportId}`}</u>
                    </a>
                  ) to preview the report.
                </Alert>
              )}*/}
              { ['live', 'portal_live'].includes(reportStatus) && (
                <Alert bsStyle="success">
                  The report is successfully published in portal 
                  { reportStatus == 'live' && (
                    <span> as <strong>Draft</strong></span>
                  )}
                  . Click on this link(
                    <a target="_blank" href={`${portalHost}/dashBoard/reports/${publishedReportId}`}>
                      <u>{`${portalHost}/dashBoard/reports/${publishedReportId}`}</u>
                    </a>
                  ) to view the report.
                </Alert>
              )}
            </div>
          </Row>
        )}
        { role == "creator" && (reportStatus=='draft' || reportStatus=='rejected') && (
          <Row>
            Please click Save before you submit for review. Are you sure you want to submit for review?
            <br/>
            <br/>
            <div>
              <Button
                onClick={publishChart}
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
        { role == "reviewer" && (reportStatus == 'review' || reportStatus == 'approved') && !rejectPanelIsSelected && (
          <Row>
            Are you sure you want to
            {
              reportStatus == 'review' ? " publish to portal?" : " publish?"
            }
            <br/>
            <br/>
            <div>
              <Button
                onClick={publishChart}
                type="button"
                bsSize="sm"
                bsStyle="primary"
                className="m-r-5"
                disabled={submitting}
              >
                {!submitting ? t('Publish'):t('Publishing')}
              </Button>{'   '} or {'   '}
              <Button
                onClick={
                  (e) => {
                    handleInputChange({currentTarget: {value: true, name: 'rejectPanelIsSelected'}});
                    handleInputChange({currentTarget: {value: '', name: 'comments'}})
                  }
                }
                type="button"
                bsSize="sm"
                bsStyle="warning"
                className="m-r-5"
              >
                Reject and Add comments
              </Button>
            </div>
          </Row>
        )}
        { ((role == "reviewer" && (rejectPanelIsSelected || reportStatus == 'rejected')) ||
          (role == "creator" && reportStatus == 'rejected')) && (
          <div>
            <Row>
              { reportStatus == 'rejected' && (
                <div>
                  <br/>
                  Rejected with the following comments
                  <br/>
                  <br/>
                </div>
              )}
              <FormGroup>
                <FormControl
                  disabled={submitting || reportStatus == 'rejected'}
                  name={'comments'}
                  placeholder={'Enter review comments'}
                  type="text"
                  componentClass="textarea"
                  bsSize="sm"
                  value={comments}
                  onChange={handleInputChange}
                  style={{ maxWidth: '100%', height: '100px' }}
                />
              </FormGroup>
            </Row>
            { reportStatus != 'rejected' && (
              <Row>
                <Button
                  onClick={rejectChart}
                  type="button"
                  bsSize="sm"
                  bsStyle="primary"
                  className="m-r-5"
                  disabled={submitting}
                >
                  {!submitting ? t('Reject'):t('Rejecting')}
                </Button>
                <Button
                  onClick={
                    (e) => {handleInputChange({currentTarget: {value: false, name: 'rejectPanelIsSelected'}})}
                  }
                  type="button"
                  bsSize="sm"
                  bsStyle="warning"
                  className="m-r-5"
                >
                  Cancel
                </Button>
              </Row>
            )}
          </div>
        )}
        <br/>
      </div>
    )
}

PublishStatusBody.propTypes = propTypes;