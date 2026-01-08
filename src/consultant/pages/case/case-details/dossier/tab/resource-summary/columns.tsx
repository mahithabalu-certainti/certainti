import { costDisplay } from '../../../../../../../common-utils';
import { ListTableColumn } from '../../../../../../../components/table/types';
import { ResourceSummaryItem } from '../../../../../../types';

export const getResourceSummaryColumns =
  () //   permissionMap: Record<string, { read: boolean; edit: boolean }>
  : ListTableColumn<ResourceSummaryItem>[] => [
    {
      id: 'resource_code',
      label: 'Resource Code',
      sortable: true,
      sortId: 'resource_code',
      width: 160,
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
      id: 'resource_name',
      label: 'Resource Name',
      sortable: true,
      sortId: 'resource_name',
      width: 180,
    },
    {
      id: 'project_code',
      label: 'Project Code',
      sortable: true,
      sortId: 'project_code',
      width: 180,
    },
    {
      id: 'project_name',
      label: 'Project Name',
      sortable: true,
      sortId: 'project_name',
      width: 200,
    },
    {
      id: 'country_name',
      label: 'Resource Country',
      sortable: true,
      sortId: 'country_name',
      width: 160,
    },
    {
      id: 'region_name',
      label: 'Resource Region',
      sortable: true,
      sortId: 'region_name',
      width: 160,
    },
    {
      id: 'project_resource_role',
      label: 'Project Resource Role',
      sortable: true,
      sortId: 'project_resource_role',
      width: 200,
    },
    {
      id: 'resource_type_name',
      label: 'Resource Type',
      sortable: true,
      sortId: 'resource_type_name',
      width: 160,
    },
    {
      id: 'total_hours_pro_res',
      label: 'Effort (Hours)',
      sortable: true,
      sortId: 'total_hours_pro_res',
      width: 160,
    },
    {
      id: 'net_total_cost_pro_res',
      label: 'Net Resource Cost',
      sortable: true,
      sortId: 'net_total_cost_pro_res',
      width: 180,
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
      label: 'QRE Final',
      sortable: true,
      sortId: 'qre_final',
      width: 140,
      render: (row) => `${costDisplay(row.qre_final, row.currency_symbol)}`,
    },
    {
      id: 'status_name',
      label: 'Status',
      sortable: true,
      sortId: 'status_name',
      width: 130,
      render: (row: ResourceSummaryItem) => (
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
      label: 'Comments',
      sortable: true,
      sortId: 'description',
      width: 200,
    },
    {
      id: 'r_number',
      label: 'Project Resource ID',
      sortable: true,
      sortId: 'r_number',
      width: 200,
    },
  ];

