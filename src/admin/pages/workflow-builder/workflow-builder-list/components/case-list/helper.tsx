import { getFiscalYears } from '../../../../../../common-utils';
import { FieldConfig } from '../../../../../../consultant/pages/account-details-sidebar/components/filter/filterType';

const textOptions: { option: string; value: string }[] = [
  { option: 'Contains', value: 'contains' },
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
];

const enumOperator: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'In', value: 'in' },
];

const minYear = 1950;
const currentYear = new Date().getFullYear();
const fiscalYears = getFiscalYears(currentYear - minYear + 1);

export const getGlobalCasesFilterFields = (
  caseTypeOptions: { label: string; value: string }[],
  caseOwnerOptions: { label: string; value: string }[],
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  accountPermissionMap: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => {
  return [
    {
      name: 'Case ID',
      value: 'r_number',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['r_number']?.edit &&
        !permissionMap?.['r_number']?.read,
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
      name: 'Filing Type',
      value: 'filing_type_name',
      type: 'enum',
      options: caseTypeOptions.map((opt) => ({
        option: opt.label,
        value: opt.value,
      })),
      operatorOption: enumOperator,
      hide:
        !permissionMap?.['filing_type_rid']?.edit &&
        !permissionMap?.['filing_type_rid']?.read,
    },
    {
      name: 'Case Name',
      value: 'case_name',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['case_name']?.edit &&
        !permissionMap?.['case_name']?.read,
    },
    {
      name: 'Fiscal Year',
      value: 'fiscal_year',
      type: 'enum',
      options: fiscalYears.map((y) => ({ option: y.label, value: y.value })),
      operatorOption: enumOperator,
      hide:
        !permissionMap?.['fiscal_year']?.edit &&
        !permissionMap?.['fiscal_year']?.read,
    },
    {
      name: 'Case Owner',
      value: 'case_owner_name',
      type: 'enum',
      options: caseOwnerOptions.map((opt) => ({
        option: opt.label,
        value: opt.value,
      })),
      operatorOption: enumOperator,
      hide:
        !permissionMap?.['case_owner_rid']?.edit &&
        !permissionMap?.['case_owner_rid']?.read,
    },
  ];
};

export const generateCaseNamePrefixValue = (
  accName: string,
  country: string,
  year: string
) => {
  return `${accName}-${country}-${year}-`;
};
