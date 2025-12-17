import {
  ConditionCategoryResponse,
  ConditionListResponse,
  ActionCategoryTypeResponse,
  ActionTypeResponse,
  ScopeEventListResponse,
  ScopeListResponse,
  RuleCategoryFieldsResponse,
  RuleFieldOperatorsResponse,
  RuleFieldValuesResponse,
  RuleDetailsResponse,
  WorkflowRuleListResponse,
} from '../types';

export const ScopeListMockData: ScopeListResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Operation completed successfully!',
  data: {
    scopes: [
      {
        rid: 'D001-00016d03-1684-48d1-a247-64a5139daef9',
        name: 'Case',
      },
      {
        rid: 'D001-00016d03-1684-48d1-a247-64a5139daef8',
        name: 'Account',
      },
      {
        rid: 'D001-00016d03-1684-48d1-a247-64a5139daef5',
        name: 'Project',
      },
      {
        rid: 'D001-00016d03-1684-48d1-a247-64a5139daef6',
        name: 'Case Task',
      },
    ],
  },
};

export const ScopeEventListMockData: ScopeEventListResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Operation completed successfully!',
  data: [
    {
      rid: 'D001-00016d03-3333-48d1-a247-64a5139daef9',
      event_name: 'case assigned',
      description: 'creating the case',
      scope_type_name: 'Case',
      scope_type_rid: 'D001-00016d03-1684-48d1-a247-64a5139daef9',
    },
    {
      rid: 'D001-00016d03-5555-48d1-a247-64a5139daef9',
      event_name: 'case updated',
      description: 'creating the case',
      scope_type_name: 'Case',
      scope_type_rid: 'D001-00016d03-1684-48d1-a247-64a5139daef9',
    },
    {
      rid: 'D001-00016d03-5544-48d1-a247-64a5139daef9',
      event_name: 'case created',
      description: 'creating the case',
      scope_type_name: 'Case',
      scope_type_rid: 'D001-00016d03-1684-48d1-a247-64a5139daef9',
    },
    {
      rid: 'D001-00016d03-6675-48d1-a247-64a5139daef9',
      event_name: 'task assisgned',
      description: 'updating the task',
      scope_type_name: 'Case Task',
      scope_type_rid: 'D001-00016d03-1684-48d1-a247-64a5139daef6',
    },
    {
      rid: 'D001-00016d03-7899-48d1-a247-64a5139daef9',
      event_name: 'task updated',
      description: 'updating the task',
      scope_type_name: 'Case Task',
      scope_type_rid: 'D001-00016d03-1684-48d1-a247-64a5139daef6',
    },
    {
      rid: 'D001-00016d03-1684-5544-a247-64a5139daef9',
      event_name: 'task created',
      description: 'creating the task',
      scope_type_name: 'Case Task',
      scope_type_rid: 'D001-00016d03-1684-48d1-a247-64a5139daef6',
    },
  ],
};

export const ConditionListMockData: ConditionListResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Operation completed successfully!',
  data: [
    {
      rid: 'D001-00016d03-3333-48d1-a247-64a5139daef8',
      condition_name: 'if(Add a condition)',
      description: 'used to check condition',
      condition_type: 'if',
    },
    {
      rid: 'D001-00016d03-5555-48d1-a247-64a5139daef9',
      condition_name: 'then(Add a action)',
      description: 'defines what system to',
      condition_type: 'then',
    },
  ],
};

export const ConditionCategoryMockData: ConditionCategoryResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Operation completed successfully!',
  data: [
    {
      rid: 'D001-00016d03-3333-48d1-a247-64a5139daef9',
      category_name: 'status',
      description: 'based on status',
    },
    {
      rid: 'D001-00016d03-5555-48d1-a247-64a5139daef9',
      category_name: 'validation',
      description: 'based on validation',
    },
    {
      rid: 'D001-00016d03-5544-48d1-a247-64a5139daef9',
      category_name: 'milestone',
      description: 'based on milestone',
    },
  ],
};

export const ActionTypeMockData: ActionTypeResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Operation completed successfully!',
  data: [
    {
      rid: 'D001-00016d03-3333-48d1-a247-443a5139daef9',
      name: 'create task',
      description: 'create a new task',
      action_type_name: 'Data Validation and Quality Actions',
      action_type_rid: 'D001-00016d03-5555-48d1-a247-64a5139daef9',
    },
    {
      rid: 'D001-00016d03-5555-48d1-a247-64a5d39daef9',
      name: 'Assign task',
      description: 'assign a new task',
      action_type_name: 'Task Management Actions',
      action_type_rid: 'D001-00016d03-3333-48d1-a247-64a5139daef9',
    },
  ],
};

