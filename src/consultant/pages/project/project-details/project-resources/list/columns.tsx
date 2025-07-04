/* eslint-disable @typescript-eslint/no-explicit-any */

// import { ProjectResourcesListType } from '../../../../../types/project-resources';

export type TableColumn<T> = {
  id: string;
  label: string;
  width?: string | number;
  sortId: string;
  sortable?: boolean;
  sticky?: boolean;
  sx?: React.CSSProperties;
  render?: (row: T) => React.ReactNode; // ✅ only the row, not value+row
};

export const getProjectResourcesColumns = (
  onClick: (row: any) => void
): TableColumn<any>[] => [
  {
    id: 'resource_code',
    label: 'Resource Code',
    sortable: true,
    sortId: 'resource_code',
    width: '160px',
    render: (row: any) => (
      <span
        className='cursor-pointer hover:!text-blue-600 hover:underline'
        onClick={() => onClick(row)}
      >
        {row.resource_code}
      </span>
    ),
  },
  // { id: 'resource_code', label: 'Resource Code', sortable: true, sortId: 'resource_code', width: '180px' },
  {
    id: 'resource_name',
    label: 'Resource Name',
    sortable: true,
    sortId: 'resource_name',
    width: '180px',
  },
  {
    id: 'resource_type',
    label: 'Resource Type',
    sortable: true,
    sortId: 'resource_type',
    width: '150px',
  },
  {
    id: 'resource_org_name',
    label: 'Resource Org Name',
    sortable: true,
    sortId: 'resource_org_name',
    width: '180px',
  },
  {
    id: 'resource_role',
    label: 'Resource Role',
    sortable: true,
    sortId: 'resource_role',
    width: '150px',
  },
  {
    id: 'status',
    label: 'Resource Status',
    sortable: true,
    sortId: 'status',
    width: '160px',
    render: (row: any) => (
      <span
        className={
          row.status === 'Active' ? '!text-[#199806]' : '!text-[#f44336]'
        }
      >
        {row.status}
      </span>
    ),
  },
  {
    id: 'country',
    label: 'Resource Country',
    sortable: false,
    sortId: 'country',
    width: '150px',
  },
  {
    id: 'region',
    label: 'Resource Region',
    sortable: false,
    sortId: 'region',
    width: '150px',
  },
  {
    id: 'currency',
    label: 'Currency',
    sortable: false,
    sortId: 'Currency',
    width: '150px',
  },
  { id: 'cost', label: 'Cost', sortable: true, sortId: 'cost', width: '150px' },
  {
    id: 'effort',
    label: 'Effort',
    sortable: true,
    sortId: 'effort',
    width: '150px',
  },
];
