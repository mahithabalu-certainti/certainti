// import { FieldConfig, FilterState } from "../../../components/filter/filterType";

import { FieldConfig, FilterState } from "../../../../../components/filter/filterType";

export const costFields: FieldConfig[] = [
  { name: 'Resource Number', value: "resourceNumber", type: 'number' },
  { name: 'Annual', value: "annual", type: 'number' },
  { name: 'Semi-Annual', value: "semi_annual", type: 'number' },
  { name: 'Monthly', value: "monthly", type: 'number' },
  { name: 'Bi-Weekly', value: "bi-weekly", type: 'number' },
  { name: 'Weekly', value: "weekly", type: 'number' },
  { name: 'Daily', value: "daily", type: 'number' },
  { name: 'Hourly', value: "hourly", type: 'number' },
  { name: 'Start Date', value: "effective_date", type: 'date' },
  { name: 'End Date', value: "end_date", type: 'date' },
  { name: 'Currency', value: "currency", type: 'text' }
];
export const skillFields: FieldConfig[] = [
  { name: 'Resource Type', value: 'resourceType', type: 'text' },
  { name: 'Skill Name', value: "skillName", type: 'text' },
  { name: 'Skill Level', value: "skillLevel", type: 'enum' },
  { name: 'Experience', value: 'experience', type: 'number' },
  { name: 'Start Date', value: 'startDate', type: 'date' },
];


export const getInitialStateForField = (
  fieldConfig: FieldConfig
): FilterState | any => {
  switch (fieldConfig.type) {
    case 'text':
      return { text: { option: 'equals', value: '' } };
    case 'number':
      return { number: { option: 'equals', value: { from: "", to: "" } } };
    case 'date':
      return { date: { option: 'equals', value: { from: "", to: "" } } };
    case 'enum':
      return { enum: { option: 'equals', value: [] } };
    default:
      return {};
  }
};