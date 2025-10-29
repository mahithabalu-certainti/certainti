import {
  EmailTemplateDetailsResponse,
  EmailTemplateListResponse,
} from '../types';

export const EmailTemplateMockData: EmailTemplateListResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Operation completed successfully!',
  data: {
    page: 1,
    limit: 100,
    totalCount: 3,
    emailTemplates: [
      {
        rid: 'D001-1a2b3c4d-1111-2222-3333-abcdef123456',
        r_number: 'ETP-0000000001',
        template_name: 'Welcome Email Template',
        status: 'D001-7ce23b1c-d28d-4369-b33c-91fbfef3485a',
        status_name: 'Active',
        description: 'Template for sending welcome emails to new users.',
        owner: 'Marketing Team',
        created_by: 'D001-09c06141-8832-472f-9a88-74cd917a45bb',
        modified_by: 'D001-09c06141-8832-472f-9a88-74cd917a45bb',
        created_user_name: 'Super User Certainti',
        modified_user_name: 'Super User Certainti',
        created_datetime: '2025-10-05T09:32:44.769+00:00',
        modified_datetime: '2025-10-06T11:21:17.668+00:00',
      },
      {
        rid: 'D001-9f8e7d6c-4444-5555-6666-fedcba654321',
        r_number: 'ETP-0000000002',
        template_name: 'Password Reset Template',
        status: 'D001-7ce23b1c-d28d-4369-b33c-91fbfef3485a',
        status_name: 'Active',
        description: 'Used for sending password reset links to users.',
        owner: 'IT Support',
        created_by: 'D001-22a07141-8832-472f-9a88-74cd917a45bb',
        modified_by: null,
        created_user_name: 'Admin User',
        modified_user_name: null,
        created_datetime: '2025-10-10T12:15:44.769+00:00',
        modified_datetime: null,
      },
      {
        rid: 'D001-55aa33cc-7777-8888-9999-123abc987def',
        r_number: 'ETP-0000000003',
        template_name: 'Inactive Account Reminder',
        status: 'D001-7ce23b1c-d28d-4369-b33c-91fbfef3485a',
        status_name: 'In-Active',
        description:
          'Reminder email sent to users who have not logged in for 30 days.',
        owner: 'Customer Success Team',
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

export const EmailTemplateDetailsMockData: EmailTemplateDetailsResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Operation completed successfully!',
  data: {
    templateDetails: {
      template_rid: 'D001-1a2b3c4d-1111-2222-3333-abcdef123456',
      r_number: 'ETP-0000000001',
      template_name: 'Welcome Email Template',
      subject: 'Welcome to Certainti!',
      description:
        'Template for sending welcome emails to new users after successful registration.',
      email_body:
        "<p>Dear <strong>{{user_name}}</strong>,</p><p>Welcome to <strong>Certainti</strong>! We're excited to have you on board.</p><p>Click below to get started:</p><p><a href='{{activation_link}}'>Activate Your Account</a></p><p>Best Regards,<br/>The Certainti Team</p>",
      status_rid: 'D001-7ce23b1c-d28d-4369-b33c-91fbfef3485a',
      status_name: 'Active',
      owner: 'Marketing Team',
      created_by: 'Super User Certainti',
      modified_by: 'Super User Certainti',
      created_datetime: '2025-10-05T09:32:44.769+00:00',
      modified_datetime: '2025-10-06T11:21:17.668+00:00',
    },
  },
};
