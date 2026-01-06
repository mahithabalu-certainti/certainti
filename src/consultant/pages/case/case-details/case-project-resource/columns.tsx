import { costDisplay } from '../../../../../common-utils';
import {
  ListTableColumn,
  RowData,
} from '../../../../../components/table/types';
import { CaseProjectResourceRow } from '../../../../types/case-project-resource';

export type CaseProjectResourceRowType = CaseProjectResourceRow & RowData;

export const getCaseProjectResourceColumns = (
  onResourceIdClick?: (row: CaseProjectResourceRowType) => void,
  permissionMap?: Record<string, { read: boolean; edit: boolean }>,
  projectPermissionMap?: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<CaseProjectResourceRowType>[] => [
  {
    id: 'resource_code',
    sortId: 'resource_code',
    label: 'Resource Code',
    width: 160,
    sortable: true,
    sticky: true,
    hide:
      !permissionMap?.['resource_code']?.read &&
      !permissionMap?.['resource_code']?.edit,
    sx: {
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row: CaseProjectResourceRowType) =>
      onResourceIdClick ? (
        <span
          onClick={() => onResourceIdClick(row)}
          className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
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
    label: 'Resource Name',
    width: 180,
    sortable: true,
    hide:
      !permissionMap?.['resource_name']?.read &&
      !permissionMap?.['resource_name']?.edit,
  },
  {
    id: 'project_code',
    sortId: 'project_code',
    label: 'Project Code',
    width: 180,
    sortable: true,
    hide:
      !projectPermissionMap?.['project_code']?.read &&
      !projectPermissionMap?.['project_code']?.edit,
  },
  {
    id: 'project_name',
    sortId: 'project_name',
    label: 'Project Name',
    width: 200,
    sortable: true,
    hide:
      !projectPermissionMap?.['project_name']?.read &&
      !projectPermissionMap?.['project_name']?.edit,
  },
  {
    id: 'country_name',
    sortId: 'country_name',
    label: 'Resource Country',
    width: 160,
    sortable: true,
    hide:
      !permissionMap?.['country_rid']?.read &&
      !permissionMap?.['country_rid']?.edit,
  },
  {
    id: 'region_name',
    sortId: 'region_name',
    label: 'Resource Region',
    width: 160,
    sortable: true,
    hide:
      !permissionMap?.['region_rid']?.read &&
      !permissionMap?.['region_rid']?.edit,
  },
  {
    id: 'project_resource_role',
    sortId: 'project_resource_role',
    label: 'Project Resource Role',
    width: 200,
    sortable: true,
    hide:
      !permissionMap?.['project_resource_role']?.read &&
      !permissionMap?.['project_resource_role']?.edit,
  },
  {
    id: 'resource_type_name',
    sortId: 'resource_type_name',
    label: 'Resource Type',
    width: 160,
    sortable: true,
    hide:
      !permissionMap?.['resource_type_name']?.read &&
      !permissionMap?.['resource_type_name']?.edit,
  },
  {
    id: 'total_hours_pro_res',
    sortId: 'total_hours_pro_res',
    label: 'Effort (Hours)',
    width: 160,
    sortable: true,
    hide:
      !permissionMap?.['total_hours_pro_res']?.read &&
      !permissionMap?.['total_hours_pro_res']?.edit,
  },
  {
    id: 'net_total_cost_pro_res',
    sortId: 'net_total_cost_pro_res',
    label: 'Net Resource Cost',
    width: 180,
    sortable: true,
    hide:
      !permissionMap?.['net_total_cost_pro_res']?.read &&
      !permissionMap?.['net_total_cost_pro_res']?.edit,
    render: (row) =>
      costDisplay(
        row.net_total_cost_pro_res as unknown as
          | string
          | number
          | null
          | undefined,
        row.currency_symbol
      ),
  },
  {
    id: 'qre_final',
    sortId: 'qre_final',
    label: 'QRE Final',
    width: 140,
    sortable: true,
    hide:
      !permissionMap?.['qre_final']?.read &&
      !permissionMap?.['qre_final']?.edit,
    render: (row) => `${costDisplay(row.qre_final, row.currency_symbol)}`,
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
    render: (row: CaseProjectResourceRowType) => (
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
    id: 'description',
    sortId: 'description',
    label: 'Comments',
    width: 200,
    sortable: true,
    hide:
      !permissionMap?.['  description']?.read &&
      !permissionMap?.['description']?.edit,
  },
  {
    id: 'r_number',
    sortId: 'r_number',
    label: 'Project Resource ID',
    width: 200,
    sortable: true,
    hide:
      !permissionMap?.['r_number']?.read && !permissionMap?.['r_number']?.edit,
  },
];
