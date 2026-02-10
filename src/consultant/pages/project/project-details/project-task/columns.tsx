import {
  costDisplay,
  getDateFormat,
  PROJECT_TASK_REGEX,
  REGEX_PATTERNS,
  valueDisplay,
} from '../../../../../common-utils';
import TextButton from '../../../../../components/button/text-button';
import {
  DependencyRowData,
  ListTableColumn,
} from '../../../../../components/table/types';
import { FormFiscalDateType, SelectOption } from '../../../../types';
import { ProjectTaskListType } from '../../../../types/project-task';

export const formatDateToYMD = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};
export const getProjectTaskColumns = (
  onClick: (row: ProjectTaskListType) => void,
  handleAttachmentClick: (rowId: string) => void,
  handleCreateNote: (row: ProjectTaskListType) => void,
  handleCreateChecklist: (row: ProjectTaskListType) => void,
  memoizedProjectResourceCode: SelectOption[],
  TaskTypeOptions: SelectOption[],
  classificationOptions: SelectOption[],
  permissionMapTaskTableColumn: Record<
    string,
    { read: boolean; edit: boolean }
  >,
  accountOrProjectInActive?: boolean,
  fiscalDate?: FormFiscalDateType,
  isAttachmentCreateEnable?: boolean,
  isNoteCreateEnable?: boolean,
  isChecklistCreateEnable?: boolean,
  isProjectSignedOff?: boolean
): ListTableColumn<ProjectTaskListType>[] => [
    {
      id: 'resource_code',
      label: 'Resource Code',
      sortable: true,
      editId: 'resource_code',
      sortId: 'resource_code',
      width: 160,
      sticky: true,
      sx: {
        position: 'sticky',
        left: 0,
        background: '#fff',
        zIndex: 10,
        borderRight: '1px solid #CBD6E2 !important',
        borderBottom: '1px solid #CBD6E2 !important',
      },
      editable:
        permissionMapTaskTableColumn?.['resource_code']?.read &&
        permissionMapTaskTableColumn?.['resource_code']?.edit &&
        !accountOrProjectInActive &&
        !isProjectSignedOff,
      hide:
        !permissionMapTaskTableColumn?.['resource_code']?.read &&
        !permissionMapTaskTableColumn?.['resource_code']?.edit,
      field: {
        type: 'select',
        options: memoizedProjectResourceCode,
        required: true,
      },
      render: (row: ProjectTaskListType) => (
        <span
          className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
          onClick={() => onClick(row)}
        >
          {row.resource_code}
        </span>
      ),
    },
    {
      id: 'resource_name',
      label: 'Resource Name',
      sortable: true,
      sortId: 'resource_name',
      width: 160,
      hide:
        !permissionMapTaskTableColumn?.['resource_name']?.read &&
        !permissionMapTaskTableColumn?.['resource_name']?.edit,
    },
    {
      id: 'task_name',
      label: 'Task Name',
      editId: 'task_name',
      sortable: true,
      sortId: 'task_name',
      width: 160,
      field: {
        type: 'text',
        required: false,
        placeholder: 'Enter Task Name',
        validation: [
          {
            regex: REGEX_PATTERNS.MIN_3,
            errorMessage: 'Task Name must be more than 2 characters long',
          },
          {
            regex: REGEX_PATTERNS.MAX_250,
            errorMessage: 'Max length exceeded',
          },
        ],
      },

      editable:
        permissionMapTaskTableColumn?.['task_name']?.read &&
        permissionMapTaskTableColumn?.['task_name']?.edit &&
        !accountOrProjectInActive &&
        !isProjectSignedOff,
      hide:
        !permissionMapTaskTableColumn?.['task_name']?.read &&
        !permissionMapTaskTableColumn?.['task_name']?.edit,
    },
    {
      id: 'resource_type_name',
      label: 'Resource Type',
      sortable: true,
      sortId: 'resource_type',
      width: 160,
      hide:
        !permissionMapTaskTableColumn?.['resource_type_name']?.read &&
        !permissionMapTaskTableColumn?.['resource_type_name']?.edit,
    },
    {
      id: 'project_resource_role',
      label: 'Project Resource Role',
      sortable: true,
      sortId: 'project_resource_role',
      width: 200,
      hide:
        !permissionMapTaskTableColumn?.['project_resource_role']?.read &&
        !permissionMapTaskTableColumn?.['project_resource_role']?.edit,
    },
    {
      id: 'task_type_name',
      editId: 'task_type_rid',
      sortId: 'task_type_name',
      label: 'Task Type',
      width: 140,
      sortable: true,
      editable:
        permissionMapTaskTableColumn?.['task_type_rid']?.read &&
        permissionMapTaskTableColumn?.['task_type_rid']?.edit &&
        !accountOrProjectInActive &&
        !isProjectSignedOff,
      hide:
        !permissionMapTaskTableColumn?.['task_type_rid']?.read &&
        !permissionMapTaskTableColumn?.['task_type_rid']?.edit,
      field: {
        type: 'select',
        required: false,
        placeholder: 'Choose Task Type',
        options: TaskTypeOptions,
      },
    },
    {
      id: 'task_classification_name',
      editId: 'task_classification_rid',
      sortId: 'task_classification_name',
      label: 'Classification  Type',
      width: 180,
      sortable: true,
      editable:
        permissionMapTaskTableColumn?.['task_classification_rid']?.read &&
        permissionMapTaskTableColumn?.['task_classification_rid']?.edit &&
        !accountOrProjectInActive &&
        !isProjectSignedOff,
      hide:
        !permissionMapTaskTableColumn?.['task_classification_rid']?.read &&
        !permissionMapTaskTableColumn?.['task_classification_rid']?.edit,
      field: {
        type: 'select',
        required: false,
        placeholder: 'Choose Classification Type',
        options: classificationOptions,
      },
    },
    {
      id: 'start_date',
      label: 'Start Date',
      sortable: true,
      editId: 'start_date',
      sortId: 'start_date',
      width: 160,
      editable:
        permissionMapTaskTableColumn?.['start_date']?.read &&
        permissionMapTaskTableColumn?.['start_date']?.edit &&
        !accountOrProjectInActive &&
        !isProjectSignedOff,
      hide:
        !permissionMapTaskTableColumn?.['start_date']?.read &&
        !permissionMapTaskTableColumn?.['start_date']?.edit,
      field: {
        type: 'date',
        required: false,
        placeholder: 'YYYY-MM-DD',
        dateConfig: {
          disableFutureDates: true,
          minDate: fiscalDate?.startMin,
          maxDate: fiscalDate?.startMax,
          startFieldId: 'start_date',
          endFieldId: 'end_date',
        },
        getFieldData: (rowData: DependencyRowData) => {
          return String(rowData.start_date);
        },
        resetDependentFields: ['end_date'],
        dependencies: [
          {
            dependsOn: ['end_date'],
            action: 'enable',
            condition: (value) => !value,
            message: '',
          },
        ],
      },
      render: (row: ProjectTaskListType) =>
        row.start_date ? getDateFormat(row.start_date) : '-',
    },
    {
      id: 'end_date',
      label: 'End Date',
      sortable: true,
      editId: 'end_date',
      sortId: 'end_date',
      width: 160,
      editable:
        permissionMapTaskTableColumn?.['end_date']?.read &&
        permissionMapTaskTableColumn?.['end_date']?.edit &&
        !accountOrProjectInActive &&
        !isProjectSignedOff,
      hide:
        !permissionMapTaskTableColumn?.['end_date']?.read &&
        !permissionMapTaskTableColumn?.['end_date']?.edit,
      field: {
        type: 'date',
        required: false,
        placeholder: 'YYYY-MM-DD',
        dateConfig: {
          disableFutureDates: true,
          minDate: fiscalDate?.startMin,
          maxDate: fiscalDate?.endMax,
          startFieldId: 'start_date',
          endFieldId: 'end_date',
        },
        getFieldData: (rowData: DependencyRowData) => {
          return String(rowData.end_date);
        },
        dependencies: [
          {
            dependsOn: ['start_date'],
            condition: (_, rowData) => {
              const startDate = rowData.start_date;
              return !startDate;
            },
            action: 'disabled',
            message: '',
          },
        ],
      },
      render: (row: ProjectTaskListType) =>
        row.end_date ? getDateFormat(row.end_date) : '-',
    },
    {
      id: 'total_cost_pro_task',
      label: 'Cost',
      sortable: true,
      editId: 'total_cost_pro_task',
      sortId: 'total_cost_pro_task',
      width: 130,
      sx: {
        textAlign: 'right',
      },
      editable:
        permissionMapTaskTableColumn?.['total_cost_pro_task']?.read &&
        permissionMapTaskTableColumn?.['total_cost_pro_task']?.edit &&
        !accountOrProjectInActive &&
        !isProjectSignedOff,
      hide:
        !permissionMapTaskTableColumn?.['total_cost_pro_task']?.read &&
        !permissionMapTaskTableColumn?.['total_cost_pro_task']?.edit,
      field: {
        type: 'text',
        required: false,
        formatCostNumber: true,
        placeholder: 'Enter Cost',
        allowNegative: true,
        validation: [
          {
            regex: PROJECT_TASK_REGEX.COST_REGEX,
            errorMessage: 'Cost must be a number allowed, up to 16 digits and 2 decimal places',
          },
        ],
      },
      render: (row: ProjectTaskListType) =>
        row.total_cost_pro_task
          ? costDisplay(row.total_cost_pro_task, row.currency_symbol)
          : '-',
    },
    {
      id: 'total_hours_pro_task',
      label: 'Effort in Hrs',
      sortable: true,
      editId: 'total_hours_pro_task',
      sortId: 'total_hours_pro_task',
      width: 170,
      sx: {
        textAlign: 'right',
      },
      editable:
        permissionMapTaskTableColumn?.['total_hours_pro_task']?.read &&
        permissionMapTaskTableColumn?.['total_hours_pro_task']?.edit &&
        !accountOrProjectInActive &&
        !isProjectSignedOff,
      hide:
        !permissionMapTaskTableColumn?.['total_hours_pro_task']?.read &&
        !permissionMapTaskTableColumn?.['total_hours_pro_task']?.edit,
      field: {
        type: 'text',
        formatCostNumber: true,
        required: false,
        placeholder: 'Enter an effort',
        validation: [
          {
            regex: PROJECT_TASK_REGEX.EFFORT,
            errorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
          },
        ],
      },
      render: (row: ProjectTaskListType) =>
        row.total_hours_pro_task ? valueDisplay(row.total_hours_pro_task) : '-',
    },
    {
      id: 'status_name',
      sortId: 'status_name',
      label: 'Status',
      width: 130,
      sortable: true,
      // hide:
      //   !permissionMapTaskTableColumn?.['status_rid']?.edit &&
      //   !permissionMapTaskTableColumn?.['status_rid']?.read,
      render: (row: ProjectTaskListType) => (
        <span
          className={`${row.status_name === 'Active'
            ? 'text-[#199806]'
            : row.status_name === 'In-Active'
              ? 'text-[#f44336] '
              : ''
            }`}
        >
          {row.status_name || '-'}
        </span>
      ),
    },
    {
      id: 'comments',
      label: 'Comments',
      editId: 'comments',
      sortable: true,
      sortId: 'comments',
      width: 200,
      editable:
        permissionMapTaskTableColumn?.['comments']?.read &&
        permissionMapTaskTableColumn?.['comments']?.edit &&
        !accountOrProjectInActive &&
        !isProjectSignedOff,
      hide:
        !permissionMapTaskTableColumn?.['comments']?.read &&
        !permissionMapTaskTableColumn?.['comments']?.edit,
      field: {
        type: 'text',
        required: false,
        placeholder: 'Enter Comments',
        validation: [
          {
            regex: PROJECT_TASK_REGEX.DESCRIPTION,
            errorMessage: 'Maximum 2000 characters allowed',
          },
        ],
      },
    },
    {
      id: 'r_number',
      label: 'Project Task ID',
      sortable: true,
      sortId: 'r_number',
      width: 140,
      hide:
        !permissionMapTaskTableColumn?.['r_number']?.read &&
        !permissionMapTaskTableColumn?.['r_number']?.edit,
    },
    {
      id: 'attachments',
      sortId: 'attachments',
      label: 'Attachments',
      width: 100,
      sortable: false,
      hide: !isAttachmentCreateEnable,
      render: (row) => (
        <TextButton
          label='Add'
          disabled={accountOrProjectInActive}
          sx={{ width: '45px', minWidth: '45px', maxWidth: '45px', ml: 2.5 }}
          onClick={() => handleAttachmentClick?.(row.rid ?? '')}
        />
      ),
    },
    {
      id: 'notes',
      sortId: 'notes',
      label: 'Notes',
      width: 80,
      sortable: false,
      hide: !isNoteCreateEnable,
      sx: {
        textAlign: 'center',
      },
      render: (row) => (
        <TextButton
          label='Add'
          disabled={accountOrProjectInActive}
          sx={{ width: '45px', minWidth: '45px', maxWidth: '45px' }}
          onClick={() => handleCreateNote(row)}
        />
      ),
    },
    {
      id: 'checklists',
      sortId: 'checklists',
      label: 'Checklists',
      width: 80,
      sortable: false,
      hide: !isChecklistCreateEnable,
      sx: {
        textAlign: 'center',
      },
      render: (row) => (
        <TextButton
          label='Add'
          disabled={accountOrProjectInActive}
          sx={{ width: '45px', minWidth: '45px', maxWidth: '45px' }}
          onClick={() => handleCreateChecklist(row)}
        />
      ),
    },
  ];
