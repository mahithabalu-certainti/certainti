/* eslint-disable @typescript-eslint/no-explicit-any */
// import { FieldConfig, FilterState } from "../../../components/filter/filterType";

import {
  FieldConfig,
  FilterState,
  fiscalYears,
} from '../../components/filter/filterType';
import { effortNumberOptions, fiscalOptions } from '../projects/utils';

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
  currencyOptions: { option: string; value: string }[],
  costStatusOptions: { option: string; value: string }[],
  resourceCostpermissionMap?: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => [
  // { name: 'Resource code', value: 'resource_code', type: 'textCostAndSkill', required: true, filterOptions: requiredFieldFilterOptionsForText },
  {
    name: 'Fiscal Year',
    value: 'fiscal_year',
    type: 'enum',
    options: fiscalYears,
    required: true,
    filterOptions: requiredFieldFilterOptionsForEnum,
    hide:
      !resourceCostpermissionMap?.['fiscal_year']?.read &&
      !resourceCostpermissionMap?.['fiscal_year']?.edit,
  },
  {
    name: 'Effective From',
    value: 'effective_from',
    type: 'date',
    minDate: new Date('2000-01-01'),
    maxDate: new Date(),
    hide:
      !resourceCostpermissionMap?.['effective_from']?.read &&
      !resourceCostpermissionMap?.['effective_from']?.edit,
  },
  {
    name: 'End Date',
    value: 'end_date',
    type: 'date',
    minDate: new Date('2000-01-01'),
    maxDate: new Date(),
    hide:
      !resourceCostpermissionMap?.['end_date']?.read &&
      !resourceCostpermissionMap?.['end_date']?.edit,
  },
  {
    name: 'Currency',
    value: 'currency',
    type: 'enum',
    options: currencyOptions,
    operatorOption: fiscalOptions,
    hide:
      !resourceCostpermissionMap?.['currency_rid']?.read &&
      !resourceCostpermissionMap?.['currency_rid']?.edit,
  },
  {
    name: 'Efforts in Hrs',
    value: 'effort_in_hrs',
    type: 'number',
    operatorOption: effortNumberOptions,
    hide:
      !resourceCostpermissionMap?.['effort_in_hrs']?.read &&
      !resourceCostpermissionMap?.['effort_in_hrs']?.edit,
  },
  {
    name: 'Salary',
    value: 'Salary',
    type: 'number',
    hide:
      !resourceCostpermissionMap?.['salary']?.read &&
      !resourceCostpermissionMap?.['salary']?.edit,
  },
  {
    name: 'Bonus',
    value: 'bonus',
    type: 'number',
    hide:
      !resourceCostpermissionMap?.['bonus']?.read &&
      !resourceCostpermissionMap?.['bonus']?.edit,
  },
  {
    name: 'Insurance',
    value: 'insurance',
    type: 'number',
    hide:
      !resourceCostpermissionMap?.['insurance']?.read &&
      !resourceCostpermissionMap?.['insurance']?.edit,
  },
  {
    name: 'Deductions',
    value: 'deductions',
    type: 'number',
    hide:
      !resourceCostpermissionMap?.['deductions']?.read &&
      !resourceCostpermissionMap?.['deductions']?.edit,
  },
  {
    name: 'Cost',
    value: 'resource_cost',
    type: 'number',
    hide:
      !resourceCostpermissionMap?.['resource_cost']?.read &&
      !resourceCostpermissionMap?.['resource_cost']?.edit,
  },
  {
    name: 'Comments',
    value: 'comments',
    type: 'textCostAndSkill',
    hide:
      !resourceCostpermissionMap?.['comments']?.read &&
      !resourceCostpermissionMap?.['comments']?.edit,
  },
  {
    name: 'Status',
    value: 'status_rid',
    type: 'enum',
    options: costStatusOptions,
    operatorOption: fiscalOptions,
    hide:
      !resourceCostpermissionMap?.['status_rid']?.read &&
      !resourceCostpermissionMap?.['status_rid']?.edit,
  },
  {
    name: 'Cost ID',
    value: 'r_number',
    type: 'textCostAndSkill',
    required: true,
    filterOptions: requiredFieldFilterOptionsForText,
    hide:
      !resourceCostpermissionMap?.['r_number']?.read &&
      !resourceCostpermissionMap?.['r_number']?.edit,
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
  skillSubTypeOptions: any[],
  skillLevelsOptions: { value: string; option: string }[],
  resourceSkillpermissionMap?: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => {
  return [
    {
      name: 'Effective From',
      value: 'start_date',
      type: 'date',
      minDate: new Date('1950-01-01'),
      maxDate: new Date(),
      hide:
        !resourceSkillpermissionMap?.['start_date']?.read &&
        !resourceSkillpermissionMap?.['start_date']?.edit,
    },
    {
      name: 'Skill Type',
      value: 'skill_type_rid',
      type: 'enum',
      required: true,
      options: skillTypeOptions,
      filterOptions: requiredFieldFilterOptionsForEnum,
      hide:
        !resourceSkillpermissionMap?.['skill_type_rid']?.read &&
        !resourceSkillpermissionMap?.['skill_type_rid']?.edit,
    },
    {
      name: 'Skill SubType',
      value: 'skill_subtype_rid',
      type: 'enum',
      required: true,
      options: skillSubTypeOptions,
      filterOptions: requiredFieldFilterOptionsForEnum,
      dependsOn: 'skill_type_rid',
      hide:
        !resourceSkillpermissionMap?.['skill_subtype_rid']?.read &&
        !resourceSkillpermissionMap?.['skill_subtype_rid']?.edit,
    },
    {
      name: 'Skill Level',
      value: 'skill_level_rid',
      type: 'enum',
      options: skillLevelsOptions,
      hide:
        !resourceSkillpermissionMap?.['skill_level_rid']?.read &&
        !resourceSkillpermissionMap?.['skill_level_rid']?.edit,
    },
    {
      name: 'Skill Details',
      value: 'skill_details',
      type: 'textCostAndSkill',
      required: true,
      filterOptions: requiredFieldFilterOptionsForText,
      hide:
        !resourceSkillpermissionMap?.['skill_details']?.read &&
        !resourceSkillpermissionMap?.['skill_details']?.edit,
    },
    {
      name: 'Skill ID',
      value: 'r_number',
      type: 'textCostAndSkill',
      required: true,
      filterOptions: requiredFieldFilterOptionsForText,
      hide:
        !resourceSkillpermissionMap?.['r_number']?.read &&
        !resourceSkillpermissionMap?.['r_number']?.edit,
    },
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
  region: { option: string; value: string }[],
  memoizedStatus: { option: string; value: string }[],
  resourceTypeOptions: { option: string; value: string }[],
  resourcepermissionMap?: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => [
  {
    name: 'Resource Code',
    value: 'resource_code',
    type: 'text',
    required: true,
    filterOptions: requiredFieldFilterOptionsForText,
    hide:
      !resourcepermissionMap?.['resource_code']?.read &&
      !resourcepermissionMap?.['resource_code']?.edit,
  },
  {
    name: 'Name',
    value: 'resource_name',
    type: 'text',
    hide:
      !resourcepermissionMap?.['resource_name']?.read &&
      !resourcepermissionMap?.['resource_name']?.edit,
  },
  {
    name: 'Resource Type',
    value: 'resource_type_rid',
    type: 'enum',
    required: true,
    options: resourceTypeOptions,
    filterOptions: requiredFieldFilterOptionsForEnum,
    hide:
      !resourcepermissionMap?.['resource_type_rid']?.read &&
      !resourcepermissionMap?.['resource_type_rid']?.edit,
  },
  {
    name: 'Org Name',
    value: 'resource_orgname',
    type: 'text',
    hide:
      !resourcepermissionMap?.['resource_orgname']?.read &&
      !resourcepermissionMap?.['resource_orgname']?.edit,
  },
  {
    name: 'Designation',
    value: 'resource_designation',
    type: 'text',
    hide:
      !resourcepermissionMap?.['resource_designation']?.read &&
      !resourcepermissionMap?.['resource_designation']?.edit,
  },
  {
    name: 'Role',
    value: 'resource_role',
    type: 'text',
    hide:
      !resourcepermissionMap?.['resource_role']?.read &&
      !resourcepermissionMap?.['resource_role']?.edit,
  },
  {
    name: 'Region',
    value: 'region_rid',
    type: 'enum',
    options: region,
    dependsOn: 'country_rid',
    hide:
      !resourcepermissionMap?.['region_rid']?.read &&
      !resourcepermissionMap?.['region_rid']?.edit,
  },
  {
    name: 'Country',
    value: 'country_rid',
    type: 'enum',
    options: country,
    hide:
      !resourcepermissionMap?.['country_rid']?.read &&
      !resourcepermissionMap?.['country_rid']?.edit,
  },
  {
    name: 'Total Project Hours',
    value: 'total_project_hours',
    type: 'number',
    hide:
      !resourcepermissionMap?.['total_project_hours']?.read &&
      !resourcepermissionMap?.['total_project_hours']?.edit,
  },
  {
    name: 'Estimated R&D Hours',
    value: 'estimated_rd_hours',
    type: 'number',
    hide:
      !resourcepermissionMap?.['estimated_rd_hours']?.read &&
      !resourcepermissionMap?.['estimated_rd_hours']?.edit,
  },
  {
    name: 'Status',
    value: 'status_rid',
    type: 'enum',
    required: true,
    options: memoizedStatus,
    filterOptions: requiredFieldFilterOptionsForEnum,
    hide:
      !resourcepermissionMap?.['status_rid']?.read &&
      !resourcepermissionMap?.['status_rid']?.edit,
  },
  {
    name: 'Comments',
    value: 'comments',
    type: 'text',
    hide:
      !resourcepermissionMap?.['comments']?.read &&
      !resourcepermissionMap?.['comments']?.edit,
  },
  {
    name: 'Resource ID',
    value: 'r_number',
    type: 'text',
    required: true,
    filterOptions: requiredFieldFilterOptionsForText,
    hide:
      !resourcepermissionMap?.['r_number']?.read &&
      !resourcepermissionMap?.['r_number']?.edit,
  },
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
