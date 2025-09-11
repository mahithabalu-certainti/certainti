import {
  costDisplay,
  formatDateToYYYYMMDDWithTime,
  valueDisplay,
} from '../../../../../../../common-utils';
import { ListTableColumn } from '../../../../../../../components/table/types';
import { TimesheetProjectList } from '../../../../../../types/timesheet-projects';

export const getProjectTabTableColumns = (
  onClick: (row: TimesheetProjectList) => void,
  permissionMap?: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<TimesheetProjectList>[] => [
  {
    id: 'project_code',
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
    render: (row: TimesheetProjectList) => {
      const displayCode = row.fiscal_year
        ? `FY${row.fiscal_year} - ${row.project_code}`
        : row.project_code;
      const isClickable = row._level !== undefined && row._level === 1;
      return isClickable ? (
        <span
          onClick={() => onClick(row)}
          className={
            row.fiscal_year
              ? 'cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
              : ''
          }
        >
          {displayCode}
        </span>
      ) : (
        displayCode
      );
    },
  },
  {
    id: 'project_name',
    label: 'Project Name',
    sortable: true,
    hide:
      !permissionMap?.['project_name']?.read &&
      !permissionMap?.['project_name']?.edit,
    sortId: 'project_name',
    width: 160,
  },
  {
    id: 'project_type_name',
    label: 'Project Type',
    sortable: true,
    hide:
      !permissionMap?.['project_type_rid']?.read &&
      !permissionMap?.['project_type_rid']?.edit,
    sortId: 'project_type_name',
    width: 160,
    render: (row: TimesheetProjectList) => {
      return row.project_type_name;
    },
  },
  {
    id: 'fiscal_year',
    label: 'Fiscal Year',
    sortable: true,
    hide:
      !permissionMap?.['fiscal_year']?.read &&
      !permissionMap?.['fiscal_year']?.edit,
    sortId: 'fiscal_year',
    width: 130,
    sx: {
      textAlign: 'left',
    },
    render: (row: TimesheetProjectList) => {
      const displayYear = row.fiscal_year ? `FY-${row.fiscal_year}` : '-';
      return <span>{displayYear}</span>;
    },
  },
  {
    id: 'classification_name',
    label: 'Project Classification',
    sortable: true,
    hide:
      !permissionMap?.['project_classification_rid']?.read &&
      !permissionMap?.['project_classification_rid']?.edit,
    sortId: 'classification_name',
    width: 170,
    render: (row: TimesheetProjectList) =>
      row.project_classification_other
        ? `${row.classification_name} - ${row.project_classification_other}`
        : row.classification_name,
  },
  {
    id: 'project_client_group',
    label: 'Customer Group',
    sortable: true,
    hide:
      !permissionMap?.['project_client_group']?.read &&
      !permissionMap?.['project_client_group']?.edit,
    sortId: 'project_client_group',
    width: 160,
  },
  {
    id: 'project_group',
    label: 'Project Group',
    sortable: true,
    hide:
      !permissionMap?.['project_group']?.read &&
      !permissionMap?.['project_group']?.edit,
    sortId: 'project_group',
    width: 160,
  },
  {
    id: 'total_effort',
    label: 'Project Effort (Hours)',
    sortable: true,
    hide:
      !permissionMap?.['total_effort']?.read &&
      !permissionMap?.['total_effort']?.edit,
    sortId: 'total_effort',
    width: 170,
    sx: {
      textAlign: 'right',
    },
    render: (row: TimesheetProjectList) =>
      row.total_effort ? valueDisplay(row.total_effort) : '-',
  },
  {
    id: 'total_cost',
    label: 'Project Cost',
    sortable: true,
    hide:
      !permissionMap?.['total_cost']?.read &&
      !permissionMap?.['total_cost']?.edit,
    sortId: 'total_cost',
    width: 130,
    sx: {
      textAlign: 'right',
    },
    render: (row: TimesheetProjectList) =>
      row.total_cost ? costDisplay(row.total_cost, row.currency_symbol) : '-',
  },
  {
    id: 'total_cost_fte',
    label: 'FTE Cost',
    sortable: true,
    hide:
      !permissionMap?.['total_cost_fte']?.read &&
      !permissionMap?.['total_cost_fte']?.edit,
    sortId: 'total_cost_fte',
    width: 140,
    sx: {
      textAlign: 'right',
    },
    render: (row: TimesheetProjectList) =>
      row.total_cost_fte
        ? costDisplay(row.total_cost_fte, row.currency_symbol)
        : '-',
  },
  {
    id: 'total_cost_subcon',
    label: 'SubCon Cost',
    sortable: true,
    hide:
      !permissionMap?.['total_cost_subcon']?.read &&
      !permissionMap?.['total_cost_subcon']?.edit,
    sortId: 'total_cost_subcon',
    width: 140,
    sx: {
      textAlign: 'right',
    },
    render: (row: TimesheetProjectList) =>
      row.total_cost_subcon
        ? costDisplay(row.total_cost_subcon, row.currency_symbol)
        : '-',
  },
  {
    id: 'total_cost_subcon',
    label: 'SubCon Cost',
    sortable: true,
    hide:
      !permissionMap?.['total_cost_nonlabor']?.read &&
      !permissionMap?.['total_cost_nonlabor']?.edit,
    sortId: 'total_cost_subcon',
    width: 140,
    sx: {
      textAlign: 'right',
    },
    render: (row: TimesheetProjectList) =>
      row.total_cost_subcon
        ? costDisplay(row.total_cost_subcon, row.currency_symbol)
        : '-',
  },
  {
    id: 'total_cost_nonlabor',
    label: 'Non-Labor Cost',
    sortable: true,
    hide:
      !permissionMap?.['total_cost_nonlabor']?.read &&
      !permissionMap?.['total_cost_nonlabor']?.edit,
    sortId: 'total_cost_nonlabor',
    width: 140,
    sx: {
      textAlign: 'right',
    },
    render: (row: TimesheetProjectList) =>
      row.total_cost_nonlabor
        ? costDisplay(row.total_cost_nonlabor, row.currency_symbol)
        : '-',
  },
  {
    id: 'assessment_status',
    label: 'Assessment Status',
    sortable: true,
    sortId: 'assessment_status',
    width: 180,
    hide:
      !permissionMap?.['assessment_status']?.read &&
      !permissionMap?.['assessment_status']?.edit,
  },
  {
    id: 'qre',
    label: 'QRE %',
    sortable: true,
    sortId: 'qre',
    width: 130,
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['qre_final']?.read &&
      !permissionMap?.['qre_final']?.edit,
    render: (row: TimesheetProjectList) => (row.qre ? row.qre : '-'),
  },
  {
    id: 'qre_final',
    label: 'QRE',
    sortable: true,
    sortId: 'qre_final',
    width: 130,
    hide: !permissionMap?.['qre']?.read && !permissionMap?.['qre']?.edit,
    sx: {
      textAlign: 'right',
    },
    render: (row: TimesheetProjectList) => (row.qre ? row.qre_final : '-'),
  },
  {
    id: 'project_point_of_contact',
    label: 'Project Point of Contact',
    sortable: true,
    sortId: 'project_point_of_contact',
    width: 200,
    hide:
      !permissionMap?.['key_contacts']?.read &&
      !permissionMap?.['key_contacts']?.edit,
    render: (row: TimesheetProjectList) =>
      row.project_point_of_contact ? row.project_point_of_contact : '-',
  },
  {
    id: 'technical_point_of_contact',
    label: 'Technical Point of Contact',
    sortable: true,
    sortId: 'technical_point_of_contact',
    width: 210,
    hide:
      !permissionMap?.['key_contacts']?.read &&
      !permissionMap?.['key_contacts']?.edit,
    render: (row: TimesheetProjectList) =>
      row.technical_point_of_contact ? row.technical_point_of_contact : '-',
  },
  {
    id: 'comments',
    label: 'Comments',
    sortable: true,
    hide:
      !permissionMap?.['comments']?.read && !permissionMap?.['comments']?.edit,
    sortId: 'comments',
    width: 200,
  },
  {
    id: 'modified_datetime',
    label: 'Last Modified',
    sortable: true,
    sortId: 'modified_datetime',
    width: 190,
    hide:
      !permissionMap?.['modified_datetime']?.read &&
      !permissionMap?.['modified_datetime']?.edit,
    render: (row: TimesheetProjectList) =>
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
    hide:
      !permissionMap?.['r_number']?.read && !permissionMap?.['r_number']?.edit,
  },
];
