import {
  costDisplay,
  getDateFormat,
  REGEX_PATTERNS,
  RESOURCE_REGEX,
  valueDisplay,
} from '../../../../../../common-utils';
import TextButton from '../../../../../../components/button/text-button';
import {
  DependencyRowData,
  ListOption,
  ListTableColumn,
} from '../../../../../../components/table/types';
import { FormFiscalDateType } from '../../../../../types';
import { ResourceCostList } from '../../../../../types/resource-cost';
import { DATE_CONFIG } from '../../../../resource-form/form-data';

const getFiscalYears = (range: number) => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: range }, (_, i) => {
    const year = currentYear - i;
    return { label: `FY-${year}`, value: year };
  });
};

const fiscalYearsCost = getFiscalYears(DATE_CONFIG.COST_FISCAL_YEARS_RANGE);

export const getResourceCostColumns = (
  currencyOptions: ListOption[],
  isFullTime: boolean,
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  accountInActive: boolean,
  handleAttachmentClick?: (rowId: string) => void,
  handleCreateNote?: (rowId: string) => void,
  resourceInActive?: boolean,
  attachmentCreateEnable?: boolean,
  handleGetFiscalYear?: (year: string) => void,
  fiscalDate?: FormFiscalDateType,
  isNoteCreateEnable?: boolean
): ListTableColumn<ResourceCostList>[] => [
  {
    id: 'fiscal_year',
    editId: 'fiscal_year',
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
    editable:
      permissionMap?.['fiscal_year']?.edit &&
      permissionMap?.['fiscal_year']?.read &&
      !accountInActive,
    hide:
      !permissionMap?.['fiscal_year']?.edit &&
      !permissionMap?.['fiscal_year']?.read,
    field: {
      type: 'select',
      required: true,
      placeholder: '',
      options: fiscalYearsCost,
      onChange: true,
      getFieldData: (rowData: DependencyRowData) => {
        handleGetFiscalYear?.(String(rowData.fiscal_year));
        return String(rowData.fiscal_year);
      },
      // Reset date fields when fiscal year changes
      resetDependentFields: ['effective_from', 'end_date'],
    },
  },
  {
    id: 'effective_from',
    editId: 'effective_from',
    sortId: 'effective_from',
    label: 'Effective Date',
    width: 160,
    sortable: true,

    render: (row: ResourceCostList) => (
      <span>{getDateFormat(row.effective_from as string) || '-'}</span>
    ),
    editable:
      permissionMap?.['effective_from']?.edit &&
      permissionMap?.['effective_from']?.read &&
      !accountInActive,
    hide:
      !permissionMap?.['effective_from']?.edit &&
      !permissionMap?.['effective_from']?.read,
    field: {
      type: 'date',
      required: false,
      placeholder: 'YYYY-MM-DD',
      dateConfig: {
        disableFutureDates: true,
        minDate: fiscalDate?.startMin,
        maxDate: fiscalDate?.startMax,
      },
      getFieldData: (rowData: DependencyRowData) => {
        handleGetFiscalYear?.(String(rowData.fiscal_year));
        return String(rowData.effective_from);
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
    editId: 'end_date',
    sortId: 'end_date',
    label: 'End Date',
    width: 160,
    sortable: true,

    render: (row: ResourceCostList) => (
      <span>{getDateFormat(row.end_date as string) || '-'}</span>
    ),
    editable:
      permissionMap?.['end_date']?.edit &&
      permissionMap?.['end_date']?.read &&
      !accountInActive,
    hide:
      !permissionMap?.['end_date']?.edit && !permissionMap?.['end_date']?.read,
    field: {
      type: 'date',
      required: false,
      placeholder: 'YYYY-MM-DD',
      dateConfig: {
        disableFutureDates: true,
        minDate: fiscalDate?.startMin,
        maxDate: fiscalDate?.endMax,
      },
      getFieldData: (rowData: DependencyRowData) => {
        handleGetFiscalYear?.(String(rowData.fiscal_year));
        return String(rowData.end_date);
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
    editId: 'currency_rid',
    sortId: 'currency',
    label: 'Currency',
    width: 130,
    sortable: true,
    editable:
      permissionMap?.['currency_rid']?.edit &&
      permissionMap?.['currency_rid']?.read &&
      !accountInActive,
    hide:
      !permissionMap?.['currency_rid']?.edit &&
      !permissionMap?.['currency_rid']?.read,
    field: {
      type: 'select',
      required: true,
      placeholder: '',
      options: currencyOptions,
    },
  },
  {
    id: 'effort_in_hrs',
    editId: 'effort_in_hrs',
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
    editable:
      permissionMap?.['effort_in_hrs']?.edit &&
      permissionMap?.['effort_in_hrs']?.read &&
      !accountInActive,
    hide:
      !permissionMap?.['effort_in_hrs']?.edit &&
      !permissionMap?.['effort_in_hrs']?.read,
    field: {
      type: 'text',
      required: true,
      formatCostNumber: true,
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
    editId: 'salary',
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
    editable:
      permissionMap?.['salary']?.edit &&
      permissionMap?.['salary']?.read &&
      isFullTime &&
      !accountInActive,
    hide: !permissionMap?.['salary']?.edit && !permissionMap?.['salary']?.read,
    field: {
      type: 'text',
      required: false,
      formatCostNumber: true,
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
    editId: 'resource_cost',
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
    editable:
      permissionMap?.['resource_cost']?.edit &&
      permissionMap?.['resource_cost']?.read &&
      !accountInActive,
    hide:
      !permissionMap?.['resource_cost']?.edit &&
      !permissionMap?.['resource_cost']?.read,
    field: {
      type: 'text',
      required: !isFullTime,
      formatCostNumber: true,
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
    editId: 'bonus',
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
    editable:
      permissionMap?.['bonus']?.edit &&
      permissionMap?.['bonus']?.read &&
      isFullTime &&
      !accountInActive,
    hide: !permissionMap?.['bonus']?.edit && !permissionMap?.['bonus']?.read,
    field: {
      type: 'text',
      required: false,
      formatCostNumber: true,
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
    editId: 'insurance',
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
    editable:
      permissionMap?.['insurance']?.edit &&
      permissionMap?.['insurance']?.read &&
      isFullTime &&
      !accountInActive,
    hide:
      !permissionMap?.['insurance']?.edit &&
      !permissionMap?.['insurance']?.read,
    field: {
      type: 'text',
      required: false,
      formatCostNumber: true,
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
    editId: 'deductions',
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
    editable:
      permissionMap?.['deductions']?.edit &&
      permissionMap?.['deductions']?.read &&
      !accountInActive,
    hide:
      !permissionMap?.['deductions']?.edit &&
      !permissionMap?.['deductions']?.read,
    field: {
      type: 'text',
      required: false,
      formatCostNumber: true,
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
    editId: 'comments',
    sortId: 'comments',
    label: 'Comments',
    width: 130,
    sortable: true,
    editable:
      permissionMap?.['comments']?.edit &&
      permissionMap?.['comments']?.read &&
      !accountInActive,
    hide:
      !permissionMap?.['comments']?.edit && !permissionMap?.['comments']?.read,
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
    hide:
      !permissionMap?.['status_rid']?.edit &&
      !permissionMap?.['status_rid']?.read,
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
    hide:
      !permissionMap?.['r_number']?.edit && !permissionMap?.['r_number']?.read,
  },
  {
    id: 'attachments',
    sortId: 'attachments',
    label: 'Attachments',
    width: 100,
    sortable: false,
    hide: !attachmentCreateEnable,
    render: (row) => (
      <TextButton
        label='Add'
        disabled={accountInActive ? accountInActive : resourceInActive}
        sx={{ width: '45px', minWidth: '45px', maxWidth: '45px', ml: 2.5 }}
        onClick={() => handleAttachmentClick?.(row.rid ?? '')}
      />
    ),
  },
  {
    id: 'notes',
    sortId: 'notes',
    label: 'Notes',
    width: 80,
    sortable: false,
    hide: !isNoteCreateEnable,
    sx: {
      textAlign: 'center',
    },
    render: (row) => (
      <TextButton
        label='Add'
        disabled={accountInActive ? accountInActive : resourceInActive}
        sx={{ width: '45px', minWidth: '45px', maxWidth: '45px' }}
        onClick={() => handleCreateNote?.(row.rid ?? '')}
      />
    ),
  },
];
