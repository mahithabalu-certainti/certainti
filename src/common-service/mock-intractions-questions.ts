import { InteractionDetails } from '../consultant/types';

export const mockIntractionsQuestions: InteractionDetails = {
  rid: 'INT-001',
  interaction_rid: 'IR-2025-01',
  account_rid: 'ACC-789',
  project_rid: 'PROJ-456',
  fiscal_year: 2025,
  project_fiscal_rid: 'PF-2025-001',
  r_number: 'R-1001',
  interaction_type: 'REVIEW',
  interaction_type_name: 'Project Review',
  status: 'IN_PROGRESS',
  status_name: 'In Progress',
  modified_by: 'user123',
  created_by: 'admin001',
  created_datetime: '2025-08-30T10:15:00Z',
  modified_datetime: '2025-08-31T14:45:00Z',
  questions: [
    {
      rid: 'Q-001',
      question_seq_num: '1',
      question: 'What are the key risks identified in this project?',
      notes: 'Please provide detailed risk assessment.',
      is_mandatory: true,
      response_on_datetime: '2025-09-01T09:30:00Z',
      response: 'Risk of delayed delivery due to dependency on vendor.',
      attachments: [
        {
          fileName: 'risk_matrix.pdf',
          fileUrl: 'https://example.com/files/risk_matrix.pdf',
          fileType: 'application/pdf',
          fileSize: '240KB',
        },
      ],
      is_editable: true,
    },
    {
      rid: 'Q-002',
      question_seq_num: '2',
      question: 'Provide project financial summary.',
      notes: 'Attach latest financial statement if available.',
      is_mandatory: false,
      response_on_datetime: null,
      response: null,
      attachments: [],
      is_editable: true,
    },
  ],
  global_attachments: [
    {
      fileName: 'project_overview.docx',
      fileUrl: 'https://example.com/files/project_overview.docx',
      fileType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileSize: '1.2MB',
    },
  ],
  project_code: 'PRJ-2025-A1',
  project_name: 'AI Automation Initiative',
  account_name: 'TechCorp Ltd.',
  response_updated_by: 'reviewer007',
  response_updated_on: '2025-09-01T08:50:00Z',
};
