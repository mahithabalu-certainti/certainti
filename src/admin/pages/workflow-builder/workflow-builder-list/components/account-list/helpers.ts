import {
  FieldConfig,
  FilterSelectOption,
} from '../../../../../../consultant/types/account-filter';

export const keyOptions: { label: string; value: string }[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
  { label: 'Contains', value: 'contains' },
  { label: 'Is Empty', value: 'is_empty' },
];

const textfieldOptions: { label: string; value: string }[] = [
  { label: 'Contains', value: 'contains' },
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
];

export const industryOperator: { label: string; value: string }[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
  { label: 'In', value: 'in' },
];

export const getAccountFilterFields = (
  countryOptions: FilterSelectOption[],
  industryOptions: FilterSelectOption[],
  permissionMap?: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => [
  {
    label: 'Account Name',
    name: 'account_name',
    type: 'text',
    operatorOption: textfieldOptions,
    hide:
      !permissionMap?.['account_name']?.read &&
      !permissionMap?.['account_name']?.edit,
  },
  {
    label: 'Industry',
    name: 'industry',
    type: 'enumSelect',
    options: industryOptions,
    operatorOption: industryOperator,
    hide:
      !permissionMap?.['industry_rid']?.read &&
      !permissionMap?.['industry_rid']?.edit,
  },
  {
    label: 'Country',
    name: 'country',
    type: 'enumSelect',
    options: countryOptions,
    hide:
      !permissionMap?.['country_rid']?.read &&
      !permissionMap?.['country_rid']?.edit,
  },
  {
    label: 'Account ID',
    name: 'account_number',
    type: 'text',
    operatorOption: textfieldOptions,
    hide:
      !permissionMap?.['r_number']?.read && !permissionMap?.['r_number']?.edit,
  },
];
