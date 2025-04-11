// import { FieldConfig, FilterState } from "../../../components/filter/filterType";

import { FieldConfig, FilterState } from "../../../../../components/filter/filterType";

export const costFields: FieldConfig[] = [
  { name: 'Resource Number', type: 'number' },
  { name: 'Annual Compensation', type: 'number' },
  { name: 'Monthly Compensation', type: 'number' },
  { name: 'Weekly Compensation', type: 'number' },
  { name: 'Daily Compensation', type: 'number' },
  { name: 'Hourly Compensation', type: 'number' },
  { name: 'Start Date', type: 'date' },
  { name: 'End Date', type: 'date' },
  { name: 'Currency', type: 'text' }
];
export const skillFields: FieldConfig[] = [
  { name: 'Resource Type', type: 'text' },
  { name: 'Skill Name', type: 'text' },
  { name: 'Skill Level', type: 'enum' },
  { name: 'Experience', type: 'number' },
  { name: 'Start Date', type: 'date' },
];


export const getInitialStateForField = (
  fieldConfig: FieldConfig
): FilterState => {
  switch (fieldConfig.type) {
    case 'text':
      return { text: { option: 'Equals', value: '' } };
    case 'number':
      return { number: { option: 'Equals', value: {from :"", to: ""}} };
    case 'date':
      return { date: { option: 'Equals', value: {from :"", to: ""} }};
    case 'enum':
      return { enum: { option: 'Equals', value: [] } };
    default:
      return {};
  }
};