import { ListTableColumn } from '../../../../../../components/table/types';
import {
  costDisplay,
  formatDateToYYYYMMDDWithTime,
  valueDisplay,
  REGEX_PATTERNS,
} from '../../../../../../common-utils';
import { AssignProject } from '../../../../../types/assign-projects';

export const formatDateToYMD = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return ''; // Handle invalid dates
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};
export const getSelectProjectColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  onClick: (row: AssignProject) => void
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
      render: (row: AssignProject) => {
        return (
          <span
            onClick={() => onClick(row)}
            className={
              'cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
            }
          >
            {row.project_code}
          </span>
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
    },
    {
      id: 'is_qualified',
      label: 'Qualified Status',
      sortable: true,
      sortId: 'is_qualified',
      width: 160,
      hide:
        !permissionMap?.['is_qualified']?.read &&
        !permissionMap?.['is_qualified']?.edit,
      render: (row: AssignProject) => {
        return row.is_qualified ? 'Yes' : 'No';
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
        return row.project_type_name;
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
        return row.project_classification_name;
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
        return row.project_client_group;
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
        return row.project_group;
      },
    },
    {
      id: 'total_effort_prj',
      editId: 'total_effort_prj',
      label: 'Project Effort (Hours)',
      sortable: true,
      sortId: 'total_effort_prj',
      width: 170,
      hide:
        !permissionMap?.['total_effort']?.read &&
        !permissionMap?.['total_effort']?.edit,
      sx: {
        textAlign: 'right',
      },
      render: (row: AssignProject) =>
        row.total_effort_prj ? valueDisplay(row.total_effort_prj) : '-',
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
      id: 'total_cost_prj',
      editId: 'total_cost_prj',
      label: 'Project Cost',
      sortable: true,
      sortId: 'total_cost_prj',
      width: 130,
      hide:
        !permissionMap?.['total_cost']?.read &&
        !permissionMap?.['total_cost']?.edit,
      sx: {
        textAlign: 'right',
      },
      conditionallyEdit: [
        {
          key: 'total_cost_prj',
          matchValue: [null, '0.00'],
        },
      ],
      render: (row: AssignProject) =>
        row.total_cost_prj
          ? costDisplay(row.total_cost_prj, row.currency_symbol)
          : '-',
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
        row.total_cost_fte_prj
          ? costDisplay(row.total_cost_fte_prj, row.currency_symbol)
          : '-',
    },
    {
      id: 'total_cost_subcon_prj',
      editId: 'total_cost_subcon_prj',
      label: 'SubCon Cost',
      sortable: true,
      sortId: 'total_cost_subcon_prj',
      width: 140,
      hide:
        !permissionMap?.['total_cost_subcon']?.read &&
        !permissionMap?.['total_cost_subcon']?.edit,
      sx: {
        textAlign: 'right',
      },
      render: (row: AssignProject) =>
        row.total_cost_subcon_prj
          ? costDisplay(row.total_cost_subcon_prj, row.currency_symbol)
          : '-',
    },
    {
      id: 'total_cost_nonlabor_prj',
      label: 'Non-Labor Cost',
      sortable: true,
      hide:
        !permissionMap?.['total_cost_nonlabor']?.read &&
        !permissionMap?.['total_cost_nonlabor']?.edit,
      sortId: 'total_cost_nonlabor_prj',
      width: 140,
      sx: {
        textAlign: 'right',
      },
      render: (row: AssignProject) =>
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
      hide:
        !permissionMap?.['assessment_status']?.read &&
        !permissionMap?.['assessment_status']?.edit,
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
      hide:
        !permissionMap?.['qre_final']?.read &&
        !permissionMap?.['qre_final']?.edit,
      render: (row: AssignProject) =>
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
      hide: !permissionMap?.['qre']?.read && !permissionMap?.['qre']?.edit,
      render: (row: AssignProject) =>
        row.qre_final ? costDisplay(row.qre_final, row.currency_symbol) : '-',
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
      id: 'project_technical_point_of_contact',
      label: 'Technical Point of Contact',
      sortable: true,
      sortId: 'project_technical_point_of_contact',
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
            {row.project_technical_point_of_contact}
          </div>
        ) : (
          <span>
            {row.project_technical_point_of_contact
              ? row.project_technical_point_of_contact
              : '-'}
          </span>
        );
      },
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
