import { formatDateToYYYYMMDDWithTime } from '../../../../common-utils';
import { ListTableColumn } from '../../../../components/table/types';
import { UserGroupList } from '../../../types';

export const getUserGroupColumns = (): ListTableColumn<UserGroupList>[] => [
  {
    id: 'group_name',
    editId: 'group_name',
    sortId: 'group_name',
    label: 'Group Name',
    sortable: true,
    editable: true,
    conditionallyEdit: { key: 'usergroup_type', matchValue: 'CUSTOM' },
    field: {
      type: 'text',
      required: true,
      placeholder: 'Enter Group Name',
      validation: [
        {
          regex: /^.{2,64}$/,
          errorMessage:
            'Group name must contain a minimum of 2 and a maximum of 64 characters.',
        },
        {
          regex: /^[A-Za-z\s\-']+$/,
          errorMessage:
            "Group name can only contain letters, spaces, hyphens (-) and apostrophes (').",
        },
        {
          regex: /^[A-Za-z](?:[A-Za-z\s\-']*[A-Za-z])?$/,
          errorMessage:
            'Group name cannot begin or end with a space or special character.',
        },
        {
          regex: /^(?!.*(--|''))[A-Za-z\s\-']+$/,
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
  },
  {
    id: 'is_consultant_only_group',
    editId: 'is_consultant_only_group',
    sortId: 'is_consultant_only_group',
    label: 'Is Consultant Firm',
    sortable: true,
  },
  {
    id: 'user_count',
    editId: 'user_count',
    sortId: 'user_count',
    label: 'Users Count',
    sortable: true,
  },
  {
    id: 'created_datetime',
    editId: 'created_datetime',
    sortId: 'created_datetime',
    label: 'Created On',
    sortable: true,
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
    label: 'User Full Name',
    sortable: false,
  },
  {
    id: 'email',
    sortId: 'email',
    label: 'Email Address',
    sortable: false,
  },
  {
    id: 'organization_name',
    sortId: 'organization_name',
    label: 'Organisation Name',
    sortable: false,
  },
];

export const getAvailableProjectsColumns = () => [
  {
    id: 'account_name',
    sortId: 'account_name',
    label: 'Account Name',
    sortable: false,
  },
  {
    id: 'project_name',
    sortId: 'project_name',
    label: 'Project Name',
    sortable: false,
  },
  {
    id: 'project_code',
    sortId: 'project_code',
    label: 'Project Code',
    sortable: false,
  }
];
