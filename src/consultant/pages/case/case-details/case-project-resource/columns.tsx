import { costDisplay } from '../../../../../common-utils';
import {
  ListTableColumn,
  RowData,
} from '../../../../../components/table/types';
import { CaseProjectResourceRow } from '../../../../types/case-project-resource';

export type CaseProjectResourceRowType = CaseProjectResourceRow & RowData;

export const getCaseProjectResourceColumns = (
  onResourceIdClick?: (row: CaseProjectResourceRowType) => void
): ListTableColumn<CaseProjectResourceRowType>[] => [
  {
    id: 'resource_code',
    sortId: 'resource_code',
    label: 'Resource Code',
    width: 160,
    sortable: true,
    sticky: true,
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
  },
  {
    id: 'project_code',
    sortId: 'project_code',
    label: 'Project Code',
    width: 180,
    sortable: true,
  },
  {
    id: 'project_name',
    sortId: 'project_name',
    label: 'Project Name',
    width: 200,
    sortable: true,
  },
  {
    id: 'resource_country',
    sortId: 'resource_country',
    label: 'Resource Country',
    width: 160,
    sortable: true,
  },
  {
    id: 'resource_region',
    sortId: 'resource_region',
    label: 'Resource Region',
    width: 160,
    sortable: true,
  },
  {
    id: 'project_resource_role',
    sortId: 'project_resource_role',
    label: 'Project Resource Role',
    width: 200,
    sortable: true,
  },
  {
    id: 'resource_type',
    sortId: 'resource_type',
    label: 'Resource Type',
    width: 160,
    sortable: true,
  },
  {
    id: 'effort_hours',
    sortId: 'effort_hours',
    label: 'Effort (Hours)',
    width: 160,
    sortable: true,
    render: (row) => row.effort_hours as unknown as React.ReactNode,
  },
  {
    id: 'net_resource_cost',
    sortId: 'net_resource_cost',
    label: 'Net Resource Cost',
    width: 180,
    sortable: true,
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

    render: (row) => `${row.qre_final}%`,
  },
  {
    id: 'comments',
    sortId: 'comments',
    label: 'Comments',
    width: 200,
    sortable: true,
  },
  {
    id: 'project_resource_id',
    sortId: 'project_resource_id',
    label: 'Project Resource ID',
    width: 200,
    sortable: true,
  },
];
