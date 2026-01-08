import { ListTableColumn } from '../../../../../../../components/table/types';
import { ProjectSummaryItem } from '../../../../../../types';

export const getProjectSummaryColumns =
  () //   permissionMap: Record<string, { read: boolean; edit: boolean }>
  : ListTableColumn<ProjectSummaryItem>[] => [
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
      id: 'fte_cost',
      label: 'FTE Cost',
      sortable: true,
      sortId: 'fte_cost',
      width: 140,
      sx: {
        textAlign: 'right',
      },
    },
    {
      id: 'sub_con_cost',
      label: 'Sub Con Cost',
      sortable: true,
      sortId: 'sub_con_cost',
      width: 140,
      sx: {
        textAlign: 'right',
      },
    },
    {
      id: 'non_labour_cost',
      label: 'Non Labour Cost',
      sortable: true,
      sortId: 'non_labour_cost',
      width: 160,
      sx: {
        textAlign: 'right',
      },
    },
    {
      id: 'project_cost',
      label: 'Project Cost',
      sortable: true,
      sortId: 'project_cost',
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
      id: 'project_qre',
      label: 'Project QRE',
      sortable: true,
      sortId: 'project_qre',
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
