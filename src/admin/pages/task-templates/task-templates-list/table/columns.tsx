/* eslint-disable @typescript-eslint/no-explicit-any */
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
  memoizedStatus: SelectOption[],
  taskCategoryTypesOptions: SelectOption[],
  taskWeightAgeTypesOptions: SelectOption[],
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  onClick?: (row: TaskTemplateList) => void
  // permissionMap: Record<string, { read: boolean; edit: boolean }>,
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
    editable: false,
    hide:
      !permissionMap?.['r_number']?.edit && !permissionMap?.['r_number']?.read,
    render: (row: TaskTemplateList) =>
      onClick ? (
        <span
          onClick={() => onClick(row)}
          className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
        >
          {row.r_number}
        </span>
      ) : (
        row.r_number
      ),
  },
  {
    id: 'task_name',
    editId: 'task_name',
    editable:
      permissionMap?.['task_name']?.edit && permissionMap?.['task_name']?.read,
    hide:
      !permissionMap?.['task_name']?.edit &&
      !permissionMap?.['task_name']?.read,
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
          errorMessage: 'Task Name must be at least 2 characters long',
        },
        {
          regex: REGEX_PATTERNS.MAX_150,
          errorMessage: 'Max length exceeded',
        },
      ],
    },
  },
  {
    id: 'effort_in_days',
    editId: 'effort_in_days',
    sortId: 'effort_in_days',
    label: 'Efforts In Days',
    width: 130,
    sortable: true,
    conditionallyEdit: [{ key: 'task_type_name', matchValue: ['Milestone'] }],
    editable:
      permissionMap?.['effort_in_days']?.edit &&
      permissionMap?.['effort_in_days']?.read,
    hide:
      !permissionMap?.['effort_in_days']?.edit &&
      !permissionMap?.['effort_in_days']?.read,
    field: {
      type: 'text',
      required: true,
      placeholder: 'Enter Efforts In Days',
      validation: [
        {
          regex: REGEX_PATTERNS.ALLOW_ONE_TO_99,
          errorMessage:
            'Only positive numbers allowed, from 1 to 99 are allowed. ',
        },
      ],
    },
    render: (row) =>
      row.effort_in_days !== null && row.effort_in_days !== undefined
        ? row.effort_in_days
        : '-',
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
    id: 'milestone_name',
    editId: 'milestone_template_rid',
    editable:
      permissionMap?.['milestone_type_rid']?.edit &&
      permissionMap?.['milestone_type_rid']?.read,
    hide:
      !permissionMap?.['milestone_type_rid']?.edit &&
      !permissionMap?.['milestone_type_rid']?.read,
    sortId: 'milestone_name',
    label: 'Milestone Name',
    width: 200,
    sortable: true,
    conditionallyEdit: [{ key: 'task_type_name', matchValue: ['Milestone'] }],
    field: {
      type: 'select',
      required: true,
      placeholder: 'Choose Milestone Type',
      options: taskMilestoneTypesOptions,
    },
  },
  {
    id: 'role_name',
    editId: 'case_team_member_role_rid',
    editable:
      permissionMap?.['case_team_member_role_rid']?.edit &&
      permissionMap?.['case_team_member_role_rid']?.read,
    hide:
      !permissionMap?.['case_team_member_role_rid']?.edit &&
      !permissionMap?.['case_team_member_role_rid']?.read,
    sortId: 'role_name',
    label: 'Assign Role',
    width: 230,
    sortable: true,
    conditionallyEdit: [{ key: 'task_type_name', matchValue: ['Milestone'] }],
    field: {
      type: 'select',
      required: false,
      placeholder: 'Choose Assign Role',
      options: taskAssigneRoleTypesTypesOptions,
    },
  },
  {
    id: 'priority_name',
    editId: 'priority_rid',
    editable:
      permissionMap?.['priority_rid']?.edit &&
      permissionMap?.['priority_rid']?.read,
    hide:
      !permissionMap?.['priority_rid']?.edit &&
      !permissionMap?.['priority_rid']?.read,
    sortId: 'priority_name',
    label: 'Priority',
    width: 130,
    sortable: true,
    field: {
      type: 'select',
      required: false,
      placeholder: 'Choose Priority',
      options: taskPrioritytTypesTypesOptions,
    },
  },
  {
    id: 'checklist_name',
    editId: 'checklist_template_rid',
    editable:
      permissionMap?.['checklist']?.edit && permissionMap?.['checklist']?.read,
    hide:
      !permissionMap?.['checklist']?.edit &&
      !permissionMap?.['checklist']?.read,
    sortId: 'checklist_name',
    label: 'Checklist',
    width: 130,
    sortable: true,
    field: {
      type: 'select',
      required: false,
      placeholder: 'Choose Checklist',
      options: taskCheckListTypesTypesOptions,
    },
  },
  {
    id: 'category_name',
    editId: 'task_category_rid',
    editable:
      permissionMap?.['task_category_rid']?.edit &&
      permissionMap?.['task_category_rid']?.read,
    hide:
      !permissionMap?.['task_category_rid']?.edit &&
      !permissionMap?.['task_category_rid']?.read,
    sortId: 'category_name',
    label: 'Task Category',
    width: 130,
    sortable: true,
    conditionallyEdit: [{ key: 'task_type_name', matchValue: ['Milestone'] }],
    field: {
      type: 'select',
      required: false,
      placeholder: 'Choose Category',
      options: taskCategoryTypesOptions,
    },
  },
  {
    id: 'weightage_value',
    editId: 'weightage_rid',
    conditionallyEdit: [{ key: 'task_type_name', matchValue: ['Milestone'] }],
    editable:
      permissionMap?.['weightage_rid']?.edit &&
      permissionMap?.['weightage_rid']?.read,
    hide:
      !permissionMap?.['weightage_rid']?.edit &&
      !permissionMap?.['weightage_rid']?.read,
    sortId: 'weightage_value',
    label: 'Weightage',
    width: 145,
    sortable: true,
    field: {
      type: 'select',
      required: false,
      placeholder: 'Choose Weightage',
      options: taskWeightAgeTypesOptions,
    },
  },
  {
    id: 'status_name',
    editId: 'status_rid',
    editable:
      permissionMap?.['status_rid']?.edit &&
      permissionMap?.['status_rid']?.read,
    hide:
      !permissionMap?.['status_rid']?.edit &&
      !permissionMap?.['status_rid']?.read,
    sortId: 'status_name',
    label: 'Status',
    width: 130,
    sortable: true,
    field: {
      type: 'select',
      required: false,
      placeholder: 'Choose Status',
      options: memoizedStatus,
    },
  },
  {
    id: 'task_description',
    editId: 'task_description',
    editable:
      permissionMap?.['task_description']?.edit &&
      permissionMap?.['task_description']?.read,
    hide:
      !permissionMap?.['task_description']?.edit &&
      !permissionMap?.['task_description']?.read,
    sortId: 'task_description',
    label: 'Task Description',
    width: 300,
    sortable: true,
    field: {
      type: 'text',
      required: false,
      placeholder: 'Enter Task Description',
      validation: [
        {
          regex: REGEX_PATTERNS.DESCRIPTION,
          errorMessage: 'Description must be within 2000 characters',
        },
      ],
    },
  },
  {
    id: 'created_by_name',
    sortId: 'created_by_name',
    label: 'Created By',
    width: 160,
    sortable: true,
    hide:
      !permissionMap?.['created_by']?.edit &&
      !permissionMap?.['created_by']?.read,
    render: (row) => row.created_by_name || '-',
  },
  {
    id: 'created_datetime',
    sortId: 'created_datetime',
    label: 'Created On',
    hide:
      !permissionMap?.['created_datetime']?.edit &&
      !permissionMap?.['created_datetime']?.read,
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
    hide:
      !permissionMap?.['modified_by']?.edit &&
      !permissionMap?.['modified_by']?.read,
  },
  {
    id: 'modified_datetime',
    sortId: 'modified_datetime',
    label: 'Updated On',
    width: 190,
    hide:
      !permissionMap?.['modified_datetime']?.edit &&
      !permissionMap?.['modified_datetime']?.read,
    sortable: true,
    render: (row) =>
      row.modified_datetime
        ? formatDateToYYYYMMDDWithTime(row.modified_datetime)
        : '-',
  },
];