export const ActionCategoryTypeMockData: ActionCategoryTypeResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Operation completed successfully!',
  data: [
    {
      rid: 'D001-00016d03-3333-48d1-a247-64a5139daef9',
      name: 'Task Management Actions',
    },
    {
      rid: 'D001-00016d03-5555-48d1-a247-64a5139dadf9',
      name: 'Milestone Actions',
    },
    {
      rid: 'D001-00016d03-5555-48d1-a247-64a5139daef9',
      name: 'Data Validation and Quality Actions',
    },
  ],
};

export const RuleCategoryFieldsMockData: RuleCategoryFieldsResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Operation completed successfully!',
  data: [
    { rid: 'D001-00016d03-3333-48d1-a247-64a5139daef9', name: 'task.status' },
    { rid: 'D001-00016d03-5555-48d1-a247-64a5139daef9', name: 'task.overdue' },
  ],
};

export const RuleFieldOperatorsMockData: RuleFieldOperatorsResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Operation completed successfully!',
  data: [
    {
      rid: 'D001-00016d03-3333-48d1-a247-64a5139daef9',
      name: 'AND',
    },
    {
      rid: 'D001-00016d03-5555-48d1-a247-64a5139daef9',
      name: 'OR',
    },
  ],
};

export const RuleFieldValuesMockData: RuleFieldValuesResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Operation completed successfully!',
  data: [
    {
      rid: 'D001-00016d03-3333-48d1-a247-64a5139daef9',
      name: 'open',
    },
    {
      rid: 'D001-00016d03-5555-48d1-a247-64a5139daef9',
      name: 'close',
    },
  ],
};

export const RuleDetailsMockData: RuleDetailsResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Operation completed successfully!',
  data: {
    rule: {
      rid: 'D001-ec02dad8-a8f5-4f99-a768-c7e884f76ea8',
      r_number: null,
      eid: null,
      rule_name: 'First Rule Check',
      description: '',
      event_rid: 't1',
      trigger_type: 1,
      condition_rid: 'ec1',
      is_active: true,
      scope_type_rid: 'D001-00016d03-1684-48d1-a247-64a5139daef6',
      schedule_offset_type: null,
      schedule_offset_value: null,
      created_by: 'test',
      modified_by: 'test',
      created_datetime: '2025-12-11T08:26:19.956Z',
      modified_datetime: '2025-12-11T08:26:19.956Z',
    },
    event: {
      event_rid: 't1',
      event_name: 'task created',
      description: 'creating the task',
    },
    condition: {
      condition_rid: 'ec1',
      condition_name: 'if(Add a condition)',
      description: 'used to check condition',
      condition_type: 'IF',
    },
    conditions: [
      {
        category_rid: 'cc1',
        category_name: 'status',
        category_description: 'based on status',
        category_operator: null,
        field_rid: 'd999883r4',
        field_name: 'task.status',
        operator_rid: 'op1',
        operator_name: 'equals',
        value_rid: 'v1',
        value_name: 'open',
      },
      {
        category_rid: 'cc2',
        category_name: 'validation',
        category_description: 'based on validation',
        category_operator: 'AND',
        field_rid: 'd999883r5',
        field_name: 'task.overdue',
        operator_rid: 'op2',
        operator_name: 'equals',
        value_rid: 'v2',
        value_name: 'close',
      },
    ],
    actions: [
      {
        action_rid: 'sa1',
        action_name: 'create task',
        description: 'create a new task',
      },
      {
        action_rid: 'sa2',
        action_name: 'Assign task',
        description: 'assign a new task',
      },
    ],
  },
};

