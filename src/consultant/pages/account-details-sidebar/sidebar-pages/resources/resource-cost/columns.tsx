import { ResourceCostList } from '../../../../../types/resource-cost';
import { formatDateToMMDDYYYY } from '../utils';

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
      id: 'resource_name',
      sortId: 'resource_name',
      label: 'Name',
      width: 160,
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
      id: 'currency_code',
      sortId: 'currency',
      label: 'Currency',
      width: 130,
      sortable: true,
    },
    {
      id: 'effective_date',
      sortId: 'effective_date',
      label: 'Start Date',
      width: 130,
      sortable: true,
      render: (row: ResourceCostList) => (
        <span>{formatDateToMMDDYYYY(row.effective_date as string) || '-'}</span>
      ),
    },
    {
      id: 'end_date',
      sortId: 'end_date',
      label: 'End Date',
      width: 130,
      sortable: true,
      render: (row: ResourceCostList) => (
        <span>{formatDateToMMDDYYYY(row.end_date as string) || '-'}</span>
      ),
    },
    {
      id: 'hourly_cost',
      sortId: 'hourly_cost',
      label: 'Hourly',
      width: 130,
      sortable: true,
      render: (row: ResourceCostList) => (
        <span>{costDisplay(row.hourly_cost)}</span>
      ),
    },
    {
      id: 'daily_cost',
      sortId: 'daily_cost',
      label: 'Daily',
      width: 130,
      sortable: true,
      render: (row: ResourceCostList) => (
        <span>{costDisplay(row.daily_cost)}</span>
      ),
    },
    {
      id: 'bi_weekly_cost',
      sortId: 'bi_weekly_cost',
      label: 'Bi-Weekly',
      width: 130,
      sortable: true,
      render: (row: ResourceCostList) => (
        <span>{costDisplay(row.bi_weekly_cost)}</span>
      ),
    },
    {
      id: 'weekly_cost',
      sortId: 'weekly_cost',
      label: 'Weekly',
      width: 130,
      sortable: true,
      render: (row: ResourceCostList) => (
        <span>{costDisplay(row.weekly_cost)}</span>
      ),
    },
    {
      id: 'monthly_cost',
      sortId: 'monthly_cost',
      label: 'Monthly',
      width: 130,
      sortable: true,
      render: (row: ResourceCostList) => (
        <span>{costDisplay(row.monthly_cost)}</span>
      ),
    },
    {
      id: 'annual_cost',
      sortId: 'annual_cost',
      label: 'Annual',
      width: 130,
      sortable: true,
      render: (row: ResourceCostList) => (
        <span>{costDisplay(row.annual_cost)}</span>
      ),
    },
  ];
