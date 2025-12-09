import { costDisplay } from '../../../../../common-utils';
import {
  ListTableColumn,
  RowData,
} from '../../../../../components/table/types';
import { CaseProjectResourceRow } from '../../../../types/case-project-resource';

export type CaseProjectResourceRowType = CaseProjectResourceRow & RowData;

export const getCaseProjectResourceColumns = (
  onResourceIdClick?: (row: CaseProjectResourceRowType) => void,
  permissionMap?: Record<string, { read: boolean; edit: boolean }>
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
    // hide:
    //   !permissionMap?.['resource_name']?.read &&
    //   !permissionMap?.['resource_name']?.edit,
  },
  {
    id: 'project_code',
    sortId: 'project_code',
    label: 'Project Code',
    width: 180,
    sortable: true,
    // hide:
    //   !permissionMap?.['project_code']?.read &&
    //   !permissionMap?.['project_code']?.edit,
  },
  {
    id: 'project_name',
    sortId: 'project_name',
    label: 'Project Name',
    width: 200,
    sortable: true,
    // hide:
    //   !permissionMap?.['project_name']?.read &&
    //   !permissionMap?.['project_name']?.edit,
  },
  {
    id: 'country_name',
    sortId: 'resource_country',
    label: 'Resource Country',
    width: 160,
    sortable: true,
    hide:
      !permissionMap?.['country_rid']?.read &&
      !permissionMap?.['country_rid']?.edit,
  },
  {
    id: 'region_name',
    sortId: 'resource_region',
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
    sortId: 'resource_type',
    label: 'Resource Type',
    width: 160,
    sortable: true,
    hide:
      !permissionMap?.['resource_type']?.read &&
      !permissionMap?.['resource_type']?.edit,
  },
  {
    id: 'total_hours_pro_res',
    sortId: 'effort_hours',
    label: 'Effort (Hours)',
    width: 160,
    sortable: true,
    render: (row) => row.effort_hours as unknown as React.ReactNode,
    hide:
      !permissionMap?.['total_hours_pro_res']?.read &&
      !permissionMap?.['total_hours_pro_res']?.edit,
  },
  {
    id: 'total_cost_pro_res',
    sortId: 'net_resource_cost',
    label: 'Net Resource Cost',
    width: 180,
    sortable: true,
    hide:
      !permissionMap?.['net_total_cost_pro_res']?.read &&
      !permissionMap?.['net_total_cost_pro_res']?.edit,
    render: (row) =>
      costDisplay(
        row.net_resource_cost as unknown as string | number | null | undefined
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
    // render: (row) => `${row.qre_final}%`,
  },
  {
    id: 'description',
    sortId: 'comments',
    label: 'Comments',
    width: 200,
    sortable: true,
    hide:
      !permissionMap?.['  description']?.read &&
      !permissionMap?.['description']?.edit,
  },
  {
    id: 'r_number',
    sortId: 'project_resource_id',
    label: 'Project Resource ID',
    width: 200,
    sortable: true,
    hide:
      !permissionMap?.['r_number']?.read && !permissionMap?.['r_number']?.edit,
  },
];
