/* eslint-disable @typescript-eslint/no-explicit-any */
// import { FieldConfig, FilterState } from "../../../components/filter/filterType";

import { FieldConfig, FilterState } from '../../components/filter/filterType';

export const costFilterFields: FieldConfig[] = [
  // { name: 'Resource Cost Number', value: 'resource_cost_number', type: 'textCostAndSkill' },
  { name: 'Currency', value: 'currency', type: 'textCostAndSkill' },
  { name: 'Start Date', value: 'effective_date', type: 'date' },
  { name: 'End Date', value: 'end_date', type: 'date' },
  { name: 'Hourly', value: 'hourly', type: 'number' },
  { name: 'Daily', value: 'daily', type: 'number' },
  { name: 'Weekly', value: 'weekly', type: 'number' },
  { name: 'Bi-Weekly', value: 'bi-weekly', type: 'number' },
  { name: 'Monthly', value: 'monthly', type: 'number' },
  { name: 'Semi-Annual', value: 'semi_annual', type: 'number' },
  { name: 'Annual', value: 'annual', type: 'number' },
];
export const skillFilterFields: FieldConfig[] = [
  // { name: 'Resource Type', value: 'resource_type', type: 'textCostAndSkill' },
  { name: 'Start Date', value: 'start_date', type: 'date' },
  { name: 'Skill Name', value: 'skill_name', type: 'textCostAndSkill' },
  { name: 'Skill Level', value: 'skill_level', type: 'enum' },
  { name: 'Experience', value: 'years_of_experience', type: 'number' },
];
export const resourceFilterFields: FieldConfig[] = [
  { name: 'Resource Number', value: 'r_number', type: 'text' },
  { name: 'Resource Ref Id', value: 'resource_ref_id', type: 'text' },
  { name: 'Resource Full Name', value: 'resource_fullname', type: 'text' },
  { name: 'Resource Type', value: 'resource_type', type: 'text' },
  { name: 'Status', value: 'resource_status', type: 'text' },
];
export const getInitialStateForField = (
  fieldConfig: FieldConfig
): FilterState | any => {
  switch (fieldConfig.type) {
    case 'text':
      return { text: { option: 'equals', value: '' } };
    case 'textCostAndSkill':
      return { textCostAndSkill: { option: 'equals', value: '' } };
    case 'number':
      return { number: { option: 'equals', value: { from: '', to: '' } } };
    case 'date':
      return { date: { option: 'equals', value: { from: '', to: '' } } };
    case 'enum':
      return { enum: { option: 'equals', value: [] } };
    default:
      return {};
  }
};
