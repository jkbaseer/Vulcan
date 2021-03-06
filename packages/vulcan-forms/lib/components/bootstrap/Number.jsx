import React from 'react';
import { Input } from 'formsy-react-components';
import { registerComponent } from 'meteor/vulcan:core';

const NumberComponent = ({refFunction, inputProperties, ...properties}) => <Input {...inputProperties} ref={refFunction} type="number" />

registerComponent('FormComponentNumber', NumberComponent);