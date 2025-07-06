import {
  costDisplay,
  REGEX_PATTERNS,
  RESOURCE_REGEX,
  valueDisplay,
} from '../../../../../../common-utils';
import {
  ListOption,
  ListTableColumn,
} from '../../../../../../components/table/types';
import { ResourceCostList } from '../../../../../types/resource-cost';
import {
  DATE_CONFIG,
  getDateConstraints,
} from '../../../../resource-form/form-data';
import { dateFormatToYYYYMMDD } from '../utils';

const getFiscalYears = (range: number) => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: range }, (_, i) => {
    const year = currentYear - i;
    return { label: `FY-${year}`, value: year };
  });
};

const fiscalYearsCost = getFiscalYears(DATE_CONFIG.TOTAL_YEARS);
const { currentDate, previousDate } = getDateConstraints(
  DATE_CONFIG.COST_FISCAL_YEARS_RANGE
);

export const getResourceCostColumns = (
  currencyOptions: ListOption[],
  isFullTime: boolean
): ListTableColumn<ResourceCostList>[] => [
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
      // Reset date fields when fiscal year changes
      resetDependentFields: ['effective_from', 'end_date'],
    },
  },
  {
    id: 'effective_from',
    sortId: 'effective_from',
    label: 'Effective Date',
    width: 160,
    sortable: true,

    render: (row: ResourceCostList) => (
      <span>{dateFormatToYYYYMMDD(row.effective_from as string) || '-'}</span>
    ),
    editable: true,
    field: {
      type: 'date',
      required: false,
      placeholder: 'YYYY-MM-DD',
      dateConfig: {
        fiscalYearValidation: true,
        disableFutureDates: true,
        maxDate: previousDate,
      },
      resetDependentFields: ['end_date'],
      dependencies: [
        {
          dependsOn: ['fiscal_year'],
          condition: (value) => !value,
          action: 'disabled',
          message: 'Please select a fiscal year first',
        },
        {
          dependsOn: ['end_date'],
          action: 'enable',
          condition: (value) => !value,
          message: '',
        },
      ],
    },
  },
  {
    id: 'end_date',
    sortId: 'end_date',
    label: 'End Date',
    width: 160,
    sortable: true,

    render: (row: ResourceCostList) => (
      <span>{dateFormatToYYYYMMDD(row.end_date as string) || '-'}</span>
    ),
    editable: true,
    field: {
      type: 'date',
      required: false,
      placeholder: 'YYYY-MM-DD',
      dateConfig: {
        fiscalYearValidation: true,
        disableFutureDates: true,
        maxDate: currentDate,
      },
      dependencies: [
        {
          dependsOn: ['fiscal_year', 'effective_from'],
          condition: (_, rowData) => {
            const fiscalYear = rowData.fiscal_year;
            const startDate = rowData.effective_from;
            return !fiscalYear || !startDate;
          },
          action: 'disabled',
          message: '',
        },
      ],
    },
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
    editable: true,
    field: {
      type: 'number',
      required: true,
      placeholder: 'Enter Effort In Hrs',
      validation: [
        {
          regex: REGEX_PATTERNS.EFFORTS_NUMBER,
          errorMessage:
            'Only positive numbers allowed, up to 16 digits and 2 decimal places',
        },
      ],
    },
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
    editable: isFullTime ? true : false,
    field: {
      type: 'number',
      required: false,
      placeholder: 'Enter Salary',
      validation: [
        {
          regex: REGEX_PATTERNS.EFFORTS_NUMBER,
          errorMessage:
            'Only positive numbers allowed, up to 16 digits and 2 decimal places',
        },
      ],
      dependencies: [
        {
          dependsOn: ['resource_cost'],
          action: 'enable',
          condition: (value) => !value,
          message: '',
        },
      ],
    },
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
    editable: true,
    field: {
      type: 'number',
      required: !isFullTime,
      placeholder: 'Enter Cost',
      validation: [
        {
          regex: REGEX_PATTERNS.EFFORTS_NUMBER,
          errorMessage:
            'Only positive numbers allowed, up to 16 digits and 2 decimal places',
        },
      ],
      dependencies: [
        {
          dependsOn: ['salary'],
          action: 'required',
          condition: (value) => !value,
          message: '',
        },
      ],
    },
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
    editable: isFullTime ? true : false,
    field: {
      type: 'number',
      required: false,
      placeholder: 'Enter Bonus',
      validation: [
        {
          regex: REGEX_PATTERNS.EFFORTS_NUMBER,
          errorMessage:
            'Only positive numbers allowed, up to 16 digits and 2 decimal places',
        },
      ],
    },
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
    editable: isFullTime ? true : false,
    field: {
      type: 'number',
      required: false,
      placeholder: 'Enter Insurance',
      validation: [
        {
          regex: REGEX_PATTERNS.EFFORTS_NUMBER,
          errorMessage:
            'Only positive numbers allowed, up to 16 digits and 2 decimal places',
        },
      ],
    },
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
    editable: true,
    field: {
      type: 'number',
      required: false,
      placeholder: 'Enter Deductions',
      validation: [
        {
          regex: REGEX_PATTERNS.EFFORTS_NUMBER,
          errorMessage:
            'Only positive numbers allowed, up to 16 digits and 2 decimal places',
        },
      ],
    },
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
