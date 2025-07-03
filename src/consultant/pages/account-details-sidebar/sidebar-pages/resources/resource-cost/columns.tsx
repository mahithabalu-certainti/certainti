import {
  costDisplay,
  RESOURCE_REGEX,
  valueDisplay,
} from '../../../../../../common-utils';
import {
  ListOption,
  TableField,
} from '../../../../../../components/table/types';
import { ResourceCostList } from '../../../../../types/resource-cost';
import { DATE_CONFIG } from '../../../../resource-form/form-data';
import { dateFormatToYYYYMMDD } from '../utils';

export interface ResourceCostTableColumn<T> {
  id: string;
  label: string;
  width: string | number;
  sortId: string;
  sortable?: boolean;
  sticky?: boolean;
  sx?: React.CSSProperties;
  render?: (row: T) => React.ReactNode;
  editable?: boolean;
  field?: TableField;
}

const getFiscalYears = (range: number) => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: range }, (_, i) => {
    const year = currentYear - i;
    return { label: `FY-${year}`, value: year };
  });
};

const fiscalYearsCost = getFiscalYears(DATE_CONFIG.TOTAL_YEARS);

export const getResourceCostColumns = (
  currencyOptions: ListOption[]
): ResourceCostTableColumn<ResourceCostList>[] => [
  {
    id: 'fiscal_year',
    sortId: 'fiscal_year',
    label: 'Fiscal Year',
    width: 130,
    sortable: true,
    sticky: true,
    sx: {
      textAlign: 'left',
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2 !important',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row: ResourceCostList) => {
      if (typeof row.fiscal_year === 'number') {
        return `FY-${row.fiscal_year}`;
      }
      return '-';
    },
    editable: true,
    field: {
      type: 'select',
      required: true,
      placeholder: '',
      options: fiscalYearsCost,
    },
  },
  {
    id: 'effective_from',
    sortId: 'effective_from',
    label: 'Effective Date',
    width: 130,
    sortable: true,

    render: (row: ResourceCostList) => (
      <span>{dateFormatToYYYYMMDD(row.effective_from as string) || '-'}</span>
    ),
  },
  {
    id: 'end_date',
    sortId: 'end_date',
    label: 'End Date',
    width: 130,
    sortable: true,

    render: (row: ResourceCostList) => (
      <span>{dateFormatToYYYYMMDD(row.end_date as string) || '-'}</span>
    ),
  },
  {
    id: 'currency_code',
    sortId: 'currency',
    label: 'Currency',
    width: 130,
    sortable: true,
    editable: true,
    field: {
      type: 'select',
      required: true,
      placeholder: '',
      options: currencyOptions,
    },
  },
  {
    id: 'effort_in_hrs',
    sortId: 'effort_in_hrs',
    label: 'Effort in Hrs',
    width: 180,
    sortable: true,
    sx: {
      textAlign: 'right',
    },
    render: (row: ResourceCostList) => (
      <span>{valueDisplay(row.effort_in_hrs)}</span>
    ),
  },
  {
    id: 'salary',
    sortId: 'salary',
    label: 'Salary',
    width: 180,
    sortable: true,
    sx: {
      textAlign: 'right',
    },
    render: (row: ResourceCostList) => (
      <span>{costDisplay(row.salary, row.currency_symbol)}</span>
    ),
  },
  {
    id: 'bonus',
    sortId: 'bonus',
    label: 'Bonus',
    width: 200,
    sortable: true,
    sx: {
      textAlign: 'right',
    },
    render: (row: ResourceCostList) => (
      <span>{costDisplay(row.bonus, row.currency_symbol)}</span>
    ),
  },
  {
    id: 'insurance',
    sortId: 'insurance',
    label: 'Insurance',
    width: 180,
    sortable: true,
    sx: {
      textAlign: 'right',
    },
    render: (row: ResourceCostList) => (
      <span>{costDisplay(row.insurance, row.currency_symbol)}</span>
    ),
  },
  {
    id: 'deductions',
    sortId: 'deductions',
    label: 'Deductions',
    width: 160,
    sortable: true,
    sx: {
      textAlign: 'right',
    },
    render: (row: ResourceCostList) => (
      <span>{costDisplay(row.deductions, row.currency_symbol)}</span>
    ),
  },
  {
    id: 'resource_cost',
    sortId: 'resource_cost',
    label: 'Cost',
    width: 180,
    sortable: true,
    sx: {
      textAlign: 'right',
    },
    render: (row: ResourceCostList) => (
      <span>{costDisplay(row.resource_cost, row.currency_symbol)}</span>
    ),
  },
  {
    id: 'comments',
    sortId: 'comments',
    label: 'Comments',
    width: 130,
    sortable: true,
    editable: true,
    field: {
      type: 'textarea',
      required: false,
      placeholder: 'Enter Comments',
      validation: [
        {
          regex: RESOURCE_REGEX.DESCRIPTION,
          errorMessage: 'Max length exceeded.',
        },
      ],
    },
  },
  {
    id: 'status_name',
    sortId: 'status_name',
    label: 'Status',
    width: 130,
    sortable: true,
    render: (row: ResourceCostList) => (
      <span
        className={`${
          row.status_name === 'Active'
            ? 'text-[#199806]'
            : row.status_name === 'In-Active'
              ? 'text-[#f44336] '
              : ''
        }`}
      >
        {row.status_name || '-'}
      </span>
    ),
  },
  {
    id: 'r_number',
    sortId: 'resource_cost_number',
    label: 'Cost ID',
    width: 130,
    sortable: true,
  },
];
