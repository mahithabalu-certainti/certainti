import { ListTableColumn } from '../../../../../../../components/table/types';
import { TaskTemplateList } from '../../../../../../types';

export const getTaskTemplateColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<TaskTemplateList>[] => [
  {
    id: 'r_number',
    sortId: 'r_number',
    label: 'Template ID',
    width: 135,
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
    hide:
      !permissionMap?.['r_number']?.edit && !permissionMap?.['r_number']?.read,
    render: (row) => row.r_number,
  },
  {
    id: 'task_name',
    editId: 'task_name',
    hide:
      !permissionMap?.['task_name']?.edit &&
      !permissionMap?.['task_name']?.read,
    sortId: 'task_name',
    label: 'Task Name',
    width: 230,
    sortable: true,
  },
  {
    id: 'task_type_name',
    hide:
      !permissionMap?.['task_type_rid']?.edit &&
      !permissionMap?.['task_type_rid']?.read,
    sortId: 'task_type_name',
    label: 'Task Type',
    width: 110,
    sortable: true,
  },
  {
    id: 'priority_name',
    editId: 'priority_rid',
    hide:
      !permissionMap?.['priority_rid']?.edit &&
      !permissionMap?.['priority_rid']?.read,
    sortId: 'priority_name',
    label: 'Priority',
    width: 130,
    sortable: true,
  },
  {
    id: 'status_name',
    editId: 'status_rid',
    hide:
      !permissionMap?.['status_rid']?.edit &&
      !permissionMap?.['status_rid']?.read,
    sortId: 'status_name',
    label: 'Status',
    width: 130,
    sortable: true,
  },
];
