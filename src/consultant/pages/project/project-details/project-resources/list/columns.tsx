import { ListTableColumn } from '../../../../../../components/table/types';
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
  onClick: (row: ProjectResourcesListType) => void,
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<ProjectResourcesListType>[] => [
  {
    id: 'resource_code',
    label: 'Resource Code',
    sortable: true,
    sortId: 'resource_code',
    width: '160px',
    sticky: true,
    editable:
      permissionMap?.['resource_code']?.read &&
      permissionMap?.['resource_code']?.edit,
    hide:
      !permissionMap?.['resource_code']?.read &&
      !permissionMap?.['resource_code']?.edit,
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
    editable:
      permissionMap?.['resource_name']?.read &&
      permissionMap?.['resource_name']?.edit,
    hide:
      !permissionMap?.['resource_name']?.read &&
      !permissionMap?.['resource_name']?.edit,
  },
  {
    id: 'region_name',
    label: 'Resource Region',
    sortable: false,
    sortId: 'region_name',
    width: '150px',
    editable:
      permissionMap?.['region_name']?.read &&
      permissionMap?.['region_name']?.edit,
    hide:
      !permissionMap?.['region_name']?.read &&
      !permissionMap?.['region_name']?.edit,
  },
  {
    id: 'resource_type_name',
    label: 'Resource Type',
    sortable: true,
    sortId: 'resource_type_name',
    width: '150px',
    editable:
      permissionMap?.['resource_type_name']?.read &&
      permissionMap?.['resource_type_name']?.edit,
    hide:
      !permissionMap?.['resource_type_name']?.read &&
      !permissionMap?.['resource_type_name']?.edit,
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
    editable:
      permissionMap?.['resource_role']?.read &&
      permissionMap?.['resource_role']?.edit,
    hide:
      !permissionMap?.['resource_role']?.read &&
      !permissionMap?.['resource_role']?.edit,
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
    editable:
      permissionMap?.['total_hours_pro_res']?.read &&
      permissionMap?.['total_hours_pro_res']?.edit,
    hide:
      !permissionMap?.['total_hours_pro_res']?.read &&
      !permissionMap?.['total_hours_pro_res']?.edit,
  },
  {
    id: 'total_cost_pro_res',
    label: 'Cost',
    sortable: true,
    sortId: 'total_cost_pro_res',
    width: '150px',
    editable:
      permissionMap?.['total_cost_pro_res']?.read &&
      permissionMap?.['total_cost_pro_res']?.edit,
    hide:
      !permissionMap?.['total_cost_pro_res']?.read &&
      !permissionMap?.['total_cost_pro_res']?.edit,
  },
  {
    id: 'qre_percent',
    label: 'QRE %',
    sortable: true,
    sortId: 'qre_percent',
    width: '150px',
    hide:
      !permissionMap?.['qre_percent']?.read &&
      !permissionMap?.['qre_percent']?.edit,
  },
  {
    id: 'qre_final',
    label: 'QRE',
    sortable: true,
    sortId: 'qre_final',
    width: '150px',
    hide:
      !permissionMap?.['qre_final']?.read &&
      !permissionMap?.['qre_final']?.edit,
  },
  {
    id: 'description',
    label: 'Comments',
    sortable: false,
    sortId: 'description',
    width: '150px',
    editable:
      permissionMap?.['description']?.read &&
      permissionMap?.['description']?.edit,
    hide:
      !permissionMap?.['description']?.read &&
      !permissionMap?.['description']?.edit,
  },
  // {
  //   id: 'r_number',
  //   label: 'Project Resource ID',
  //   sortable: true,
  //   sortId: 'r_number',
  //   width: '180px',
  // },
];
