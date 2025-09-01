import { fiscalYears } from '../../../../common-utils';
import {
  FieldConfig,
  FilterSelectOption,
} from '../../../../consultant/types/account-filter';

const textfieldOptions: { label: string; value: string }[] = [
  { label: 'Contains', value: 'contains' },
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
];

const fiscalOptions: { label: string; value: string }[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Not-Equals', value: 'not_equals' },
  { label: 'In', value: 'in' },
];

const classificationOptions: { label: string; value: string }[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Not-Equals', value: 'not_equals' },
  { label: 'In', value: 'in' },
  { label: 'Is-Empty', value: 'is_empty' },
];

const fiscalYearOption = fiscalYears.map((year) => ({
  label: year.label,
  value: year.value,
}));

export const getUserGroupFilterFields = (): FieldConfig[] => [
  {
    label: 'Username',
    name: 'first_name',
    type: 'text',
    operatorOption: textfieldOptions,
  },
  {
    label: 'Email Address',
    name: 'email',
    type: 'text',
    operatorOption: textfieldOptions,
  },
  {
    label: 'Organisation Name',
    name: 'organization_name',
    type: 'text',
    operatorOption: textfieldOptions,
  },
];

export const getProjectFilterFields = (
  classificationOption: FilterSelectOption[],
  projectTypeOptions: FilterSelectOption[]
): FieldConfig[] => [
  {
    label: 'Account Name',
    name: 'account_name',
    type: 'text',
    operatorOption: textfieldOptions,
  },
  {
    label: 'Project Name',
    name: 'project_name',
    type: 'text',
    operatorOption: textfieldOptions,
  },
  {
    label: 'Project Code',
    name: 'project_code',
    type: 'text',
    operatorOption: textfieldOptions,
  },
  {
    label: 'Fiscal Year',
    name: 'fiscal_year',
    type: 'enumSelect',
    options: fiscalYearOption,
    operatorOption: fiscalOptions,
  },
  {
    label: 'Classification',
    name: 'classification',
    type: 'enumSelect',
    operatorOption: classificationOptions,
    options: classificationOption,
  },
  {
    label: 'Project Type',
    name: 'project_type_rid',
    type: 'enumSelect',
    options: projectTypeOptions,
    operatorOption: fiscalOptions,
  },
  {
    label: 'Project Point of Contact',
    name: 'project_point_contact',
    type: 'text',
    operatorOption: textfieldOptions,
  },
];
