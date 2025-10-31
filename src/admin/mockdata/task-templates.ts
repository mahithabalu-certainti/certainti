import {
  TaskTemplateDetailsResponse,
  TaskTemplateListResponse,
  TaskTemplateTypeResponse,
} from '../types';

export const TaskTemplateMockData: TaskTemplateListResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Operation completed successfully!',
  data: {
    page: 1,
    limit: 100,
    totalCount: 3,
    taskTemplates: [
      {
        rid: 'D001-1a2b3c4d-1111-2222-3333-abcdef123456',
        r_number: 'TTP-0000000001',
        task_name: 'Onboarding Task Template',
        task_description:
          'Template for assigning onboarding tasks to new employees.',
        task_type_name: 'Onboarding',
        task_type_rid: 'D001-7ce23b1c-d28d-4369-b33c-91fbfef3485a',
        efforts: 8,
        created_by: 'D001-09c06141-8832-472f-9a88-74cd917a45bb',
        modified_by: 'D001-09c06141-8832-472f-9a88-74cd917a45bb',
        created_user_name: 'Super User Certainti',
        modified_user_name: 'Super User Certainti',
        created_datetime: '2025-10-05T09:32:44.769+00:00',
        modified_datetime: '2025-10-06T11:21:17.668+00:00',
      },
      {
        rid: 'D001-9f8e7d6c-4444-5555-6666-fedcba654321',
        r_number: 'TTP-0000000002',
        task_name: 'System Access Task Template',
        task_description: 'Used for granting system access tasks to new users.',
        task_type_name: 'Access Setup',
        task_type_rid: 'D001-7ce23b1c-d28d-4369-b33c-91fbfef348ds',
        efforts: 5,
        created_by: 'D001-22a07141-8832-472f-9a88-74cd917a45bb',
        modified_by: null,
        created_user_name: 'Admin User',
        modified_user_name: null,
        created_datetime: '2025-10-10T12:15:44.769+00:00',
        modified_datetime: null,
      },
      {
        rid: 'D001-55aa33cc-7777-8888-9999-123abc987def',
        r_number: 'TTP-0000000003',
        task_name: 'Inactive Task Reminder',
        task_description:
          'Reminder task template for uncompleted user assignments after 30 days.',
        task_type_name: 'Reminder',
        task_type_rid: 'D001-7ce23b1c-d28d-4369-b33c-91fbfef34dsds',
        efforts: 3,
        created_by: 'D001-33b08141-8832-472f-9a88-74cd917a45bb',
        modified_by: 'D001-11d08141-8832-472f-9a88-74cd917a45bb',
        created_user_name: 'Super User Certainti',
        modified_user_name: 'System Admin',
        created_datetime: '2025-09-25T07:45:44.769+00:00',
        modified_datetime: '2025-09-28T10:10:17.668+00:00',
      },
    ],
  },
};

export const TaskTemplateDetailsMockData: TaskTemplateDetailsResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Operation completed successfully!',
  data: {
    templateDetails: {
      rid: 'D001-1a2b3c4d-1111-2222-3333-abcdef123456',
      r_number: 'TTP-0000000001',
      task_name: 'Onboarding Task Template',
      task_description:
        'Template for assigning onboarding tasks to new employees.',
      task_type_name: 'Onboarding',
      task_type_rid: 'D001-7ce23b1c-d28d-4369-b33c-91fbfef3485a',
      efforts: 8,
      created_by: 'Super User Certainti',
      modified_by: 'Super User Certainti',
      created_datetime: '2025-10-05T09:32:44.769+00:00',
      modified_datetime: '2025-10-06T11:21:17.668+00:00',
    },
  },
};

export const TaskTemplateTypeMockData: TaskTemplateTypeResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Task Template Types fetched successfully',
  data: {
    taskTemplateType: [
      {
        rid: 'D001-7ce23b1c-d28d-4369-b33c-91fbfef3485a',
        task_type_name: 'Onboarding',
      },
      {
        rid: 'D001-7ce23b1c-d28d-4369-b33c-91fbfef348ds',
        task_type_name: 'Access Setup',
      },
      {
        rid: 'D001-7ce23b1c-d28d-4369-b33c-91fbfef34dsds',
        task_type_name: 'Reminder',
      },
      {
        rid: 'D001-9aa23b1c-a21d-4369-b33c-12dbfef3485b',
        task_type_name: 'Compliance',
      },
      {
        rid: 'D001-6bb23b1c-c14d-4369-b33c-45ebfef3487d',
        task_type_name: 'Maintenance',
      },
    ],
  },
};
