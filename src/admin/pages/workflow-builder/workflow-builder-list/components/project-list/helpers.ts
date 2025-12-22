import { FieldConfig } from '../../../../../../consultant/pages/account-details-sidebar/components/filter/filterType';
import {
  fiscalYearOptions,
  textOptions,
  fiscalOptions,
  nonMadatoryOptions,
} from '../../../../../../consultant/pages/account-details-sidebar/sidebar-pages/projects/utils';

export const getAllProjectFilterFields = (
  projectPermissionMap?: Record<string, { read: boolean; edit: boolean }>,
  accountPermissionMap?: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => [
  {
    name: 'Project Code',
    value: 'project_code',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !projectPermissionMap?.['project_code']?.read &&
      !projectPermissionMap?.['project_code']?.edit,
  },
  {
    name: 'Name',
    value: 'project_name',
    type: 'text',
    operatorOption: nonMadatoryOptions,
    hide:
      !projectPermissionMap?.['project_name']?.read &&
      !projectPermissionMap?.['project_name']?.edit,
  },
  {
    name: 'Account Name',
    value: 'account_name',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !accountPermissionMap?.['account_name']?.read &&
      !accountPermissionMap?.['account_name']?.edit,
  },
  {
    name: 'Fiscal Year',
    value: 'fiscal_year',
    type: 'enum',
    options: fiscalYearOptions,
    operatorOption: fiscalOptions,
    hide:
      !projectPermissionMap?.['fiscal_year']?.read &&
      !projectPermissionMap?.['fiscal_year']?.edit,
  },
  {
    name: 'Project ID',
    value: 'r_number',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !projectPermissionMap?.['r_number']?.read &&
      !projectPermissionMap?.['r_number']?.edit,
  },
  {
    name: 'Sort Options',
    value: 'sort_options',
    type: 'system-sort',
    options: [{ value: 'created_datetime_desc', option: 'Recently Created' }],
  },
];
