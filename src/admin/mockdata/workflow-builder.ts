import { ConditionCategory } from '../pages/workflow-builder/form/helper';
import {
  ConditionCategoryResponse,
  ConditionListResponse,
  ActionCategoryTypeResponse,
  ActionTypeResponse,
  ScopeEventListResponse,
  ScopeListResponse,
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
      rid: 'D001-00016d03-3333-48d1-a247-64a5139daef9',
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

export const conditionCategories: ConditionCategory[] = [
  {
    id: 'task-state',
    name: 'Task State',
    description: 'Conditions based on task status and properties',
    icon: 'task',
    fields: [
      {
        id: 'task.status',
        name: 'Task Status',
        type: 'select',
        operators: ['equals', 'not_equals', 'in', 'not_in'],
        options: [
          { value: 'Open', label: 'Open' },
          { value: 'In Progress', label: 'In Progress' },
          { value: 'Completed', label: 'Completed' },
          { value: 'Locked', label: 'Locked' },
        ],
      },
      {
        id: 'task.isOverdue',
        name: 'Task is Overdue',
        type: 'boolean',
        operators: ['equals'],
        options: [
          { value: 'true', label: 'True' },
          { value: 'false', label: 'False' },
        ],
      },
      {
        id: 'task.hasDependency',
        name: 'Task Has Dependency',
        type: 'boolean',
        operators: ['equals'],
        options: [
          { value: 'true', label: 'True' },
          { value: 'false', label: 'False' },
        ],
      },
      {
        id: 'task.dependency.status',
        name: 'Task Dependency Status',
        type: 'select',
        operators: ['equals', 'not_equals'],
        options: [
          { value: 'Completed', label: 'Completed' },
          { value: 'Pending', label: 'Pending' },
          { value: 'In Progress', label: 'In Progress' },
        ],
      },
      {
        id: 'task.fieldMissing',
        name: 'Task Field Missing',
        type: 'boolean',
        operators: ['equals'],
        options: [
          { value: 'true', label: 'True' },
          { value: 'false', label: 'False' },
        ],
      },
      {
        id: 'task.assignedUser',
        name: 'Task Assigned User',
        type: 'select',
        operators: ['equals', 'not_equals'],
        placeholder: 'Select user',
      },
      {
        id: 'task.priority',
        name: 'Task Priority',
        type: 'select',
        operators: ['equals', 'not_equals', 'in', 'not_in'],
        options: [
          { value: 'Low', label: 'Low' },
          { value: 'Medium', label: 'Medium' },
          { value: 'High', label: 'High' },
          { value: 'Critical', label: 'Critical' },
        ],
      },
      {
        id: 'task.createdByRole',
        name: 'Task Created By Role',
        type: 'select',
        operators: ['equals', 'not_equals'],
        options: [
          { value: 'CaseOwner', label: 'Case Owner' },
          { value: 'Admin', label: 'Admin' },
          { value: 'User', label: 'User' },
        ],
      },
    ],
  },
  {
    id: 'validation',
    name: 'Validation & Data Quality',
    description: 'Conditions based on data validation results',
    icon: 'validation',
    fields: [
      {
        id: 'validation.status',
        name: 'Validation Status',
        type: 'select',
        operators: ['equals', 'not_equals', 'in', 'not_in'],
        options: [
          { value: 'Pending', label: 'Pending' },
          { value: 'Passed', label: 'Passed' },
          { value: 'Failed', label: 'Failed' },
        ],
      },
      {
        id: 'validation.fieldCount',
        name: 'Validation Field Count',
        type: 'number',
        operators: ['equals', 'not_equals', 'greater_than', 'less_than'],
        placeholder: 'Enter expected field count',
      },
      {
        id: 'validation.mandatoryFieldsFilled',
        name: 'Mandatory Fields Filled',
        type: 'boolean',
        operators: ['equals'],
        options: [
          { value: 'true', label: 'True' },
          { value: 'false', label: 'False' },
        ],
      },
      {
        id: 'validation.aiCheck',
        name: 'AI Check Status',
        type: 'select',
        operators: ['equals', 'not_equals'],
        options: [
          { value: 'Passed', label: 'Passed' },
          { value: 'Failed', label: 'Failed' },
          { value: 'Pending', label: 'Pending' },
        ],
      },
      {
        id: 'validation.confidenceScore',
        name: 'Confidence Score',
        type: 'number',
        operators: ['greater_than', 'less_than', 'equals'],
        placeholder: 'Enter confidence threshold',
      },
      {
        id: 'validation.errorCount',
        name: 'Validation Error Count',
        type: 'number',
        operators: ['greater_than', 'equals', 'less_than'],
        placeholder: 'Enter number of errors',
      },
    ],
  },
  {
    id: 'milestone',
    name: 'Milestone Progress',
    description: 'Conditions based on milestone status and progress',
    icon: 'milestone',
    fields: [
      {
        id: 'milestone.progress',
        name: 'Milestone Progress',
        type: 'number',
        operators: [
          'equals',
          'not_equals',
          'greater_than',
          'less_than',
          'greater_than_or_equal',
          'less_than_or_equal',
        ],
        placeholder: 'Enter progress percentage',
      },
      {
        id: 'milestone.status',
        name: 'Milestone Status',
        type: 'select',
        operators: ['equals', 'not_equals', 'in', 'not_in'],
        options: [
          { value: 'Not Started', label: 'Not Started' },
          { value: 'In Progress', label: 'In Progress' },
          { value: 'Completed', label: 'Completed' },
          { value: 'Blocked', label: 'Blocked' },
        ],
      },
      {
        id: 'milestone.allTasksCompleted',
        name: 'All Tasks Completed',
        type: 'boolean',
        operators: ['equals'],
        options: [
          { value: 'true', label: 'True' },
          { value: 'false', label: 'False' },
        ],
      },
      {
        id: 'milestone.hasRedFlag',
        name: 'Has Red Flag',
        type: 'boolean',
        operators: ['equals'],
        options: [
          { value: 'true', label: 'True' },
          { value: 'false', label: 'False' },
        ],
      },
      {
        id: 'milestone.slaBreached',
        name: 'SLA Breached',
        type: 'boolean',
        operators: ['equals'],
        options: [
          { value: 'true', label: 'True' },
          { value: 'false', label: 'False' },
        ],
      },
      {
        id: 'milestone.requiresApproval',
        name: 'Requires Approval',
        type: 'boolean',
        operators: ['equals'],
        options: [
          { value: 'true', label: 'True' },
          { value: 'false', label: 'False' },
        ],
      },
      {
        id: 'milestone.dependency.status',
        name: 'Milestone Dependency Status',
        type: 'select',
        operators: ['equals', 'not_equals'],
        options: [
          { value: 'Completed', label: 'Completed' },
          { value: 'Pending', label: 'Pending' },
        ],
      },
    ],
  },
  {
    id: 'case-ownership',
    name: 'Case Ownership & Assignment',
    description: 'Conditions based on case ownership and assignment',
    icon: 'assignment',
    fields: [
      {
        id: 'case.owner.role',
        name: 'Case Owner Role',
        type: 'select',
        operators: ['equals', 'not_equals', 'in', 'not_in'],
        options: [
          { value: 'FinancePOC', label: 'Finance POC' },
          { value: 'Admin', label: 'Admin' },
          { value: 'Manager', label: 'Manager' },
          { value: 'CaseOwner', label: 'Case Owner' },
        ],
      },
      {
        id: 'case.owner.active',
        name: 'Case Owner Active',
        type: 'boolean',
        operators: ['equals'],
        options: [
          { value: 'true', label: 'True' },
          { value: 'false', label: 'False' },
        ],
      },
      {
        id: 'case.team.size',
        name: 'Case Team Size',
        type: 'number',
        operators: ['greater_than', 'less_than', 'equals'],
        placeholder: 'Enter team size',
      },
      {
        id: 'case.assignee.available',
        name: 'Case Assignee Available',
        type: 'boolean',
        operators: ['equals'],
        options: [
          { value: 'true', label: 'True' },
          { value: 'false', label: 'False' },
        ],
      },
      {
        id: 'case.owner.changed',
        name: 'Case Owner Changed',
        type: 'boolean',
        operators: ['equals'],
        options: [
          { value: 'true', label: 'True' },
          { value: 'false', label: 'False' },
        ],
      },
      {
        id: 'case.ownership.confirmed',
        name: 'Case Ownership Confirmed',
        type: 'boolean',
        operators: ['equals'],
        options: [
          { value: 'true', label: 'True' },
          { value: 'false', label: 'False' },
        ],
      },
    ],
  },
  {
    id: 'time-sla',
    name: 'Time / SLA / Aging',
    description: 'Conditions based on time, SLA, and aging metrics',
    icon: 'clock',
    fields: [
      {
        id: 'task.dueDate',
        name: 'Task Due Date',
        type: 'date',
        operators: ['before', 'after', 'equals'],
        placeholder: 'Select due date',
      },
      {
        id: 'task.createdAt',
        name: 'Days Since Task Created',
        type: 'number',
        operators: ['greater_than', 'less_than', 'equals'],
        placeholder: 'Enter number of days',
      },
      {
        id: 'task.sla.remainingHours',
        name: 'SLA Remaining Hours',
        type: 'number',
        operators: ['less_than', 'greater_than', 'equals'],
        placeholder: 'Enter remaining hours',
      },
      {
        id: 'milestone.startDate',
        name: 'Milestone Start Date',
        type: 'date',
        operators: ['before', 'after', 'equals'],
        placeholder: 'Select start date',
      },
      {
        id: 'milestone.endDate',
        name: 'Milestone End Date',
        type: 'date',
        operators: ['before', 'after', 'equals'],
        placeholder: 'Select end date',
      },
      {
        id: 'reminder.lastSent',
        name: 'Days Since Last Reminder',
        type: 'number',
        operators: ['greater_than'],
        placeholder: 'Enter number of days',
      },
      {
        id: 'aging.duration',
        name: 'Aging Duration',
        type: 'number',
        operators: ['greater_than'],
        placeholder: 'Enter aging threshold in days',
      },
    ],
  },
  {
    id: 'ai-automation',
    name: 'AI / Automation',
    description: 'Conditions based on AI and automation results',
    icon: 'ai',
    fields: [
      {
        id: 'ai.summaryGenerated',
        name: 'AI Summary Generated',
        type: 'boolean',
        operators: ['equals'],
        options: [
          { value: 'true', label: 'True' },
          { value: 'false', label: 'False' },
        ],
      },
      {
        id: 'ai.questionSetAvailable',
        name: 'AI Question Set Available',
        type: 'boolean',
        operators: ['equals'],
        options: [
          { value: 'true', label: 'True' },
          { value: 'false', label: 'False' },
        ],
      },
      {
        id: 'ai.confidenceScore',
        name: 'AI Confidence Score',
        type: 'number',
        operators: ['less_than', 'greater_than', 'equals'],
        placeholder: 'Enter confidence threshold',
      },
      {
        id: 'ai.dataExtraction.status',
        name: 'AI Data Extraction Status',
        type: 'select',
        operators: ['equals', 'not_equals'],
        options: [
          { value: 'Success', label: 'Success' },
          { value: 'Failed', label: 'Failed' },
          { value: 'In Progress', label: 'In Progress' },
        ],
      },
      {
        id: 'ai.recommendation.accepted',
        name: 'AI Recommendation Accepted',
        type: 'boolean',
        operators: ['equals'],
        options: [
          { value: 'true', label: 'True' },
          { value: 'false', label: 'False' },
        ],
      },
      {
        id: 'ai.triggeredBy',
        name: 'AI Triggered By',
        type: 'select',
        operators: ['equals', 'not_equals'],
        options: [
          { value: 'Manual', label: 'Manual' },
          { value: 'Automatic', label: 'Automatic' },
          { value: 'Scheduled', label: 'Scheduled' },
        ],
      },
    ],
  },
  {
    id: 'system-access',
    name: 'System Lock / Access',
    description: 'Conditions based on system access and locking',
    icon: 'lock',
    fields: [
      {
        id: 'project.status',
        name: 'Project Status',
        type: 'select',
        operators: ['equals', 'not_equals'],
        options: [
          { value: 'Locked', label: 'Locked' },
          { value: 'Active', label: 'Active' },
          { value: 'Archived', label: 'Archived' },
        ],
      },
      {
        id: 'project.mandatoryFieldsMissing',
        name: 'Mandatory Fields Missing',
        type: 'boolean',
        operators: ['equals'],
        options: [
          { value: 'true', label: 'True' },
          { value: 'false', label: 'False' },
        ],
      },
      {
        id: 'user.role',
        name: 'User Role',
        type: 'select',
        operators: ['equals', 'not_equals', 'in', 'not_in'],
        options: [
          { value: 'Admin', label: 'Admin' },
          { value: 'User', label: 'User' },
          { value: 'Viewer', label: 'Viewer' },
          { value: 'Manager', label: 'Manager' },
        ],
      },
      {
        id: 'project.isArchived',
        name: 'Project is Archived',
        type: 'boolean',
        operators: ['equals'],
        options: [
          { value: 'true', label: 'True' },
          { value: 'false', label: 'False' },
        ],
      },
      {
        id: 'form.version',
        name: 'Form Version',
        type: 'select',
        operators: ['equals', 'not_equals'],
        options: [
          { value: 'latestVersion', label: 'Latest Version' },
          { value: 'previousVersion', label: 'Previous Version' },
        ],
      },
    ],
  },
  {
    id: 'notification',
    name: 'Notification / Engagement',
    description: 'Conditions based on notifications and user engagement',
    icon: 'notification',
    fields: [
      {
        id: 'notification.type',
        name: 'Notification Type',
        type: 'select',
        operators: ['equals', 'not_equals', 'in', 'not_in'],
        options: [
          { value: 'Reminder', label: 'Reminder' },
          { value: 'Alert', label: 'Alert' },
          { value: 'Update', label: 'Update' },
          { value: 'Approval', label: 'Approval' },
        ],
      },
      {
        id: 'notification.lastSent',
        name: 'Hours Since Last Notification',
        type: 'number',
        operators: ['greater_than'],
        placeholder: 'Enter hours since last sent',
      },
      {
        id: 'notification.status',
        name: 'Notification Status',
        type: 'select',
        operators: ['equals', 'not_equals'],
        options: [
          { value: 'Failed', label: 'Failed' },
          { value: 'Sent', label: 'Sent' },
          { value: 'Pending', label: 'Pending' },
        ],
      },
      {
        id: 'recipient.preference',
        name: 'Recipient Preference',
        type: 'select',
        operators: ['equals', 'not_equals'],
        options: [
          { value: 'Email', label: 'Email' },
          { value: 'SMS', label: 'SMS' },
          { value: 'Push', label: 'Push Notification' },
        ],
      },
      {
        id: 'recipient.isActive',
        name: 'Recipient is Active',
        type: 'boolean',
        operators: ['equals'],
        options: [
          { value: 'true', label: 'True' },
          { value: 'false', label: 'False' },
        ],
      },
      {
        id: 'engagement.count',
        name: 'Engagement Count',
        type: 'number',
        operators: ['less_than', 'greater_than', 'equals'],
        placeholder: 'Enter engagement count',
      },
    ],
  },
  {
    id: 'integration',
    name: 'Integration / External Systems',
    description: 'Conditions based on external system integrations',
    icon: 'integration',
    fields: [
      {
        id: 'integration.system',
        name: 'Integration System',
        type: 'select',
        operators: ['equals', 'not_equals'],
        options: [
          { value: 'GovtPortal', label: 'Government Portal' },
          { value: 'CRM', label: 'CRM System' },
          { value: 'ERP', label: 'ERP System' },
          { value: 'PaymentGateway', label: 'Payment Gateway' },
        ],
      },
      {
        id: 'integration.status',
        name: 'Integration Status',
        type: 'select',
        operators: ['equals', 'not_equals'],
        options: [
          { value: 'Success', label: 'Success' },
          { value: 'Failed', label: 'Failed' },
          { value: 'Pending', label: 'Pending' },
          { value: 'Retrying', label: 'Retrying' },
        ],
      },
      {
        id: 'integration.retryCount',
        name: 'Integration Retry Count',
        type: 'number',
        operators: ['less_than', 'greater_than', 'equals'],
        placeholder: 'Enter retry count',
      },
      {
        id: 'integration.apiAvailable',
        name: 'API Available',
        type: 'boolean',
        operators: ['equals'],
        options: [
          { value: 'true', label: 'True' },
          { value: 'false', label: 'False' },
        ],
      },
      {
        id: 'integration.authToken.valid',
        name: 'Auth Token Valid',
        type: 'boolean',
        operators: ['equals'],
        options: [
          { value: 'true', label: 'True' },
          { value: 'false', label: 'False' },
        ],
      },
      {
        id: 'integration.payload.size',
        name: 'Payload Size (MB)',
        type: 'number',
        operators: ['less_than'],
        placeholder: 'Enter max payload size in MB',
      },
    ],
  },
  {
    id: 'logical',
    name: 'Logical / Advanced',
    description: 'Advanced logical conditions and expressions',
    icon: 'logic',
    fields: [
      {
        id: 'condition.and',
        name: 'AND Condition',
        type: 'logical',
        operators: ['and', 'or', 'not', 'xor'],
      },
      {
        id: 'condition.or',
        name: 'OR Condition',
        type: 'logical',
        operators: ['and', 'or', 'not', 'xor'],
      },
      {
        id: 'condition.not',
        name: 'NOT Condition',
        type: 'logical',
        operators: ['and', 'or', 'not', 'xor'],
      },
      {
        id: 'condition.xor',
        name: 'XOR Condition',
        type: 'logical',
        operators: ['and', 'or', 'not', 'xor'],
      },
      {
        id: 'condition.expression',
        name: 'Custom Expression',
        type: 'boolean',
        operators: ['true', 'false'],
      },
    ],
  },
];

export const operators = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'greater_than_or_equal', label: 'Greater Than or Equal' },
  { value: 'less_than_or_equal', label: 'Less Than or Equal' },
  { value: 'in', label: 'In' },
  { value: 'not_in', label: 'Not In' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'and', label: 'AND' },
  { value: 'or', label: 'OR' },
  { value: 'not', label: 'NOT' },
  { value: 'xor', label: 'XOR' },
];
