import { formatDateToYYYYMMDDWithTime } from '../../../../../common-utils';
import { ListTableColumn } from '../../../../../components/table/types';
import { TaskTemplateList } from '../../../../types';

export const getTaskTemplateColumns =
  () // permissionMap: Record<string, { read: boolean; edit: boolean }>,
  : ListTableColumn<TaskTemplateList>[] => [
    {
      id: 'r_number',
      sortId: 'r_number',
      label: 'Template ID',
      width: 130,
      sortable: true,
      sticky: true,
      sx: {
        position: 'sticky',
        left: 32,
        background: '#fff',
        zIndex: 10,
        borderRight: '1px solid #CBD6E2',
        borderBottom: '1px solid #CBD6E2 !important',
      },
    },
    {
      id: 'task_name',
      // editable:'task_name',
      sortId: 'task_name',
      label: 'Task Name',
      width: 160,
      sortable: true,
    },
    {
      id: 'efforts',
      sortId: 'efforts',
      label: 'Efforts In Days',
      width: 140,
      sortable: true,
      render: (row) =>
        row.efforts !== null && row.efforts !== undefined ? row.efforts : '-',
    },
    {
      id: 'reminder_interval',
      sortId: 'reminder_interval',
      label: 'Reminder Interval',
      width: 150,
      sortable: true,
      render: (row) =>
        row.efforts !== null && row.efforts !== undefined ? row.efforts : '-',
    },
    {
      id: 'milestone_type_rid',
      sortId: 'milestone_type_rid',
      label: 'Milestone Name',
      width: 150,
      sortable: true,
    },
    {
      id: 'case_team_member_role_rid',
      sortId: 'case_team_member_role_rid',
      label: 'Assinge Role',
      width: 120,
      sortable: true,
    },
    {
      id: 'priority_rid',
      sortId: 'priority_rid',
      label: 'Priority',
      width: 120,
      sortable: true,
    },
    {
      id: 'checklist_template_rid',
      sortId: 'checklist_template_rid',
      label: 'Checklist',
      width: 120,
      sortable: true,
    },
    {
      id: 'task_description',
      sortId: 'task_description',
      label: 'Task Description',
      width: 300,
      sortable: true,
    },
    {
      id: 'created_user_name',
      sortId: 'created_user_name',
      label: 'Created By',
      width: 160,
      sortable: true,
      render: (row) => row.created_user_name || '-',
    },
    {
      id: 'created_datetime',
      sortId: 'created_datetime',
      label: 'Created On',
      width: 190,
      sortable: true,
      render: (row) =>
        row.created_datetime
          ? formatDateToYYYYMMDDWithTime(row.created_datetime)
          : '-',
    },
    {
      id: 'modified_user_name',
      sortId: 'modified_user_name',
      label: 'Updated By',
      width: 160,
      sortable: true,
      render: (row) => row.modified_user_name || '-',
    },
    {
      id: 'modified_datetime',
      sortId: 'modified_datetime',
      label: 'Updated On',
      width: 190,
      sortable: true,
      render: (row) =>
        row.modified_datetime
          ? formatDateToYYYYMMDDWithTime(row.modified_datetime)
          : '-',
    },
  ];
