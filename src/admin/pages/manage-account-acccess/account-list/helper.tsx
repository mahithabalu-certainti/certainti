import {
  industryOperator,
  keyOptions,
} from '../../../../consultant/pages/account-list/helpers';
import { SelectOption } from '../../../../consultant/types';
import {
  FieldConfig,
  FilterSelectOption,
} from '../../../../consultant/types/account-filter';
import { textfieldOptions } from '../../manage-profile';

export const getManageAccountFilterFields = (
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
];
export const getManageUserListFilterFields = (): FieldConfig[] => [
  {
    label: 'User Name',
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
];
export const getManageGroupListFilterFields = (
  allGroupTypes: SelectOption[]
): FieldConfig[] => [
  {
    label: 'Group Name',
    name: 'group_name',
    type: 'text',
    operatorOption: textfieldOptions,
  },
  {
    label: 'Group Type',
    name: 'group_type',
    type: 'enumSelect',
    operatorOption: industryOperator,
    options: allGroupTypes,
  },
  {
    label: 'Number of Users',
    name: 'user_count',
    type: 'number',
  },
];
export const getManageProjectListFilterFields = (): FieldConfig[] => [
  {
    label: 'Project Code',
    name: 'project_code',
    type: 'text',
    operatorOption: textfieldOptions,
  },
  {
    label: 'Project Name',
    name: 'project_name',
    type: 'text',
    operatorOption: keyOptions,
  },
];

export const getUserListFilterFields = (): FieldConfig[] => [
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
