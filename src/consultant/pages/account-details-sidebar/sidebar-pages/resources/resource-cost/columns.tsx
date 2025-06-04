import { ResourceCostList } from '../../../../../types/resource-cost';
import { formatDateToYYYYMMDD } from '../utils';

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

const costDisplay = (cost: string | number | null | undefined) => {
  if (cost === null || cost === undefined) return '-';
  const formattedCost = Number(cost).toLocaleString('en-US', {
    minimumFractionDigits: 2,
  });
  return <>{formattedCost}</>;
};

export const resourceCostColumns: ResourceCostTableColumn<ResourceCostList>[] =
  [
    {
      id: 'resource_code',
      sortId: 'resource_code',
      label: 'Resource Code',
      width: 130,
      sortable: true,

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
      sortable: true,
    },
    {
      id: 'effective_date',
      sortId: 'effective_date',
      label: 'Effective From',
      width: 130,
      sortable: true,

      render: (row: ResourceCostList) => (
        <span>{formatDateToYYYYMMDD(row.effective_date as string) || '-'}</span>
      ),
    },
    {
      id: 'end_date',
      sortId: 'end_date',
      label: 'End Date',
      width: 130,
      sortable: true,

      render: (row: ResourceCostList) => (
        <span>{formatDateToYYYYMMDD(row.end_date as string) || '-'}</span>
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
      id: 'annual_cost',
      sortId: 'annual_cost',
      label: 'Annual Compensation',
      width: 180,
      sortable: true,
      sx: {
        textAlign: 'right',
      },
      render: (row: ResourceCostList) => (
        <span>{costDisplay(row.annual_cost)}</span>
      ),
    },
    {
      id: 'monthly_cost',
      sortId: 'monthly_cost',
      label: 'Monthly Compensation',
      width: 180,
      sortable: true,
      sx: {
        textAlign: 'right',
      },
      render: (row: ResourceCostList) => (
        <span>{costDisplay(row.monthly_cost)}</span>
      ),
    },
    {
      id: 'bi_weekly_cost',
      sortId: 'bi_weekly_cost',
      label: 'Bi-Weekly Compensation',
      width: 200,
      sortable: true,
      sx: {
        textAlign: 'right',
      },
      render: (row: ResourceCostList) => (
        <span>{costDisplay(row.bi_weekly_cost)}</span>
      ),
    },
    {
      id: 'weekly_cost',
      sortId: 'weekly_cost',
      label: 'Weekly Compensation',
      width: 180,
      sortable: true,
      sx: {
        textAlign: 'right',
      },
      render: (row: ResourceCostList) => (
        <span>{costDisplay(row.weekly_cost)}</span>
      ),
    },
    {
      id: 'daily_cost',
      sortId: 'daily_cost',
      label: 'Daily Compensation',
      width: 160,
      sortable: true,
      sx: {
        textAlign: 'right',
      },
      render: (row: ResourceCostList) => (
        <span>{costDisplay(row.daily_cost)}</span>
      ),
    },
    {
      id: 'hourly_cost',
      sortId: 'hourly_cost',
      label: 'Hourly Compensation',
      width: 180,
      sortable: true,
      sx: {
        textAlign: 'right',
      },
      render: (row: ResourceCostList) => (
        <span>{costDisplay(row.hourly_cost)}</span>
      ),
    },
    {
      id: 'resource_orgname',
      sortId: 'resource_orgname',
      label: 'Org Name',
      width: 130,
      sortable: true,
    },
    {
      id: 'resource_designation',
      sortId: 'resource_designation',
      label: 'Designation',
      width: 130,
      sortable: true,
    },
    {
      id: 'resource_role',
      sortId: 'resource_role',
      label: 'Role',
      width: 130,
      sortable: true,
    },
    {
      id: 'comments',
      sortId: 'comments',
      label: 'Comments',
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
