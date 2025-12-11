import {
  formatDateToYYYYMMDDWithTime,
  REGEX_PATTERNS,
} from '../../../../../common-utils';
import { ListTableColumn } from '../../../../../components/table/types';
import { SelectOption } from '../../../../types';
import { TaskList } from '../../../../types/task';

export const getTaskTableColumns = (
  onClick: (row: TaskList) => void,
  statusOptions: SelectOption[] = [],
  permissionMap?: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<TaskList>[] => [
  {
    id: 'r_number',
    sortId: 'r_number',
    label: 'Task ID',
    width: 140,
    sortable: true,
    sticky: true,
    // hide: permissionMap ? !permissionMap['r_number']?.read : false,
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
          onClick={(e) => {
            e.stopPropagation();
            onClick(row);
          }}
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
    editable: permissionMap ? permissionMap['task_name']?.edit : true,
    field: {
      type: 'text',
      required: true,
      validation: [
        {
          regex: REGEX_PATTERNS.MIN_3,
          errorMessage: 'Task Name must be more than 2 characters long',
        },
        {
          regex: REGEX_PATTERNS.MAX_ACCOUNT_NAME_REGEX,
          errorMessage: 'Task Name must be less than 125 characters',
        },
      ],
    },
    hide: permissionMap ? !permissionMap['task_name']?.read : false,
  },
  {
    id: 'description',
    sortId: 'description',
    label: 'Description',
    width: 300,
    sortable: true,
    editable: permissionMap
      ? permissionMap['description']?.edit ||
        permissionMap['task_description']?.edit
      : true,
    field: {
      type: 'text',
      required: false,
      validation: [
        {
          regex: REGEX_PATTERNS.MAX_2000,
          errorMessage: 'Description must be within 2000 characters',
        },
      ],
    },
    hide: permissionMap
      ? !(
          permissionMap['description']?.read ||
          permissionMap['task_description']?.read
        )
      : false,
    render: (row: TaskList) => row.description || '-',
  },
  {
    id: 'fiscal_year',
    sortId: 'fiscal_year',
    label: 'Fiscal Year',
    width: 140,
    sortable: true,
    hide: permissionMap ? !permissionMap['fiscal_year']?.read : false,
    render: (row: TaskList) => `FY-${row.fiscal_year}`,
  },
  {
    id: 'attach_to_name',
    sortId: 'attach_to_name',
    label: 'Attach To',
    width: 180,
    sortable: true,
    hide: permissionMap
      ? !(
          permissionMap['attach_to']?.read || permissionMap['attached_to']?.read
        )
      : false,
    render: (row: TaskList) => row.attach_to_name || '-',
  },
  {
    id: 'attachment_level',
    sortId: 'attachment_level',
    label: 'Attachment Level',
    width: 160,
    sortable: true,
    hide: permissionMap ? !permissionMap['attachment_level']?.read : false,
    render: (row: TaskList) => row.attachment_level || '-',
  },
  {
    id: 'assigned_to_name',
    sortId: 'assigned_to_name',
    label: 'Assigned To',
    width: 180,
    sortable: true,
    hide: permissionMap ? !permissionMap['assigned_to']?.read : false,
    render: (row: TaskList) => row.assigned_to_name || '-',
  },
  {
    id: 'priority_name',
    sortId: 'priority_name',
    label: 'Priority',
    width: 120,
    sortable: true,
    hide: permissionMap ? !permissionMap['priority_rid']?.read : false,
    render: (row: TaskList) => row.priority_name || '-',
  },
  {
    id: 'status_name',
    sortId: 'status_name',
    label: 'Status',
    width: 140,
    sortable: true,
    editable: permissionMap ? permissionMap['status_rid']?.edit : true,
    editId: 'status_rid',
    field: {
      type: 'select',
      required: true,
      options: statusOptions,
      placeholder: 'Choose Status',
    },
    hide: permissionMap ? !permissionMap['status_rid']?.read : false,
    render: (row: TaskList) => row.status_name || '-',
  },
  {
    id: 'account_status_name',
    sortId: 'account_status_name',
    label: 'Account Status',
    width: 150,
    sortable: true,
    hide: permissionMap ? !permissionMap['account_status_name']?.read : false,
    render: (row: TaskList) => row.account_status_name || '-',
  },
  {
    id: 'created_by_name',
    sortId: 'created_by_name',
    label: 'Created By',
    width: 180,
    sortable: true,
    hide: permissionMap ? !permissionMap['created_by_name']?.read : false,
  },
  {
    id: 'created_datetime',
    sortId: 'created_datetime',
    label: 'Created On',
    width: 200,
    sortable: true,
    hide: permissionMap ? !permissionMap['created_datetime']?.read : false,
    render: (row: TaskList) =>
      formatDateToYYYYMMDDWithTime(row.created_datetime),
  },
  {
    id: 'modified_by_name',
    sortId: 'modified_by_name',
    label: 'Modified By',
    width: 180,
    sortable: true,
    hide: permissionMap ? !permissionMap['modified_by_name']?.read : false,
    render: (row: TaskList) => row.modified_by_name || '-',
  },
  {
    id: 'modified_datetime',
    sortId: 'modified_datetime',
    label: 'Modified On',
    width: 200,
    sortable: true,
    hide: permissionMap ? !permissionMap['modified_datetime']?.read : false,
    render: (row: TaskList) =>
      row.modified_datetime
        ? formatDateToYYYYMMDDWithTime(row.modified_datetime)
        : '-',
  },
];
