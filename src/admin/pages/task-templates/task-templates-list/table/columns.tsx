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
      sortId: 'task_name',
      label: 'Task Name',
      width: 160,
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
      id: 'task_type',
      sortId: 'task_type',
      label: 'Task Type',
      width: 140,
      sortable: true,
      render: (row) => row.task_type_name || '-',
    },
    {
      id: 'efforts',
      sortId: 'efforts',
      label: 'Efforts (Hrs)',
      width: 120,
      sortable: true,
      render: (row) =>
        row.efforts !== null && row.efforts !== undefined ? row.efforts : '-',
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
