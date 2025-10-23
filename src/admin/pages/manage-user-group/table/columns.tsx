import { costDisplay, formatDateToYYYYMMDDWithTime, valueDisplay } from '../../../../common-utils';
import { ListTableColumn } from '../../../../components/table/types';
import { Project } from '../../../../consultant/types/project';
import { UserGroupList } from '../../../types';

export const getUserGroupColumns = (
  prefixGroupName: string,
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<UserGroupList>[] => [
  {
    id: 'group_name',
    editId: 'group_name',
    sortId: 'group_name',
    label: 'Group Name',
    sortable: true,
    editable:
      permissionMap?.['group_name']?.read &&
      permissionMap?.['group_name']?.edit,
    hide:
      !permissionMap?.['group_name']?.read &&
      !permissionMap?.['group_name']?.edit,
    conditionallyEdit: [{ key: 'usergroup_type', matchValue: 'CUSTOM' }],
    field: {
      type: 'text',
      required: true,
      placeholder: 'Enter Group Name',
      prefix: prefixGroupName,
      prefixRegex: /^G-/,
      validation: [
        {
          regex: /^.{2,64}$/,
          errorMessage:
            'Group name must contain a minimum of 2 and a maximum of 64 characters.',
        },
        {
          regex: /^[A-Za-z0-9\s\-']+$/,
          errorMessage:
            "Group name can only contain letters, numbers, spaces, hyphens (-) and apostrophes (').",
        },
        {
          regex: /^[A-Za-z0-9](?:[A-Za-z0-9\s\-']*[A-Za-z0-9])?$/,
          errorMessage:
            'Group name cannot begin or end with a space or special character.',
        },
        {
          regex: /^(?!.*(--|''))[A-Za-z0-9\s\-']+$/,
          errorMessage:
            'Group name cannot contain consecutive special characters.',
        },
      ],
    },
  },
  {
    id: 'usergrouptype',
    editId: 'usergrouptype',
    sortId: 'usergrouptype',
    label: 'Group Type',
    sortable: true,
    hide:
      !permissionMap?.['group_type_rid']?.read &&
      !permissionMap?.['group_type_rid']?.edit,
  },
  {
    id: 'is_consultant_only_group',
    editId: 'is_consultant_only_group',
    sortId: 'is_consultant_only_group',
    label: 'Is Consultant Firm',
    sortable: true,
    hide:
      !permissionMap?.['is_consultant_only_group']?.read &&
      !permissionMap?.['is_consultant_only_group']?.edit,
  },
  {
    id: 'user_count',
    editId: 'user_count',
    sortId: 'user_count',
    label: 'Users Count',
    sortable: true,
    hide:
      !permissionMap?.['user_count']?.read &&
      !permissionMap?.['user_count']?.edit,
  },
  {
    id: 'created_datetime',
    editId: 'created_datetime',
    sortId: 'created_datetime',
    label: 'Created On',
    sortable: true,
    hide:
      !permissionMap?.['created_datetime']?.read &&
      !permissionMap?.['created_datetime']?.edit,
    render: (row: UserGroupList) =>
      row.created_datetime
        ? formatDateToYYYYMMDDWithTime(row.created_datetime)
        : '-',
  },
  {
    id: 'modified_datetime',
    editId: 'modified_datetime',
    sortId: 'modified_datetime',
    label: 'Updated On',
    sortable: true,
    hide:
      !permissionMap?.['modified_datetime']?.read &&
      !permissionMap?.['modified_datetime']?.edit,
    render: (row: UserGroupList) =>
      row.modified_datetime
        ? formatDateToYYYYMMDDWithTime(row.modified_datetime)
        : '-',
  },
];

export const getAvailableUserColumns = () => [
  {
    id: 'first_name',
    sortId: 'first_name',
    label: 'Username',
    sortable: true,
  },
  {
    id: 'email',
    sortId: 'email',
    label: 'Email Address',
    sortable: true,
  },
  {
    id: 'role_name',
    sortId: 'role_name',
    label: 'Role Name',
    sortable: true,
  },
  {
    id: 'organization_name',
    sortId: 'organization_name',
    label: 'Organisation Name',
    sortable: true,
  },
];

export const getProjectColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<Project>[] => [
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
    render: (row: Project) => {
      const displayCode = row.fiscal_year
        ? `FY${row.fiscal_year} - ${row.project_code}`
        : row.project_code;
      const isClickable = row._level !== undefined && row._level === 1;
      return isClickable ? (
        <span className={row.fiscal_year ? '!text-[#1755E7]' : ''}>
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
    render: (row: Project) => {
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
    render: (row: Project) =>
      row.project_classification_other
        ? `${row.classification_name} - ${row.project_classification_other}`
        : row.classification_name,
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
    conditionallyEdit: [
      {
        key: 'total_effort',
        matchValue: [null, '0.00'],
      },
    ],
    sx: {
      textAlign: 'right',
    },
    render: (row: Project) =>
      row.total_effort ? valueDisplay(row.total_effort) : '-',
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
    render: (row: Project) =>
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
    render: (row: Project) =>
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
    render: (row: Project) =>
      row.total_cost_subcon
        ? costDisplay(row.total_cost_subcon, row.currency_symbol)
        : '-',
  },
  {
    id: 'total_cost_nonlabor',
    editId: 'total_cost_nonlabor',
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
    render: (row: Project) =>
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
    render: (row: Project & { _level?: number }) => {
      return (
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
    render: (row: Project & { _level?: number }) => {
      return (
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
    id: 'rd_percent_final',
    label: 'QRE Percent Final',
    sortable: true,
    sortId: 'rd_percent_final',
    width: 150,
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['qre_final']?.read &&
      !permissionMap?.['qre_final']?.edit,
    render: (row: Project) => (row.qre_final ? row.qre_final : '-'),
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
    render: (row: Project) => (row.qre ? row.qre : '-'),
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
    render: (row: Project) =>
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
