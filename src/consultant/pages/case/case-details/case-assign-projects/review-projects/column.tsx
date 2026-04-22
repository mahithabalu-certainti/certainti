import { costDisplay, valueDisplay } from '../../../../../../common-utils';
import { ListTableColumn } from '../../../../../../components/table/types';
import { ReviewProject } from '../../../../../types/assign-projects';

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
): ListTableColumn<ReviewProject>[] => [
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
  },
  {
    id: 'project_name',
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
    label: 'Project Type',
    sortable: true,
    sortId: 'project_type_name',
    width: 160,
    hide:
      !permissionMap?.['project_type_rid']?.read &&
      !permissionMap?.['project_type_rid']?.edit,
    sx: (row) => ({
      background: row?.project_type_name ? '#fff' : '#f4ecec !important',
    }),
  },
  {
    id: 'project_classification_name',
    label: 'Classification',
    sortable: true,
    sortId: 'project_classification_name',
    hide:
      !permissionMap?.['project_classification_rid']?.read &&
      !permissionMap?.['project_classification_rid']?.edit,
    width: 170,
    sx: (row) => ({
      background: row?.project_classification_name
        ? '#fff'
        : '#f4ecec !important',
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
    hide:
      !permissionMap?.['industry_rid']?.read &&
      !permissionMap?.['industry_rid']?.edit,
    width: 160,
    sx: (row) => ({
      background: row?.industry_name ? '#fff' : '#f4ecec !important',
    }),
  },
  {
    id: 'project_point_of_contact',
    label: 'Primary Point of Contact',
    sortable: true,
    sortId: 'project_point_of_contact',
    hide:
      !permissionMap?.['primary_point_of_contact']?.read &&
      !permissionMap?.['primary_point_of_contact']?.edit,
    width: 210,
    sx: (row) => ({
      background: row?.project_point_of_contact ? '#fff' : '#f4ecec !important',
    }),
  },
  {
    id: 'project_point_of_contact_email',
    label: 'Primary Point of Contact Email',
    sortable: true,
    sortId: 'project_point_of_contact_email',
    hide:
      !permissionMap?.['primary_point_of_contact_email']?.read &&
      !permissionMap?.['primary_point_of_contact_email']?.edit,
    width: 230,
    sx: (row) => ({
      background: row?.project_point_of_contact_email
        ? '#fff'
        : '#f4ecec !important',
    }),
  },

  {
    id: 'total_fte_prj',
    label: 'Total FTE Count',
    sortable: true,
    sortId: 'total_fte_prj',
    width: 170,
    hide:
      !permissionMap?.['total_fte_prj']?.read &&
      !permissionMap?.['total_fte_prj']?.edit,
    sx: (row) => ({
      background: row?.total_fte_prj ? '#fff' : '#f4ecec !important',
      textAlign: 'right',
    }),

    render: (row: ReviewProject) =>
      row.total_fte_prj ? valueDisplay(row.total_fte_prj) : '-',
  },
  {
    id: 'total_subcon_prj',
    label: 'Total Sub Con Count',
    sortable: true,
    sortId: 'total_subcon_prj',
    width: 170,
    hide:
      !permissionMap?.['total_subcon_prj']?.read &&
      !permissionMap?.['total_subcon_prj']?.edit,
    sx: (row) => ({
      background: row?.total_subcon_prj ? '#fff' : '#f4ecec !important',
      textAlign: 'right',
    }),

    render: (row: ReviewProject) =>
      row.total_subcon_prj ? valueDisplay(row.total_subcon_prj) : '-',
  },
  {
    id: 'total_nonlabor_prj',
    editId: 'total_nonlabor_prj',
    label: 'Total Non Labor Count',
    sortable: true,
    sortId: 'total_nonlabor_prj',
    width: 220,
    hide:
      !permissionMap?.['total_nonlabor_prj']?.read &&
      !permissionMap?.['total_nonlabor_prj']?.edit,
    sx: (row) => ({
      background: row?.total_nonlabor_prj ? '#fff' : '#f4ecec !important',
      textAlign: 'right',
    }),

    render: (row: ReviewProject) =>
      row.total_nonlabor_prj ? valueDisplay(row.total_nonlabor_prj) : '-',
  },
  {
    id: 'total_effort_fte_prj"',
    editId: 'total_effort_fte_prj"',
    label: 'Total FTE Effort',
    sortable: true,
    sortId: 'total_effort_fte_prj"',
    width: 170,
    hide:
      !permissionMap?.['total_effort_fte_prj']?.read &&
      !permissionMap?.['total_effort_fte_prj']?.edit,
    sx: (row) => ({
      background: row?.total_effort_fte_prj ? '#fff' : '#f4ecec !important',
      textAlign: 'right',
    }),

    render: (row: ReviewProject) =>
      row.total_effort_fte_prj ? valueDisplay(row.total_effort_fte_prj) : '-',
  },
  {
    id: 'total_effort_subcon_prj',
    label: 'Total Sub Con Effort',
    sortable: true,
    sortId: 'total_effort_subcon_prj',
    width: 170,
    hide:
      !permissionMap?.['total_effort_subcon_prj']?.read &&
      !permissionMap?.['total_effort_subcon_prj']?.edit,
    sx: (row) => ({
      background: row?.total_effort_subcon_prj ? '#fff' : '#f4ecec !important',
      textAlign: 'right',
    }),

    render: (row: ReviewProject) =>
      row.total_effort_subcon_prj
        ? valueDisplay(row.total_effort_subcon_prj)
        : '-',
  },
  {
    id: 'total_effort_prj',
    label: 'Total Effort in Hrs',
    sortable: true,
    sortId: 'total_effort_prj',
    width: 170,
    hide:
      !permissionMap?.['total_effort_prj']?.read &&
      !permissionMap?.['total_effort_prj']?.edit,
    sx: (row) => ({
      background: row?.total_effort_prj ? '#fff' : '#f4ecec !important',
      textAlign: 'right',
    }),

    render: (row: ReviewProject) =>
      row.total_effort_prj ? valueDisplay(row.total_effort_prj) : '-',
  },
  {
    id: 'total_cost_fte_prj',
    label: 'Total FTE Cost',
    sortable: true,
    sortId: 'total_cost_fte_prj',
    width: 140,
    hide:
      !permissionMap?.['total_cost_fte_prj']?.read &&
      !permissionMap?.['total_cost_fte_prj']?.edit,
    sx: (row) => ({
      background: row?.total_cost_fte_prj ? '#fff' : '#f4ecec !important',
      textAlign: 'right',
    }),
    render: (row: ReviewProject) =>
      row.total_cost_fte_prj
        ? costDisplay(row.total_cost_fte_prj, row.currency_symbol)
        : '-',
  },
  {
    id: 'total_cost_subcon_prj',
    label: 'Total Sub Con Cost',
    sortable: true,
    sortId: 'total_cost_subcon_prj',
    width: 170,
    hide:
      !permissionMap?.['total_cost_subcon_prj']?.read &&
      !permissionMap?.['total_cost_subcon_prj']?.edit,
    sx: (row) => ({
      background: row?.total_effort_prj ? '#fff' : '#f4ecec !important',
      textAlign: 'right',
    }),
    render: (row: ReviewProject) =>
      row.total_cost_subcon_prj
        ? costDisplay(row.total_cost_subcon_prj, row.currency_symbol)
        : '-',
  },
  {
    id: 'total_cost_nonlabor_prj',
    label: 'Total Non Labor Cost',
    sortable: true,
    hide:
      !permissionMap?.['total_cost_nonlabor_prj']?.read &&
      !permissionMap?.['total_cost_nonlabor_prj']?.edit,
    sortId: 'total_cost_nonlabor_prj',
    width: 180,
    sx: (row) => ({
      background: row?.total_cost_nonlabor_prj ? '#fff' : '#f4ecec !important',
      textAlign: 'right',
    }),
    render: (row: ReviewProject) =>
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
      !permissionMap?.['total_cost_prj']?.read &&
      !permissionMap?.['total_cost_prj']?.edit,
    sx: (row) => ({
      background: row?.total_cost_prj ? '#fff' : '#f4ecec !important',
      textAlign: 'right',
    }),
    render: (row: ReviewProject) =>
      row.total_cost_prj
        ? costDisplay(row.total_cost_prj, row.currency_symbol)
        : '-',
  },
  {
    id: 'total_resources_prj',
    label: 'Number of Project Resource',
    sortable: true,
    sortId: 'total_resources_prj',
    width: 250,
    sx: (row) => ({
      background: row?.total_resources_prj ? '#fff' : '#f4ecec!important',
      textAlign: 'right',
    }),
    hide:
      !permissionMap?.['total_resources_prj']?.read &&
      !permissionMap?.['total_resources_prj']?.edit,
  },
  {
    id: 'total_tasks',
    label: 'Number of Project Task',
    sortable: true,
    sortId: 'total_tasks',
    width: 210,
    sx: (row) => ({
      background: row?.total_tasks ? '#fff' : '#f4ecec !important',
      textAlign: 'right',
    }),
    hide:
      !permissionMap?.['total_tasks']?.read &&
      !permissionMap?.['total_tasks']?.edit,
  },
  {
    id: 'total_technical_summaries',
    label: 'Number of Technical Summary Generated',
    sortable: true,
    sortId: 'total_technical_summaries',
    width: 310,
    hide:
      !permissionMap?.['total_technical_summaries']?.read &&
      !permissionMap?.['total_technical_summaries']?.edit,
    sx: (row) => ({
      background: row?.total_technical_summaries
        ? '#fff'
        : '#f4ecec !important',
    }),
  },
];
