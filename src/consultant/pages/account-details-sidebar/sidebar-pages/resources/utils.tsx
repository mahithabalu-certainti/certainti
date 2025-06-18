/* eslint-disable @typescript-eslint/no-explicit-any */
// import { FieldConfig, FilterState } from "../../../components/filter/filterType";

import {
  costStatusOptions,
  enumValueOptions,
  FieldConfig,
  FilterState,
  fiscalYears,
  resourceTypeOptions,
  statusOptions,
} from '../../components/filter/filterType';
import {
  effortNumberOptions,
  fiscalOptions,
  textOptions,
} from '../projects/utils';

const requiredFieldFilterOptionsForText: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
];

const requiredFieldFilterOptionsForEnum: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'In', value: 'in' },
];

export const getCostFilterFields = (
  currencyOptions: { option: string; value: string }[]
): FieldConfig[] => [
  // { name: 'Resource code', value: 'resource_code', type: 'textCostAndSkill', required: true, filterOptions: requiredFieldFilterOptionsForText },
  {
    name: 'Fiscal Year',
    value: 'fiscal_year',
    type: 'enum',
    options: fiscalYears,
    required: true,
    filterOptions: requiredFieldFilterOptionsForEnum,
  },
  // { name: 'Name', value: 'resource_name', type: 'textCostAndSkill' },
  // { name: 'Resource Type', value: 'resource_type', type: 'enum', required: true, options: resourceTypeOptions, filterOptions: requiredFieldFilterOptionsForEnum },
  {
    name: 'Effective From',
    value: 'effective_from',
    type: 'date',
    minDate: new Date('2000-01-01'),
    maxDate: new Date(),
  },
  {
    name: 'End Date',
    value: 'end_date',
    type: 'date',
    minDate: new Date('2000-01-01'),
    maxDate: new Date(),
  },
  {
    name: 'Currency',
    value: 'currency',
    type: 'enum',
    options: currencyOptions,
    operatorOption: fiscalOptions,
  },
  {
    name: 'Efforts in Hrs',
    value: 'effort_in_hrs',
    type: 'number',
    operatorOption: effortNumberOptions,
  },
  { name: 'Salary', value: 'Salary', type: 'number' },
  { name: 'Bonus', value: 'bonus', type: 'number' },
  { name: 'Insurance', value: 'insurance', type: 'number' },
  { name: 'Deductions', value: 'deductions', type: 'number' },
  { name: 'Cost', value: 'resource_cost', type: 'number' },
  // { name: 'Org Name', value: 'resource_orgname', type: 'textCostAndSkill' },
  // {
  //   name: 'Designation',
  //   value: 'resource_designation',
  //   type: 'textCostAndSkill',
  // },
  // { name: 'Role', value: 'resource_role', type: 'textCostAndSkill' },
  { name: 'Comments', value: 'comments', type: 'textCostAndSkill' },
  {
    name: 'Status',
    value: 'status',
    type: 'enum',
    options: costStatusOptions,
    operatorOption: fiscalOptions,
  },
  {
    name: 'Cost ID',
    value: 'r_number',
    type: 'textCostAndSkill',
    operatorOption: textOptions,
  },
  {
    name: 'Sort Options',
    value: 'sort_options',
    type: 'system-sort',
    options: [{ value: 'created_datetime_desc', option: 'Recently Created' }],
  },
];
export const getSkillFilterFields = (
  skillTypeOptions: any[],
  skillSubTypeOptions: any[]
): FieldConfig[] => {
  return [
    // { name: 'Resource code', value: 'resource_code', type: 'textCostAndSkill', required: true, filterOptions: requiredFieldFilterOptionsForText },
    // { name: 'Name', value: 'resource_name', type: 'textCostAndSkill' },
    // { name: 'Resource Type', value: 'resource_type', type: 'enum', required: true, options: resourceTypeOptions, filterOptions: requiredFieldFilterOptionsForEnum },
    {
      name: 'Effective From',
      value: 'start_date',
      type: 'date',
      minDate: new Date('1950-01-01'),
      maxDate: new Date(),
    },
    {
      name: 'Skill Type',
      value: 'skill_type_rid',
      type: 'enum',
      required: true,
      options: skillTypeOptions,
      filterOptions: requiredFieldFilterOptionsForEnum,
    },
    {
      name: 'Skill SubType',
      value: 'skill_subtype_rid',
      type: 'enum',
      required: true,
      options: skillSubTypeOptions,
      filterOptions: requiredFieldFilterOptionsForEnum,
      dependsOn: 'skill_type_rid', // This indicates it depends on skill_type
    },
    {
      name: 'Skill Level',
      value: 'skill_level',
      type: 'enum',
      options: enumValueOptions,
    },
    {
      name: 'Skill Details',
      value: 'skill_details',
      type: 'textCostAndSkill',
      required: true,
      filterOptions: requiredFieldFilterOptionsForText,
    },
    // { name: 'Org Name', value: 'resource_orgname', type: 'textCostAndSkill' },
    // { name: 'Designation', value: 'resource_designation', type: 'textCostAndSkill' },
    // { name: 'Role', value: 'resource_role', type: 'textCostAndSkill' },
    {
      name: 'Years of Experience',
      value: 'resource_total_experience',
      type: 'number',
    },
    { name: 'Skill ID', value: 'r_number', type: 'textCostAndSkill' },
    {
      name: 'Sort Options',
      value: 'sort_options',
      type: 'system-sort',
      options: [{ value: 'created_datetime_desc', option: 'Recently Created' }],
    },
  ];
};
export const resourceFilterFields = (
  country: { option: string; value: string }[],
  region: { option: string; value: string }[]
): FieldConfig[] => [
  {
    name: 'Resource Code',
    value: 'resource_code',
    type: 'text',
    required: true,
    filterOptions: requiredFieldFilterOptionsForText,
  },
  { name: 'Name', value: 'resource_name', type: 'text' },
  {
    name: 'Resource Type',
    value: 'resource_type',
    type: 'enum',
    required: true,
    options: resourceTypeOptions,
    filterOptions: requiredFieldFilterOptionsForEnum,
  },
  { name: 'Org Name', value: 'resource_orgname', type: 'text' },
  { name: 'Designation', value: 'resource_designation', type: 'text' },
  { name: 'Role', value: 'resource_role', type: 'text' },
  {
    name: 'Region',
    value: 'resource_region',
    type: 'enum',
    options: region,
    dependsOn: 'resource_country',
  },
  {
    name: 'Country',
    value: 'resource_country',
    type: 'enum',
    options: country,
  },
  { name: 'Total Project Hours', value: 'total_project_hours', type: 'number' },
  { name: 'Estimated R&D Hours', value: 'estimated_rd_hours', type: 'number' },
  {
    name: 'Status',
    value: 'resource_status',
    type: 'enum',
    required: true,
    options: statusOptions,
    filterOptions: requiredFieldFilterOptionsForEnum,
  },
  { name: 'Comments', value: 'comments', type: 'text' },
  { name: 'Resource ID', value: 'r_number', type: 'text' },
  {
    name: 'Sort Options',
    value: 'sort_options',
    type: 'system-sort',
    options: [{ value: 'created_datetime_desc', option: 'Recently Created' }],
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
export const formatDateToYYYYMMDD = (dateString?: string | null): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${year}-${month}-${day}`;
};

export const dateFormatToYYYYMMDD = (dateString?: string | null): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${year}-${month}-${day}`;
};

export const formatDateToMMDDYYYYWithTime = (
  dateString?: string | null
): string => {
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

export const formatDateToYYYYMMDDWithTime = (
  dateString?: string | null
): string => {
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

  return `${year}-${month}-${day}, ${formattedTime}`;
};
