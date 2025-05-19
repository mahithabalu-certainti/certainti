/* eslint-disable @typescript-eslint/no-explicit-any */
// import { FieldConfig, FilterState } from "../../../components/filter/filterType";

import {
  enumValueOptions,
  FieldConfig,
  FilterState,
  resourceTypeOptions,
  statusOptions,
} from '../../components/filter/filterType';

export const getCostFilterFields = (currencyOptions: { option: string; value: string }[]): FieldConfig[] => [
  // { name: 'Resource Cost Number', value: 'resource_cost_number', type: 'textCostAndSkill' },
  { name: 'Currency', value: 'currency', type: 'currencySelect', options: currencyOptions },
  { name: 'Start Date', value: 'effective_date', type: 'date' },
  { name: 'End Date', value: 'end_date', type: 'date' },
  { name: 'Hourly', value: 'hourly', type: 'number' },
  { name: 'Daily', value: 'daily', type: 'number' },
  { name: 'Weekly', value: 'weekly', type: 'number' },
  { name: 'Bi-Weekly', value: 'bi-weekly', type: 'number' },
  { name: 'Monthly', value: 'monthly', type: 'number' },
  // { name: 'Semi-Annual', value: 'semi_annual', type: 'number' },
  { name: 'Annual', value: 'annual', type: 'number' },
];
export const getSkillFilterFields = (
  skillTypeOptions: any[],
  skillSubTypeOptions: any[]
): FieldConfig[] => {
  return [
    // { name: 'Resource Type', value: 'resource_type', type: 'textCostAndSkill' },
    { name: 'Start Date', value: 'start_date', type: 'date' },
    {
      name: 'Skill Type',
      value: 'skill_type_rid',
      type: 'enum',
      options: skillTypeOptions
    },
    {
      name: 'Skill SubType',
      value: 'skill_subtype_rid',
      type: 'enum',
      options: skillSubTypeOptions,
      dependsOn: 'skill_type_rid'  // This indicates it depends on skill_type
    },
    {
      name: 'Skill Level',
      value: 'skill_level',
      type: 'enum',
      options: enumValueOptions,
    },
  ];
};
export const resourceFilterFields: FieldConfig[] = [
  { name: 'Resource Code', value: 'resource_code', type: 'text' },
  { name: 'Name', value: 'resource_name', type: 'text' },
  {
    name: 'Resource Type',
    value: 'resource_type',
    type: 'enum',
    options: resourceTypeOptions,
  },
  { name: 'Designation', value: 'resource_designation', type: 'text' },
  { name: 'Country', value: 'country', type: 'text' },
  { name: 'Region', value: 'region', type: 'text' },
  {
    name: 'Status',
    value: 'resource_status',
    type: 'enum',
    options: statusOptions,
  },
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
    case 'currencySelect':
      return { currencySelect: { option: 'equals', value: [] } };
    case 'select':
      return { status: { option: 'equals', value: 'active' } };
    default:
      return {};
  }
};

export const formatDateToMMDDYYYY = (dateString?: string | null): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
};

export const formatDateToMMDDYYYYWithTime = (dateString?: string | null): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  // Date parts
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  // Time parts (12-hour format with AM/PM)
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours || 12; // Convert "0" hours to "12"

  const formattedTime = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;

  return `${month}/${day}/${year}, ${formattedTime}`;
};