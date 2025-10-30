import { CaseDetailsResponse, CaseListResponse } from '../types';

export const CaseListMockData: CaseListResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Operation completed successfully!',
  data: {
    caseInfo: [
      {
        rid: 'D001-7da93db9-67ce-460a-92a0-d3d98e29d59b',
        r_number: 'CAS-0000000003',
        case_name: 'CASE 1 update',
        description: 'test case',
        fiscal_year: 2025,
        case_owner_rid: 'D001-caace427-6365-469d-b8e5-d6322da67d40',
        case_owner_name: 'Dhivya Sivasamy',
        total_projects: null,
        total_projects_cost: null,
        total_project_rd_credits: null,
        total_qre_cost: null,
        filing_type_rid: 'D001-01017b08-36af-47e7-8d2c-c8fec52c2da8',
        filing_type_name: 'Amendment',
        status_rid: 'D001-7e35944b-fcb7-4199-b6d9-7b6732461561',
        status_name: 'In Progress',
        created_by: 'D001-09c06141-8832-472f-9a88-74cd917a45bb',
        created_user_name: 'Super User Certainti',
        modified_by: null,
        modified_user_name: null,
        created_datetime: '2025-10-29T08:28:12.187Z',
        modified_datetime: null,
      },
    ],
    count: 1,
  },
};

export const CaseDetailsMockData: CaseDetailsResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Operation completed successfully!',
  data: {
    caseDetails: {
      rid: 'D001-7da93db9-67ce-460a-92a0-d3d98e29d59b',
      r_number: 'CAS-0000000003',
      account_id: 'ACC-0000000123',
      account_name: 'ABC Technologies Pvt Ltd',
      filing_type_rid: 'D001-01017b08-36af-47e7-8d2c-c8fec52c2da8',
      filing_type_name: 'Amendment',
      case_name: 'FY2025 R&D Case - ABC Tech',
      case_owner_rid: 'D001-caace427-6365-469d-b8e5-d6322da67d40',
      case_owner_name: 'Dhivya Sivasamy',
      fiscal_year: 2025,
      country: 'India',
      country_rid: 'D001-5f058151-3b57-4f75-9f45-243a1f7aeb19',
      start_date: '2025-04-01',
      planned_submission_date: '2026-01-15',
      statutory_submission_date: '2026-02-10',
      description:
        'This case covers all R&D claims for FY 2025 for ABC Technologies.',
      created_by: 'D001-09c06141-8832-472f-9a88-74cd917a45bb',
      created_user_name: 'Super User Certainti',
      created_datetime: '2025-10-29T08:28:12.187Z',
      modified_by: 'D001-09c06141-8832-472f-9a88-74cd917a45bb',
      modified_user_name: 'Super User Certainti',
      modified_datetime: '2025-10-30T09:45:30.000Z',
    },
  },
};
