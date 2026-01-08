import {
  costDisplay,
  formatDateToYYYYMMDDWithTime,
  valueDisplay,
} from '../../../../../../../common-utils';
import { ListTableColumn } from '../../../../../../../components/table/types';
import { QualifiedProjectItem } from '../../../../../../types';

export const getQualifiedProjectsColumns =
  () //   permissionMap: Record<string, { read: boolean; edit: boolean }>
  : ListTableColumn<QualifiedProjectItem>[] => [
    {
      id: 'project_code',
      label: 'Project Code',
      sortable: true,
      sortId: 'project_code',
      width: 180,
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
      id: 'project_name',
      label: 'Name',
      sortable: true,
      sortId: 'project_name',
      width: 160,
    },
    {
      id: 'project_type_name',
      label: 'Project Type',
      sortable: true,
      sortId: 'project_type_name',
      width: 160,
    },
    {
      id: 'project_classification_name',
      label: 'Project Classification',
      sortable: true,
      sortId: 'project_classification_name',
      width: 170,
    },
    {
      id: 'project_client_group',
      label: 'Customer Group',
      sortable: true,
      sortId: 'project_client_group',
      width: 160,
    },
    {
      id: 'project_group',
      label: 'Project Group',
      sortable: true,
      sortId: 'project_group',
      width: 160,
    },
    {
      id: 'total_effort_prj',
      label: 'Project Effort (Hours)',
      sortable: true,
      sortId: 'total_effort_prj',
      width: 170,
      sx: {
        textAlign: 'right',
      },
      render: (row: QualifiedProjectItem) =>
        row.total_effort_prj ? valueDisplay(row.total_effort_prj) : '-',
    },
    {
      id: 'total_cost_prj',
      label: 'Project Cost',
      sortable: true,
      sortId: 'total_cost_prj',
      width: 130,
      sx: {
        textAlign: 'right',
      },
      render: (row: QualifiedProjectItem) =>
        row.total_cost_prj
          ? costDisplay(row.total_cost_prj, row.currency_symbol)
          : '-',
    },
    {
      id: 'total_cost_fte_prj',
      label: 'FTE Cost',
      sortable: true,
      sortId: 'total_cost_fte_prj',
      width: 140,
      sx: {
        textAlign: 'right',
      },
      render: (row: QualifiedProjectItem) =>
        row.total_cost_fte_prj
          ? costDisplay(row.total_cost_fte_prj, row.currency_symbol)
          : '-',
    },
    {
      id: 'total_cost_subcon_prj',
      label: 'SubCon Cost',
      sortable: true,
      sortId: 'total_cost_subcon_prj',
      width: 140,
      sx: {
        textAlign: 'right',
      },
      render: (row: QualifiedProjectItem) =>
        row.total_cost_subcon_prj
          ? costDisplay(row.total_cost_subcon_prj, row.currency_symbol)
          : '-',
    },
    {
      id: 'total_cost_nonlabor_prj',
      label: 'Non-Labor Cost',
      sortable: true,
      sortId: 'total_cost_nonlabor_prj',
      width: 140,
      sx: {
        textAlign: 'right',
      },
      render: (row: QualifiedProjectItem) =>
        row.total_cost_nonlabor_prj
          ? costDisplay(row.total_cost_nonlabor_prj, row.currency_symbol)
          : '-',
    },
    {
      id: 'assessment_status',
      label: 'Assessment Status',
      sortable: true,
      sortId: 'assessment_status',
      width: 180,
    },
    {
      id: 'rd_percent_final',
      label: 'QRE Percent Final',
      sortable: true,
      sortId: 'rd_percent_final',
      width: 180,
      sx: {
        textAlign: 'right',
      },
      render: (row: QualifiedProjectItem) =>
        row.rd_percent_final ? row.rd_percent_final : '-',
    },
    {
      id: 'qre_final',
      label: 'QRE Final',
      sortable: true,
      sortId: 'qre_final',
      width: 130,
      sx: {
        textAlign: 'right',
      },
      render: (row: QualifiedProjectItem) =>
        row.qre_final ? costDisplay(row.qre_final, row.currency_symbol) : '-',
    },
    {
      id: 'project_point_of_contact',
      label: 'Project Point of Contact',
      sortable: true,
      sortId: 'project_point_of_contact',
      width: 200,
    },
    {
      id: 'project_technical_point_of_contact',
      label: 'Technical Point of Contact',
      sortable: true,
      sortId: 'project_technical_point_of_contact',
      width: 210,
    },
    {
      id: 'comments',
      label: 'Comments',
      sortable: true,
      sortId: 'comments',
      width: 200,
    },
    {
      id: 'modified_datetime',
      label: 'Last Modified',
      sortable: true,
      sortId: 'modified_datetime',
      width: 190,
      render: (row: QualifiedProjectItem) =>
        row.modified_datetime
          ? formatDateToYYYYMMDDWithTime(row.modified_datetime)
          : '-',
    },
    {
      id: 'r_number',
      label: 'Project ID',
      sortable: true,
      sortId: 'r_number',
      width: 140,
    },
  ];
