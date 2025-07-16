import { ProjectResourcesListType } from '../../../../../types/project-resources';

export type TableColumn<T> = {
  id: string;
  label: string;
  width?: string | number;
  sortId: string;
  sortable?: boolean;
  sticky?: boolean;
  sx?: React.CSSProperties;
  render?: (row: T) => React.ReactNode;
};

export const getProjectResourcesColumns = (
  onClick: (row: ProjectResourcesListType) => void
): TableColumn<ProjectResourcesListType>[] => [
  {
    id: 'resource_code',
    label: 'Resource Code',
    sortable: true,
    sortId: 'resource_code',
    width: '160px',
    sticky: true,
    sx: {
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2 !important',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row: ProjectResourcesListType) => (
      <span
        className='cursor-pointer hover:!text-blue-600 hover:underline'
        onClick={() => onClick(row)}
      >
        {row.resource_code}
      </span>
    ),
  },
  {
    id: 'resource_name',
    label: 'Resource Name',
    sortable: true,
    sortId: 'resource_name',
    width: '180px',
  },
  {
    id: 'region_name',
    label: 'Resource Region',
    sortable: false,
    sortId: 'region_name',
    width: '150px',
  },
  {
    id: 'resource_type_name',
    label: 'Resource Type',
    sortable: true,
    sortId: 'resource_type_name',
    width: '150px',
  },
  // {
  //   id: 'resource_orgname',
  //   label: 'Resource Org Name',
  //   sortable: true,
  //   sortId: 'resource_orgname',
  //   width: '180px',
  // },
  {
    id: 'resource_role',
    label: 'Resource Role',
    sortable: true,
    sortId: 'resource_role',
    width: '150px',
  },
  // {
  //   id: 'status',
  //   label: 'Resource Status',
  //   sortable: true,
  //   sortId: 'status',
  //   width: '160px',
  //   render: (row: ProjectResourcesListType) => (
  //     <span
  //       className={
  //         row.status === 'Active' ? '!text-[#199806]' : '!text-[#f44336]'
  //       }
  //     >
  //       {row.status}
  //     </span>
  //   ),
  // },
  // {
  //   id: 'country',
  //   label: 'Resource Country',
  //   sortable: false,
  //   sortId: 'country',
  //   width: '150px',
  // },

  // {
  //   id: 'currency',
  //   label: 'Currency',
  //   sortable: false,
  //   sortId: 'Currency',
  //   width: '150px',
  // },
  {
    id: 'total_hours_pro_res',
    label: 'Effort (Hours)',
    sortable: true,
    sortId: 'total_hours_pro_res',
    width: '150px',
  },
  {
    id: 'total_cost_pro_res',
    label: 'Cost',
    sortable: true,
    sortId: 'total_cost_pro_res',
    width: '150px',
  },
  {
    id: 'qre_percent',
    label: 'QRE %',
    sortable: true,
    sortId: 'qre_percent',
    width: '150px',
  },
  {
    id: 'qre_final',
    label: 'QRE',
    sortable: true,
    sortId: 'qre_final',
    width: '150px',
  },
  {
    id: 'description',
    label: 'Comments',
    sortable: false,
    sortId: 'description',
    width: '150px',
  },
  // {
  //   id: 'r_number',
  //   label: 'Project Resource ID',
  //   sortable: true,
  //   sortId: 'r_number',
  //   width: '180px',
  // },
];
