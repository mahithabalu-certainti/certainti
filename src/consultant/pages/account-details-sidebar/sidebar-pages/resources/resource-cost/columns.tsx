import { costDisplay, valueDisplay } from '../../../../../../common-utils';
import { ResourceCostList } from '../../../../../types/resource-cost';
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
}

export const resourceCostColumns: ResourceCostTableColumn<ResourceCostList>[] =
  [
    {
      id: 'account_name',
      sortId: 'account_name',
      label: 'Account Name',
      width: 130,
      sortable: false,

      sticky: true,
      sx: {
        position: 'sticky',
        left: 0,
        background: '#fff',
        zIndex: 10,
        borderRight: '1px solid #CBD6E2 !important',
        borderBottom: '1px solid #CBD6E2 !important',
      },
    },
    {
      id: 'resource_code',
      sortId: 'resource_code',
      label: 'Resource Code',
      width: 130,
    },
    {
      id: 'fiscal_year',
      sortId: 'fiscal_year',
      label: 'Fiscal Year',
      width: 130,
      sortable: true,
      sx: {
        textAlign: 'right',
      },
    },
    {
      id: 'resource_name',
      sortId: 'resource_name',
      label: 'Name',
      width: 160,
      sortable: false,
    },
    {
      id: 'resource_type',
      sortId: 'resource_type',
      label: 'Resource Type',
      width: 130,
      sortable: false,
    },
    {
      id: 'effective_from',
      sortId: 'effective_from',
      label: 'Effective From',
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
      id: 'resource_orgname',
      sortId: 'resource_orgname',
      label: 'Org Name',
      width: 130,
      sortable: false,
    },
    {
      id: 'resource_designation',
      sortId: 'resource_designation',
      label: 'Designation',
      width: 130,
      sortable: false,
    },
    {
      id: 'resource_role',
      sortId: 'resource_role',
      label: 'Role',
      width: 130,
      sortable: false,
    },
    {
      id: 'comments',
      sortId: 'comments',
      label: 'Comments',
      width: 130,
      sortable: true,
    },
    {
      id: 'status',
      sortId: 'status',
      label: 'Status',
      width: 130,
      sortable: true,
    },
    {
      id: 'r_number',
      sortId: 'resource_cost_number',
      label: 'Cost ID',
      width: 130,
      sortable: true,
    },
  ];
