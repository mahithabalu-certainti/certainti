import { costDisplay } from '../../../../../common-utils';
import {
  ListTableColumn,
  RowData,
} from '../../../../../components/table/types';

export interface CaseProjectResourceRow extends RowData {
  rid: string;
  account_rid: string;
  r_number: string;
  resource_code: string;
  resource_name: string;
  project_code: string;
  project_name: string;
  resource_country: string;
  resource_region: string;
  project_resource_role: string;
  resource_type: string;
  effort_hours: number;
  net_resource_cost: number;
  qre_final: number;
  comments: string;
  project_resource_id: string;
}

export const getCaseProjectResourceColumns =
  (): ListTableColumn<CaseProjectResourceRow>[] => [
    {
      id: 'resource_code',
      sortId: 'resource_code',
      label: 'Resource Code',
      width: 160,
      sortable: true,
      sx: {
        position: 'sticky',
        left: 0,
        background: '#fff',
        zIndex: 10,
        borderRight: '1px solid #CBD6E2',
        borderBottom: '1px solid #CBD6E2 !important',
      },
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
      render: (row) => row.effort_hours,
      // render: (row) => formatDateToYYYYMMDDWithTime(row.effort_hours),
    },
    {
      id: 'net_resource_cost',
      sortId: 'net_resource_cost',
      label: 'Net Resource Cost',
      width: 180,
      sortable: true,

      render: (row) => costDisplay(row.net_resource_cost),
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
