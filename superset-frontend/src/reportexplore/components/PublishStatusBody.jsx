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
  submitting: PropTypes.bool
}

export default function PublishStatusBody ({
  publishChart,
  role,
  reportStatus,
  publishedReportId,
  portalHost,
  submitting
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
        { role == "creator" && reportStatus=='draft' && (
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
        { role == "reviewer" && (reportStatus == 'review' || reportStatus == 'approved') && (
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
                {reportStatus=='review' && (!submitting ? t('Publish'):t('Publishing'))}
                {reportStatus=='approved' && (!submitting ? t('Publish'):t('Publishing'))}
              </Button>
            </div>
          </Row>
        )}
        <br/>
      </div>
    )
}

PublishStatusBody.propTypes = propTypes;