import {
  ChecklistTemplateDetailsResponse,
  ChecklistLevelApiResponse,
  ChecklistStatusApiResponse,
  ChecklistTypeApiResponse,
} from '../types';

export const ChecklistTemplateDetailsMockData: ChecklistTemplateDetailsResponse =
  {
    statusCode: 200,
    statusCodeValue: 'Success',
    statusMessage: 'Operation completed successfully!',
    data: {
      checklistDetails: {
        rid: 'D001-4a23b610-cc12-4b8a-82ef-9b9e7ef2e9f1',
        checklist_name: 'Client Onboarding Checklist',
        r_number: 'CHK-0000000001',
        checklist_type_rid: 'D001-abc12345-001', // ✅ Matches ChecklistTypesMockData
        checklist_type_name: 'Internal Audit',
        checklist_level_rid: 'D001-lvl-0001', // ✅ Matches ChecklistLevelsMockData
        checklist_level_name: 'Account',
        description:
          'Checklist for verifying all onboarding requirements for new clients.',
        status_rid: 'D001-sts-0001', // ✅ Matches ChecklistStatusMockData
        status_name: 'Active',
        modified_by: 'Super User Certainti',
        created_by: 'Super User Certainti',
        created_datetime: '2025-10-07T10:25:44.769Z',
        modified_datetime: '2025-10-07T11:40:17.668Z',
        questions: [
          {
            rid: 'D001-ea161620-0f51-4b10-8d0f-dab9ebbed98f',
            question_seq_num: 'QUE-0000000001',
            question: 'Has the client provided all mandatory KYC documents?',
          },
          {
            rid: 'D001-7a161620-2f52-4a90-8c0f-dab9ebbed98e',
            question_seq_num: 'QUE-0000000002',
            question: 'Is the client information updated in the CRM?',
          },
          {
            rid: 'D001-8b171621-3c53-4b91-9d0f-dcb9ebbed99f',
            question_seq_num: 'QUE-0000000003',
            question: 'Has the client received the welcome email?',
          },
        ],
        expires_on: '2026-04-08',
      },
    },
  };

export const ChecklistTypesMockData: ChecklistTypeApiResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Operation completed successfully!',
  data: {
    checklistTypes: [
      {
        rid: 'D001-abc12345-001',
        checklist_type_name: 'Internal Audit',
      },
      {
        rid: 'D001-abc12345-002',
        checklist_type_name: 'External Audit',
      },
      {
        rid: 'D001-abc12345-003',
        checklist_type_name: 'Compliance',
      },
    ],
  },
};

export const ChecklistLevelsMockData: ChecklistLevelApiResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Operation completed successfully!',
  data: {
    checklistLevel: [
      {
        rid: 'D001-lvl-0001',
        checklist_level_name: 'Account',
      },
      {
        rid: 'D001-lvl-0002',
        checklist_level_name: 'Project',
      },
      {
        rid: 'D001-lvl-0003',
        checklist_level_name: 'Interaction',
      },
    ],
  },
};

export const ChecklistStatusMockData: ChecklistStatusApiResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Operation completed successfully!',
  data: {
    checklistStatus: [
      {
        rid: 'D001-sts-0001',
        status_name: 'Active',
        status_type: 'Enabled',
      },
      {
        rid: 'D001-sts-0002',
        status_name: 'Inactive',
        status_type: 'Disabled',
      },
      {
        rid: 'D001-sts-0003',
        status_name: 'Archived',
        status_type: 'ReadOnly',
      },
    ],
  },
};
