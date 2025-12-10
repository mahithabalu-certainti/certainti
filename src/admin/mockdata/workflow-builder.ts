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
