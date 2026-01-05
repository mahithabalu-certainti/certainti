import { ListTableColumn } from '../../../../../../../components/table/types';
import { ResourceSummaryItem } from '../../../../../../types';

export const getResourceSummaryColumns =
  () //   permissionMap: Record<string, { read: boolean; edit: boolean }>
  : ListTableColumn<ResourceSummaryItem>[] => [
    {
      id: 'r_number',
      label: 'Project Number',
      sortable: true,
      sortId: 'r_number',
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
      id: 'project_ref_id',
      label: 'Project Ref Id',
      sortable: true,
      sortId: 'project_ref_id',
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
      id: 'resource_ref_id',
      label: 'Resource Ref Id',
      sortable: true,
      sortId: 'resource_ref_id',
      width: 180,
    },
    {
      id: 'resource_name',
      label: 'Resource Name',
      sortable: true,
      sortId: 'resource_name',
      width: 180,
    },
    {
      id: 'resource_type',
      label: 'Resource - Type',
      sortable: true,
      sortId: 'resource_type',
      width: 160,
    },
    {
      id: 'country_region',
      label: 'Country - Region',
      sortable: true,
      sortId: 'country_region',
      width: 180,
    },
    {
      id: 'cost',
      label: 'Cost',
      sortable: true,
      sortId: 'cost',
      width: 140,
      sx: {
        textAlign: 'right',
      },
    },
    {
      id: 'rd_percentage',
      label: 'RD%',
      sortable: true,
      sortId: 'rd_percentage',
      width: 120,
      sx: {
        textAlign: 'right',
      },
    },
    {
      id: 'qre',
      label: 'QRE',
      sortable: true,
      sortId: 'qre',
      width: 140,
      sx: {
        textAlign: 'right',
      },
    },
    {
      id: 'rd_credit',
      label: 'RD Credit',
      sortable: true,
      sortId: 'rd_credit',
      width: 140,
      sx: {
        textAlign: 'right',
      },
    },
  ];
