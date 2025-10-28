import { ListTableColumn } from '../../../../../../../components/table/types';
import {
  costDisplay,
  formatDateToYYYYMMDDWithTime,
  valueDisplay,
  REGEX_PATTERNS,
} from '../../../../../../../common-utils';
import { AssignProject } from '../../../../../../types/assign-projects';

export const formatDateToYMD = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return ''; // Handle invalid dates
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};
export const getAssignedProjectColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<AssignProject>[] => [
  {
    id: 'project_code',
    editId: 'project_code',
    label: 'Project Code',
    sortable: true,
    sortId: 'project_code',
    width: 260,
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
      const isClickable = row._level !== undefined && row._level === 1;
      return isClickable ? (
        <span
        //   onClick={() => onClick(row)}
        //   className={
        //     row.fiscal_year
        //       ? 'cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
        //       : ''
        //   }
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
    editId: 'project_name',
    label: 'Name',
    sortable: true,
    sortId: 'project_name',
    width: 160,
    hide:
      !permissionMap?.['project_name']?.read &&
      !permissionMap?.['project_name']?.edit,
    render: (row: AssignProject) => {
      const isChild = row._level !== undefined && row._level === 1;
      return isChild ? row.project_name : '-';
    },
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
    render: (row: AssignProject) => {
      const isChild = row._level !== undefined && row._level === 1;
      return isChild ? row.project_type_name : '-';
    },
  },
  {
    id: 'fiscal_year',
    editId: 'fiscal_year',
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
    render: (row: AssignProject) => {
      const displayYear = row.fiscal_year ? `FY-${row.fiscal_year}` : '-';
      return <span>{displayYear}</span>;
    },
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
    render: (row: AssignProject) => {
      return row.project_classification_other
        ? `${row.classification_name} - ${row.project_classification_other}`
        : row.classification_name;
    },
  },
  {
    id: 'project_client_group',
    editId: 'project_client_group',
    label: 'Customer Group',
    sortable: true,
    sortId: 'project_client_group',
    width: 160,
    hide:
      !permissionMap?.['project_client_group']?.read &&
      !permissionMap?.['project_client_group']?.edit,
    render: (row: AssignProject) => {
      const isChild = row._level !== undefined && row._level === 1;
      return isChild ? row.project_client_group : '-';
    },
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
    render: (row: AssignProject) => {
      const isChild = row._level !== undefined && row._level === 1;
      return isChild ? row.project_group : '-';
    },
  },
  {
    id: 'total_effort',
    editId: 'total_effort',
    label: 'Project Effort (Hours)',
    sortable: true,
    sortId: 'total_effort',
    width: 170,
    hide:
      !permissionMap?.['total_effort']?.read &&
      !permissionMap?.['total_effort']?.edit,
    sx: {
      textAlign: 'right',
    },
    render: (row: AssignProject) =>
      row.total_effort ? valueDisplay(row.total_effort) : '-',
    field: {
      type: 'text',
      required: false,
      placeholder: 'Enter Project Effort',
      validation: [
        {
          regex: REGEX_PATTERNS.EFFORTS_NUMBER,
          errorMessage:
            'Only positive numbers allowed, up to 16 digits and 2 decimal places',
        },
      ],
    },
  },
  {
    id: 'total_cost',
    editId: 'total_cost',
    label: 'Project Cost',
    sortable: true,
    sortId: 'total_cost',
    width: 130,
    hide:
      !permissionMap?.['total_cost']?.read &&
      !permissionMap?.['total_cost']?.edit,
    sx: {
      textAlign: 'right',
    },
    conditionallyEdit: [
      {
        key: 'total_cost',
        matchValue: [null, '0.00'],
      },
    ],
    render: (row: AssignProject) =>
      row.total_cost ? costDisplay(row.total_cost, row.currency_symbol) : '-',
  },
  {
    id: 'total_cost_fte',
    editId: 'total_cost_fte',
    label: 'FTE Cost',
    sortable: true,
    sortId: 'total_cost_fte',
    width: 140,
    hide:
      !permissionMap?.['total_cost_fte']?.read &&
      !permissionMap?.['total_cost_fte']?.edit,
    sx: {
      textAlign: 'right',
    },
    render: (row: AssignProject) =>
      row.total_cost_fte
        ? costDisplay(row.total_cost_fte, row.currency_symbol)
        : '-',
  },
  {
    id: 'total_cost_subcon',
    editId: 'total_cost_subcon',
    label: 'SubCon Cost',
    sortable: true,
    sortId: 'total_cost_subcon',
    width: 140,
    hide:
      !permissionMap?.['total_cost_subcon']?.read &&
      !permissionMap?.['total_cost_subcon']?.edit,
    sx: {
      textAlign: 'right',
    },
    render: (row: AssignProject) =>
      row.total_cost_subcon
        ? costDisplay(row.total_cost_subcon, row.currency_symbol)
        : '-',
  },
  {
    id: 'total_cost_nonlabor',
    editId: 'total_cost_nonlabor',
    label: 'Non-Labor Cost',
    sortable: true,
    editable:
      permissionMap?.['total_cost_nonlabor']?.read &&
      permissionMap?.['total_cost_nonlabor']?.edit,
    hide:
      !permissionMap?.['total_cost_nonlabor']?.read &&
      !permissionMap?.['total_cost_nonlabor']?.edit,
    sortId: 'total_cost_nonlabor',
    width: 140,
    sx: {
      textAlign: 'right',
    },
    render: (row: AssignProject) =>
      row.total_cost_nonlabor
        ? costDisplay(row.total_cost_nonlabor, row.currency_symbol)
        : '-',
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
    render: (row: AssignProject & { _level?: number }) => {
      const isClickable =
        permissionMap?.['key_contacts']?.read &&
        permissionMap?.['key_contacts']?.edit &&
        row._level !== undefined &&
        row._level === 1;
      return isClickable ? (
        <div className='!h-[31px] !min-h[31px] pt-1.5'>
          {row.project_point_of_contact}
        </div>
      ) : (
        <span>
          {row.project_point_of_contact ? row.project_point_of_contact : '-'}
        </span>
      );
    },
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
    render: (row: AssignProject & { _level?: number }) => {
      const isClickable =
        permissionMap?.['key_contacts']?.read &&
        permissionMap?.['key_contacts']?.edit &&
        row._level !== undefined &&
        row._level === 1;
      return isClickable ? (
        <div className='!h-[31px] !min-h[31px] pt-1.5'>
          {row.technical_point_of_contact}
        </div>
      ) : (
        <span>
          {row.technical_point_of_contact
            ? row.technical_point_of_contact
            : '-'}
        </span>
      );
    },
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
    id: 'rd_percent_potential_ai',
    label: 'QRE %',
    sortable: true,
    sortId: 'rd_percent_potential_ai',
    width: 130,
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['qre_final']?.read &&
      !permissionMap?.['qre_final']?.edit,
    render: (row: AssignProject) =>
      row.rd_percent_potential_ai ? row.rd_percent_potential_ai : '-',
  },
  {
    id: 'qre',
    label: 'QRE',
    sortable: true,
    sortId: 'qre',
    width: 130,
    sx: {
      textAlign: 'right',
    },
    hide: !permissionMap?.['qre']?.read && !permissionMap?.['qre']?.edit,
    render: (row: AssignProject) => (row.qre ? row.qre : '-'),
  },
  {
    id: 'comments',
    editId: 'comments',
    label: 'Comments',
    sortable: true,
    sortId: 'comments',
    width: 200,
    hide:
      !permissionMap?.['comments']?.read && !permissionMap?.['comments']?.edit,
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
    render: (row: AssignProject) =>
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
