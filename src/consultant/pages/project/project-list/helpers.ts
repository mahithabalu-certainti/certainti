import { FilterSelectOption } from '../../../types/account-filter';
import { FieldConfig } from '../../account-details-sidebar/components/filter/filterType';
import {
  // dateOptions,
  enumOptions,
  fiscalYearOption,
  numberOptions,
  textOptions,
  fiscalOptions,
  nonMadatoryOptions,
} from '../../account-details-sidebar/sidebar-pages/projects/utils';

export const getAllProjectFilterFields = (
  classificationOption: FilterSelectOption[],
  projectTypeOptions: { option: string; value: string }[],
  statusOptions: { option: string; value: string }[]
): FieldConfig[] => [
  // Text fields

  {
    name: 'Project Code',
    value: 'project_code',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Name',
    value: 'project_name',
    type: 'text',
    operatorOption: nonMadatoryOptions,
  },
  {
    name: 'Project Type',
    value: 'project_type_rid',
    type: 'enum',
    options: projectTypeOptions,
    operatorOption: fiscalOptions,
  },
  {
    name: 'Account Name',
    value: 'account_name',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Fiscal Year',
    value: 'fiscal_year',
    type: 'enum',
    options: fiscalYearOption,
    operatorOption: fiscalOptions,
  },
  {
    name: 'Project Classification',
    value: 'classification_name',
    type: 'enum',
    options: classificationOption.map((item) => ({
      option: item.label,
      value: item.value,
    })),
    operatorOption: enumOptions,
  },
  {
    name: 'Customer Group',
    value: 'project_client_group',
    type: 'text',
    operatorOption: nonMadatoryOptions,
  },
  {
    name: 'Project Group',
    value: 'project_group',
    type: 'text',
    operatorOption: nonMadatoryOptions,
  },
  {
    name: 'Project Effort (Hours)',
    value: 'total_effort',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Project Cost',
    value: 'total_cost',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'FTE Cost',
    value: 'total_fte_cost',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'SubCon Cost',
    value: 'total_sub_con_cost',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Non-Labor Cost',
    value: 'total_non_labor_cost',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Assessment Status',
    value: 'status_rid',
    type: 'enum',
    options: statusOptions,
    operatorOption: enumOptions,
  },
  {
    name: 'QRE %',
    value: 'qre',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'QRE',
    value: 'qualified_research_expenditure',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Project Point of Contact',
    value: 'project_point_of_contact',
    type: 'text',
    operatorOption: nonMadatoryOptions,
  },
  {
    name: 'Technical Point of Contact',
    value: 'technical_point_of_contact',
    type: 'text',
    operatorOption: nonMadatoryOptions,
  },
  {
    name: 'Comments',
    value: 'comments',
    type: 'text',
    operatorOption: nonMadatoryOptions,
  },
  {
    name: 'Last Modified',
    value: 'modified_datetime',
    type: 'date',
  },
  {
    name: 'Project ID',
    value: 'r_number',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Sort Options',
    value: 'sort_options',
    type: 'system-sort',
    options: [{ value: 'createdAt_desc', option: 'Recently Created' }],
  },
];
