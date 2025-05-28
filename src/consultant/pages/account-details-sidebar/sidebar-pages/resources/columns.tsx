import { ResourceList } from '../../../../types/resource';

export interface ResourceTableColumn<T> {
  id: string;
  label: string;
  width: string | number;
  sortId: string;
  sortable?: boolean;
  sticky?: boolean;
  sx?: React.CSSProperties;
  render?: (row: T) => React.ReactNode;
}

export const getResourceColumns = (
  onResourceIdClick?: (row: ResourceList) => void
): ResourceTableColumn<ResourceList>[] => [
    {
      id: 'resource_code',
      sortId: 'resource_code',
      label: 'Resource Code',
      width: 150,
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
      render: (row: ResourceList) =>
        onResourceIdClick ? (
          <span
            onClick={() => onResourceIdClick(row)}
            className='cursor-pointer no-underline hover:underline hover:text-[#1755E7]'
          >
            {row.resource_code}
          </span>
        ) : (
          row.resource_code
        ),
    },
    {
      id: 'resource_name',
      sortId: 'resource_name',
      label: 'Name',
      width: 200,
      sortable: true,
    },
    {
      id: 'resource_type',
      sortId: 'resource_type',
      label: 'Resource Type',
      width: 140,
      sortable: true,
    },
    {
      id: 'resource_orgname',
      sortId: 'resource_orgname',
      label: 'Org Name',
      width: 140,
      sortable: true,
    },
    {
      id: 'resource_designation',
      sortId: 'resource_designation',
      label: 'Designation',
      width: 200,
      sortable: true,
    },
    {
      id: 'resource_role',
      sortId: 'resource_role',
      label: 'Role',
      width: 200,
      sortable: true,
    },
    {
      id: 'region_name',
      sortId: 'resource_region',
      label: 'Region',
      width: 150,
      sortable: true,
    },
    {
      id: 'country_name',
      sortId: 'resource_country',
      label: 'Country',
      width: 160,
      sortable: true,
    },
    {
      id: 'total_project_hours',
      sortId: 'total_project_hours',
      label: 'Total Project Hours',
      width: 160,
      sortable: true,
    },
    {
      id: 'estimated_rd_hours',
      sortId: 'estimated_rd_hours',
      label: 'Estimated R&D Hours',
      width: 180,
      sortable: true,
    },
    {
      id: 'resource_status',
      sortId: 'resource_status',
      label: 'Status',
      width: 150,
      sortable: true,
      render: (row: ResourceList) => (
        <span
          className={`${row.resource_status === 'Active' ? 'text-[#199806]' : 'text-[#f44336]'
            }`}
        >
          {row.resource_status === 'Active' ? 'Active' : 'In-Active'}
        </span>
      ),
    },
    {
      id: 'comments',
      sortId: 'comments',
      label: 'Comments',
      width: 160,
      sortable: true,
    },
    {
      id: 'r_number',
      sortId: 'r_number',
      label: 'Resource ID',
      width: 150,
      sortable: true,
    },
  ];
