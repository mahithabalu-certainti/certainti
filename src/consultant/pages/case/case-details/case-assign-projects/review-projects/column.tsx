import { costDisplay, valueDisplay } from '../../../../../../common-utils';
import { ListTableColumn } from '../../../../../../components/table/types';
import { AssignProject } from '../../../../../types/assign-projects';

export const formatDateToYMD = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return ''; // Handle invalid dates
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};
export const getReviewdProjectColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<AssignProject>[] => [
  {
    id: 'project_code',
    editId: 'project_code',
    label: 'Project Code',
    sortable: true,
    sortId: 'project_code',
    width: 180,
    sticky: true,
    hide:
      !permissionMap?.['project_code']?.read &&
      !permissionMap?.['project_code']?.edit,
    sx: {
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2 !important',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row: AssignProject) => {
      const displayCode = row.fiscal_year
        ? `FY${row.fiscal_year} - ${row.project_code}`
        : row.project_code;
      return <span>{displayCode}</span>;
    },
  },
  {
    id: 'project_name',
    editId: 'project_name',
    label: 'Name',
    sortable: true,
    sortId: 'project_name',
    width: 160,
    hide:
      !permissionMap?.['project_name']?.read &&
      !permissionMap?.['project_name']?.edit,
    sx: (row) => ({
      background: row?.project_name ? '#fff' : '#f4ecec !important',
    }),
  },
  {
    id: 'project_type_name',
    editId: 'project_type_rid',
    label: 'Project Type',
    sortable: true,
    sortId: 'project_type_rid',
    width: 160,
    hide:
      !permissionMap?.['project_type_rid']?.read &&
      !permissionMap?.['project_type_rid']?.edit,
    sx: (row) => ({
      background: row?.project_type_name ? '#fff' : '#f4ecec !important',
    }),
  },
  {
    id: 'classification_name',
    editId: 'project_classification_rid',
    label: 'Project Classification',
    sortable: true,
    sortId: 'classification_name',
    hide:
      !permissionMap?.['project_classification_rid']?.read &&
      !permissionMap?.['project_classification_rid']?.edit,
    width: 170,
    sx: (row) => ({
      background: row?.classification_name ? '#fff' : '#f4ecec !important',
    }),
  },
  {
    id: 'project_group',
    editId: 'project_group',
    label: 'Project Group',
    sortable: true,
    sortId: 'project_group',
    hide:
      !permissionMap?.['project_group']?.read &&
      !permissionMap?.['project_group']?.edit,
    width: 160,
    sx: (row) => ({
      background: row?.project_group ? '#fff' : '#f4ecec !important',
    }),
  },
  {
    id: 'industry_name',
    label: 'Industry',
    sortable: true,
    sortId: 'industry_name',
    // hide:
    //   !permissionMap?.['industry_rid']?.read &&
    //   !permissionMap?.['industry_rid']?.edit,
    width: 160,
  },
  {
    id: 'project_point_of_contact',
    label: 'Primary Point of Contact',
    sortable: true,
    sortId: 'project_point_of_contact',
    // hide:
    //   !permissionMap?.['project_point_of_contact']?.read &&
    //   !permissionMap?.['project_point_of_contact']?.edit,
    width: 210,
  },
  {
    id: 'project_point_of_contact_email',
    label: 'Primary Point of Contact Email',
    sortable: true,
    sortId: 'project_point_of_contact_email',
    // hide:
    //   !permissionMap?.['project_point_of_contact_email']?.read &&
    //   !permissionMap?.['project_point_of_contact_email']?.edit,
    width: 230,
  },

  {
    id: 'total_effort_prj',
    editId: 'total_effort',
    label: 'Total FTE Count',
    sortable: true,
    sortId: 'total_effort',
    width: 170,
    hide:
      !permissionMap?.['total_effort']?.read &&
      !permissionMap?.['total_effort']?.edit,
    sx: (row) => ({
      background: row?.total_effort_prj ? '#fff' : '#f4ecec !important',
      textAlign: 'right',
    }),

    render: (row: AssignProject) =>
      row.total_effort_prj ? valueDisplay(row.total_effort_prj) : '-',
  },
  {
    id: 'total_effort_prj',
    editId: 'total_effort',
    label: 'Total Sub Con Count',
    sortable: true,
    sortId: 'total_effort',
    width: 170,
    hide:
      !permissionMap?.['total_effort']?.read &&
      !permissionMap?.['total_effort']?.edit,
    sx: (row) => ({
      background: row?.total_effort_prj ? '#fff' : '#f4ecec !important',
      textAlign: 'right',
    }),

    render: (row: AssignProject) =>
      row.total_effort_prj ? valueDisplay(row.total_effort_prj) : '-',
  },
  {
    id: 'total_effort_prj',
    editId: 'total_effort',
    label: 'Total Non Labor Count',
    sortable: true,
    sortId: 'total_effort',
    width: 170,
    hide:
      !permissionMap?.['total_effort']?.read &&
      !permissionMap?.['total_effort']?.edit,
    sx: (row) => ({
      background: row?.total_effort_prj ? '#fff' : '#f4ecec !important',
      textAlign: 'right',
    }),

    render: (row: AssignProject) =>
      row.total_effort_prj ? valueDisplay(row.total_effort_prj) : '-',
  },
  {
    id: 'total_effort_prj',
    editId: 'total_effort',
    label: 'Total FTE Effort',
    sortable: true,
    sortId: 'total_effort',
    width: 170,
    hide:
      !permissionMap?.['total_effort']?.read &&
      !permissionMap?.['total_effort']?.edit,
    sx: (row) => ({
      background: row?.total_effort_prj ? '#fff' : '#f4ecec !important',
      textAlign: 'right',
    }),

    render: (row: AssignProject) =>
      row.total_effort_prj ? valueDisplay(row.total_effort_prj) : '-',
  },
  {
    id: 'total_effort_prj',
    editId: 'total_effort',
    label: 'Total Sub Con Effort',
    sortable: true,
    sortId: 'total_effort',
    width: 170,
    hide:
      !permissionMap?.['total_effort']?.read &&
      !permissionMap?.['total_effort']?.edit,
    sx: (row) => ({
      background: row?.total_effort_prj ? '#fff' : '#f4ecec !important',
      textAlign: 'right',
    }),

    render: (row: AssignProject) =>
      row.total_effort_prj ? valueDisplay(row.total_effort_prj) : '-',
  },
  {
    id: 'total_effort_prj',
    editId: 'total_effort',
    label: 'Total Effort in Hrs',
    sortable: true,
    sortId: 'total_effort',
    width: 170,
    hide:
      !permissionMap?.['total_effort']?.read &&
      !permissionMap?.['total_effort']?.edit,
    sx: (row) => ({
      background: row?.total_effort_prj ? '#fff' : '#f4ecec !important',
      textAlign: 'right',
    }),

    render: (row: AssignProject) =>
      row.total_effort_prj ? valueDisplay(row.total_effort_prj) : '-',
  },

  {
    id: 'total_cost_prj',
    label: 'Total FTE Cost',
    sortable: true,
    sortId: 'total_cost_prj',
    width: 140,
    hide:
      !permissionMap?.['total_cost_prj']?.read &&
      !permissionMap?.['total_cost_prj']?.edit,
    sx: (row) => ({
      background: row?.total_cost_fte_prj ? '#fff' : '#f4ecec !important',
      textAlign: 'right',
    }),
    render: (row: AssignProject) =>
      row.total_cost_fte_prj
        ? costDisplay(row.total_cost_fte_prj, row.currency_symbol)
        : '-',
  },
  {
    id: 'total_cost_subcon_prj',
    label: 'Total Sub Con Cost',
    sortable: true,
    sortId: 'total_cost_subcon_prj',
    width: 140,
    hide:
      !permissionMap?.['total_cost_subcon_prj']?.read &&
      !permissionMap?.['total_cost_subcon_prj']?.edit,
    sx: (row) => ({
      background: row?.total_effort_prj ? '#fff' : '#f4ecec !important',
      textAlign: 'right',
    }),
    render: (row: AssignProject) =>
      row.total_cost_subcon_prj
        ? costDisplay(row.total_cost_subcon_prj, row.currency_symbol)
        : '-',
  },
  {
    id: 'total_cost_nonlabor_prj',
    label: 'Total Non Labor Cost',
    sortable: true,
    editable:
      permissionMap?.['total_cost_nonlabor_prj']?.read &&
      permissionMap?.['total_cost_nonlabor_prj']?.edit,
    hide:
      !permissionMap?.['total_cost_nonlabor_prj']?.read &&
      !permissionMap?.['total_cost_nonlabor_prj']?.edit,
    sortId: 'total_cost_nonlabor_prj',
    width: 140,
    sx: (row) => ({
      background: row?.total_cost_nonlabor_prj ? '#fff' : '#f4ecec !important',
      textAlign: 'right',
    }),
    render: (row: AssignProject) =>
      row.total_cost_nonlabor_prj
        ? costDisplay(row.total_cost_nonlabor_prj, row.currency_symbol)
        : '-',
  },
  {
    id: 'total_cost_prj',
    label: 'Total Cost',
    sortable: true,
    sortId: 'total_cost_prj',
    width: 130,
    hide:
      !permissionMap?.['total_cost']?.read &&
      !permissionMap?.['total_cost']?.edit,
    sx: (row) => ({
      background: row?.total_cost_prj ? '#fff' : '#f4ecec !important',
      textAlign: 'right',
    }),
    render: (row: AssignProject) =>
      row.total_cost_prj
        ? costDisplay(row.total_cost_prj, row.currency_symbol)
        : '-',
  },
  {
    id: 'project_point_of_contact',
    label: 'Number of Project Resource',
    sortable: true,
    sortId: 'project_point_of_contact',
    width: 200,
    sx: (row) => ({
      background: row?.project_point_of_contact ? '#fff' : '#f4ecec!important',
      textAlign: 'right',
    }),
    hide:
      !permissionMap?.['key_contacts']?.read &&
      !permissionMap?.['key_contacts']?.edit,
  },
  {
    id: 'project_technical_point_of_contact',
    label: 'Number of Project Task',
    sortable: true,
    sortId: 'project_technical_point_of_contact',
    width: 210,
    sx: (row) => ({
      background: row?.total_cost_fte_prj ? '#fff' : '#f4ecec !important',
      textAlign: 'right',
    }),
    hide:
      !permissionMap?.['key_contacts']?.read &&
      !permissionMap?.['key_contacts']?.edit,
  },
  {
    id: 'assessment_status',
    label: 'Number of Technical Summary Generated',
    sortable: true,
    sortId: 'assessment_status',
    width: 310,
    hide:
      !permissionMap?.['assessment_status']?.read &&
      !permissionMap?.['assessment_status']?.edit,
    sx: (row) => ({
      background: row?.assessment_status ? '#fff' : '#f4ecec !important',
    }),
  },
];
