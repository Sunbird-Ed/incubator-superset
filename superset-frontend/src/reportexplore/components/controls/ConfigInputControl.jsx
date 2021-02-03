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
import { Button, FormGroup, FormControl } from 'react-bootstrap';

const propTypes = {
  inputType: PropTypes.string,
  title: PropTypes.string,
  fieldName: PropTypes.string,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  value: PropTypes.any,
  validation: PropTypes.any,
  placeholder: PropTypes.string,
}

const defaultProps = {
  inputType: "text",
  disabled: false
}

export default class ConfigInputControl extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dataChanged: false
    }
  }

  render() {
    const {
      inputType,
      title,
      fieldName,
      onChange,
      disabled,
      value,
      placeholder,
      validation,
      children
    } = this.props

    const { dataChanged } = this.state

    return (
      <FormGroup validationState={!!validation ? "error": null}>
        { !!title && (
          <label className="control-label" htmlFor={fieldName}>
            {title}
          </label>
        )}
        {(inputType=="text" || inputType=="number") && (
          <FormControl
            disabled={disabled}
            name={fieldName}
            placeholder={placeholder}
            type={inputType}
            bsSize="sm"
            value={value}
            onChange={event => onChange(event)}
          />
        )}
        {inputType=="select" && (
          <FormControl
            disabled={disabled}
            name={fieldName}
            componentClass="select"
            bsSize="sm"
            value={value}
            onChange={event => onChange(event)}
          >
            {children}
          </FormControl>
        )}
        {inputType=="textarea" && (
          <FormControl
            disabled={disabled}
            name={fieldName}
            placeholder={placeholder}
            type="text"
            componentClass="textarea"
            bsSize="sm"
            value={value}
            onChange={event => onChange(event)}
            style={{ maxWidth: '100%' }}
          />
        )}
      </FormGroup>
    )
  }
}

ConfigInputControl.propTypes = propTypes;
ConfigInputControl.defaultProps = defaultProps;