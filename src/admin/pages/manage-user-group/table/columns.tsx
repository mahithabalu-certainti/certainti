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
    editable: false,
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
