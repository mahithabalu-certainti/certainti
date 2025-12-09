import { formatDateToYYYYMMDDWithTime } from '../../../../../common-utils';
import { ListTableColumn } from '../../../../../components/table/types';
import { TaskList } from '../../../../types/task';

export const getTaskTableColumns = (
  onClick: (row: TaskList) => void
  // permissionMap?: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<TaskList>[] => [
    {
      id: 'r_number',
      sortId: 'r_number',
      label: 'Task ID',
      width: 140,
      sortable: true,
      sticky: true,
      // hide: !permissionMap?.['r_number']?.read,
      sx: {
        position: 'sticky',
        left: 0,
        background: '#fff',
        zIndex: 10,
        borderRight: '1px solid #CBD6E2 !important',
        borderBottom: '1px solid #CBD6E2 !important',
      },
      render: (row: TaskList) => {
        return (
          <span
            onClick={() => onClick(row)}
            className={`cursor-pointer !text-[#1755E7] !underline !text-[13px] !font-semibold`}
          >
            {row.r_number}
          </span>
        );
      },
    },
    {
      id: 'task_name',
      sortId: 'task_name',
      label: 'Task Name',
      width: 250,
      sortable: true,
      // hide: !permissionMap?.['task_name']?.read,
    },
    {
      id: 'description',
      sortId: 'description',
      label: 'Description',
      width: 300,
      sortable: true,
      // hide: !permissionMap?.['description']?.read,
      render: (row: TaskList) => row.description || '-',
    },
    {
      id: 'fiscal_year',
      sortId: 'fiscal_year',
      label: 'Fiscal Year',
      width: 140,
      sortable: true,
      // hide: !permissionMap?.['fiscal_year']?.read,
      render: (row: TaskList) => `FY-${row.fiscal_year}`,
    },
    {
      id: 'attach_to',
      sortId: 'attach_to',
      label: 'Attach To',
      width: 180,
      sortable: true,
      // hide: !permissionMap?.['attach_to']?.read,
      render: (row: TaskList) => row.attach_to || '-',
    },
    {
      id: 'attachment_level',
      sortId: 'attachment_level',
      label: 'Attachment Level',
      width: 160,
      sortable: true,
      // hide: !permissionMap?.['attachment_level']?.read,
      render: (row: TaskList) => row.attachment_level || '-',
    },
    {
      id: 'assigned_to_name',
      sortId: 'assigned_to_name',
      label: 'Assigned To',
      width: 180,
      sortable: true,
      // hide: !permissionMap?.['assigned_to_name']?.read,
      render: (row: TaskList) => row.assigned_to_name || '-',
    },
    {
      id: 'priority_name',
      sortId: 'priority_name',
      label: 'Priority',
      width: 120,
      sortable: true,
      // hide: !permissionMap?.['priority_name']?.read,
      render: (row: TaskList) => row.priority_name || '-',
    },
    {
      id: 'status_name',
      sortId: 'status_name',
      label: 'Status',
      width: 140,
      sortable: true,
      // hide: !permissionMap?.['status_name']?.read,
      render: (row: TaskList) => row.status_name || '-',
    },
    {
      id: 'account_status_name',
      sortId: 'account_status_name',
      label: 'Account Status',
      width: 150,
      sortable: true,
      // hide: !permissionMap?.['account_status_name']?.read,
      render: (row: TaskList) => row.account_status_name || '-',
    },
    {
      id: 'created_by_name',
      sortId: 'created_by_name',
      label: 'Created By',
      width: 180,
      sortable: true,
      // hide: !permissionMap?.['created_by_name']?.read,
    },
    {
      id: 'created_datetime',
      sortId: 'created_datetime',
      label: 'Created On',
      width: 200,
      sortable: true,
      // hide: !permissionMap?.['created_datetime']?.read,
      render: (row: TaskList) =>
        formatDateToYYYYMMDDWithTime(row.created_datetime),
    },
    {
      id: 'modified_by_name',
      sortId: 'modified_by_name',
      label: 'Modified By',
      width: 180,
      sortable: true,
      // hide: !permissionMap?.['modified_by_name']?.read,
      render: (row: TaskList) => row.modified_by_name || '-',
    },
    {
      id: 'modified_datetime',
      sortId: 'modified_datetime',
      label: 'Modified On',
      width: 200,
      sortable: true,
      // hide: !permissionMap?.['modified_datetime']?.read,
      render: (row: TaskList) =>
        row.modified_datetime
          ? formatDateToYYYYMMDDWithTime(row.modified_datetime)
          : '-',
    },
  ];
