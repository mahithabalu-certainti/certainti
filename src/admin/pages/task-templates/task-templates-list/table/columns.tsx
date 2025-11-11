import {
  formatDateToYYYYMMDDWithTime,
  REGEX_PATTERNS,
} from '../../../../../common-utils';
import { ListTableColumn } from '../../../../../components/table/types';
import { SelectOption } from '../../../../../consultant/types';
import { TaskTemplateList } from '../../../../types';

export const getTaskTemplateColumns = (
  taskMilestoneTypesOptions: SelectOption[],
  taskPrioritytTypesTypesOptions: SelectOption[],
  taskCheckListTypesTypesOptions: SelectOption[],
  taskAssigneRoleTypesTypesOptions: SelectOption[],
  memoizedStatus: SelectOption[] // permissionMap: Record<string, { read: boolean; edit: boolean }>,
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
  },
  {
    id: 'task_name',
    editId: 'task_name',
    editable: true,
    sortId: 'task_name',
    label: 'Task Name',
    width: 230,
    sortable: true,
    field: {
      type: 'text',
      required: true,
      placeholder: 'Enter Task Name',
      validation: [
        {
          regex: REGEX_PATTERNS.MIN_3,
          errorMessage: 'Username must be more than 2 characters long',
        },
        {
          regex: REGEX_PATTERNS.MAX_64,
          errorMessage: 'Max length exceeded',
        },
        {
          regex: REGEX_PATTERNS.NAME_REGEX,
          errorMessage:
            "Username must contain only letters, space( ), apostrophes(') and hyphens(-).",
        },
      ],
    },
  },
  {
    id: 'effort_in_days',
    editId: 'effort_in_days',
    editable: true,
    sortId: 'effort_in_days',
    label: 'Efforts In Days',
    width: 130,
    sortable: true,
    field: {
      type: 'text',
      required: true,
      placeholder: 'Enter Task Name',
      // validation: [
      //   {
      //     regex: REGEX_PATTERNS.MIN_3,
      //     errorMessage: 'Username must be more than 2 characters long',
      //   },
      //   {
      //     regex: REGEX_PATTERNS.MAX_64,
      //     errorMessage: 'Max length exceeded',
      //   },
      //   {
      //     regex: REGEX_PATTERNS.NAME_REGEX,
      //     errorMessage:
      //       "Username must contain only letters, space( ), apostrophes(') and hyphens(-).",
      //   },
      // ],
    },
    render: (row) =>
      row.effort_in_days !== null && row.effort_in_days !== undefined
        ? row.effort_in_days
        : '-',
  },
  {
    id: 'reminder_interval',
    editId: 'reminder_interval',
    editable: true,
    sortId: 'reminder_interval',
    label: 'Reminder Interval',
    width: 145,
    sortable: true,
    field: {
      type: 'text',
      required: false,
      placeholder: 'Enter Task Reminder Interval',
    },
    render: (row) =>
      row.reminder_interval !== null && row.reminder_interval !== undefined
        ? row.reminder_interval
        : '-',
  },
  {
    id: 'task_type_name',
    // editId: 'task_type_rid',
    // editable: true,
    sortId: 'task_type_name',
    label: 'Task Type',
    width: 110,
    sortable: true,
    // field: {
    //   type: 'select',
    //   required: true,
    //   placeholder: '',
    //   options: taskTemplateTypesOptions,
    // },
  },
  {
    id: 'milestone_name',
    editId: 'milestone_template_rid',
    editable: true,
    sortId: 'milestone_name',
    label: 'Milestone Name',
    width: 200,
    sortable: true,
    field: {
      type: 'select',
      required: true,
      placeholder: '',
      options: taskMilestoneTypesOptions,
    },
  },
  {
    id: 'role_name',
    editId: 'case_team_member_role_rid',
    editable: true,
    sortId: 'role_name',
    label: 'Assinge Role',
    width: 230,
    sortable: true,
    field: {
      type: 'select',
      required: false,
      placeholder: '',
      options: taskAssigneRoleTypesTypesOptions,
    },
  },
  {
    id: 'priority_name',
    editId: 'priority_rid',
    editable: true,
    sortId: 'priority_name',
    label: 'Priority',
    width: 110,
    sortable: true,
    field: {
      type: 'select',
      required: false,
      placeholder: '',
      options: taskPrioritytTypesTypesOptions,
    },
  },
  {
    id: 'checklist_name',
    editId: 'checklist_template_rid',
    editable: true,
    sortId: 'checklist_name',
    label: 'Checklist',
    width: 130,
    sortable: true,
    field: {
      type: 'select',
      required: false,
      placeholder: '',
      options: taskCheckListTypesTypesOptions,
    },
  },
  {
    id: 'status_name',
    editId: 'status_rid',
    editable: true,
    sortId: 'status_name',
    label: 'Status',
    width: 100,
    sortable: true,
    field: {
      type: 'select',
      required: false,
      placeholder: '',
      options: memoizedStatus,
    },
  },
  {
    id: 'task_description',
    editId: 'task_description',
    editable: true,
    sortId: 'task_description',
    label: 'Task Description',
    width: 300,
    sortable: true,
    field: {
      type: 'text',
      required: false,
      placeholder: 'Enter Task Task Description',
    },
  },
  {
    id: 'created_by_name',
    sortId: 'created_by_name',
    label: 'Created By',
    width: 160,
    sortable: true,
    render: (row) => row.created_by_name || '-',
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
    id: 'modified_by_name',
    sortId: 'modified_by_name',
    label: 'Updated By',
    width: 160,
    sortable: true,
    render: (row) => row.modified_by_name || '-',
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