export const WorkflowRuleListMockData: WorkflowRuleListResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Operation completed successfully!',
  data: {
    rules: [
      {
        rid: 'D001-7666545b-4e8a-44fc-83c6-dba86135282d',
        r_number: 'RL0000000001',
        eid: null,
        rule_name: 'Auto Assign High Priority Tasks',
        description: 'Automatically assign high priority tasks to senior users',
        event_rid: 'TASK_CREATED',
        trigger_type: 1,
        condition_rid: 'COND_STATUS_PRIORITY',
        is_active: true,
        scope_type_rid: 'TASK_SCOPE',
        schedule_offset_type: null,
        schedule_offset_value: null,
        created_by: 'admin',
        modified_by: 'admin',
        created_datetime: '2025-12-15T09:30:00.000Z',
        modified_datetime: '2025-12-15T09:30:00.000Z',
      },
      {
        rid: 'D001-ec02dad8-a8f5-4f99-a768-c7e884f76ea8',
        r_number: 'RL0000000002',
        eid: null,
        rule_name: 'Notify on Unassigned Tasks',
        description: 'Send notification when task is unassigned',
        event_rid: 'TASK_UPDATED',
        trigger_type: 2,
        condition_rid: 'COND_ASSIGNEE_EMPTY',
        is_active: true,
        scope_type_rid: 'TASK_SCOPE',
        schedule_offset_type: 'MINUTES',
        schedule_offset_value: '30',
        created_by: 'system',
        modified_by: 'system',
        created_datetime: '2025-12-14T14:10:20.000Z',
        modified_datetime: '2025-12-14T14:10:20.000Z',
      },
      {
        rid: 'D001-9b3c92e2-1f41-4b6f-9c34-9a71d4f92e11',
        r_number: 'RL0000000003',
        eid: null,
        rule_name: 'Overdue Task Escalation',
        description: 'Escalate tasks that are overdue by 7 days',
        event_rid: 'TASK_DUE_DATE_PASSED',
        trigger_type: 3,
        condition_rid: 'COND_DUE_DATE_OVERDUE',
        is_active: true,
        scope_type_rid: 'TASK_SCOPE',
        schedule_offset_type: 'DAYS',
        schedule_offset_value: '7',
        created_by: 'workflow_admin',
        modified_by: 'workflow_admin',
        created_datetime: '2025-12-13T08:45:10.000Z',
        modified_datetime: '2025-12-13T08:45:10.000Z',
      },
      {
        rid: 'D001-1ac7d91f-7e23-4b5b-9b5c-7c17e93c81b3',
        r_number: 'RL0000000004',
        eid: null,
        rule_name: 'Close Completed Tasks',
        description: 'Automatically close tasks marked as completed',
        event_rid: 'TASK_STATUS_CHANGED',
        trigger_type: 2,
        condition_rid: 'COND_STATUS_COMPLETED',
        is_active: false,
        scope_type_rid: 'TASK_SCOPE',
        schedule_offset_type: null,
        schedule_offset_value: null,
        created_by: 'admin',
        modified_by: 'admin',
        created_datetime: '2025-12-12T11:20:55.000Z',
        modified_datetime: '2025-12-14T09:10:00.000Z',
      },
      {
        rid: 'D001-44a8e99f-d01a-41c6-a0e6-93f3b35f8891',
        r_number: 'RL0000000005',
        eid: null,
        rule_name: 'Reminder Before Due Date',
        description: 'Send reminder 1 day before due date',
        event_rid: 'TASK_DUE_DATE_APPROACHING',
        trigger_type: 3,
        condition_rid: 'COND_DUE_DATE_REMINDER',
        is_active: true,
        scope_type_rid: 'TASK_SCOPE',
        schedule_offset_type: 'DAYS',
        schedule_offset_value: '1',
        created_by: 'scheduler',
        modified_by: 'scheduler',
        created_datetime: '2025-12-11T07:55:40.000Z',
        modified_datetime: '2025-12-11T07:55:40.000Z',
      },
      {
        rid: 'D001-0fe38c6b-0c99-4a2b-8a6e-4a1d6a69b812',
        r_number: 'RL0000000006',
        eid: null,
        rule_name: 'Reassign Inactive Tasks',
        description: 'Reassign tasks inactive for more than 5 days',
        event_rid: 'TASK_INACTIVE',
        trigger_type: 3,
        condition_rid: 'COND_TASK_INACTIVE',
        is_active: false,
        scope_type_rid: 'TASK_SCOPE',
        schedule_offset_type: 'DAYS',
        schedule_offset_value: '5',
        created_by: 'system',
        modified_by: 'system',
        created_datetime: '2025-12-10T06:15:30.000Z',
        modified_datetime: '2025-12-12T10:00:00.000Z',
      },
    ],
    count: 6,
  },
};
