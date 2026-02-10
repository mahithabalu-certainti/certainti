import {
  DashboardCountDetailsResponse,
  HealthStatusResponse,
  OverallProjectValueResponse,
} from '../types';

export const dashboardCountDetailsMock: DashboardCountDetailsResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Success',
  data: [
    { name: 'Active Accounts', count: '310', order: 1 },
    { name: 'Total Cases', count: '384', order: 2 },
    { name: 'Completed Cases', count: '63', order: 3 },
    { name: 'On Hold Cases', count: '1', order: 4 },
    { name: 'Open Tasks', count: '3440', order: 5 },
    { name: 'Overdue Tasks', count: '2523', order: 6 },
    { name: 'Upcoming Tasks', count: '117', order: 7 },
    { name: 'Weekly Completed Tasks', count: '0', order: 8 },
  ],
};

export const healthStatusDetailMock: HealthStatusResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Success',
  data: [
    // Avasoft
    {
      account_rid: 'D090k-acc-001',
      account_name: 'Avasoft',
      fiscal_year: 2026,
      progress: '75',
    },
    {
      account_rid: 'D090k-acc-001',
      account_name: 'Avasoft',
      fiscal_year: 2025,
      progress: '68',
    },
    {
      account_rid: 'D090k-acc-001',
      account_name: 'Avasoft',
      fiscal_year: 2024,
      progress: '60',
    },
    {
      account_rid: 'D090k-acc-001',
      account_name: 'Avasoft',
      fiscal_year: 2022,
      progress: '40',
    },
    {
      account_rid: 'D090k-acc-001',
      account_name: 'Avasoft',
      fiscal_year: 2021,
      progress: '15',
    },

    // Avasoft1
    {
      account_rid: 'D090k-acc-002',
      account_name: 'Avasoft1',
      fiscal_year: 2026,
      progress: '70',
    },
    {
      account_rid: 'D090k-acc-002',
      account_name: 'Avasoft1',
      fiscal_year: 2025,
      progress: '62',
    },
    {
      account_rid: 'D090k-acc-002',
      account_name: 'Avasoft1',
      fiscal_year: 2024,
      progress: '58',
    },
    {
      account_rid: 'D090k-acc-002',
      account_name: 'Avasoft1',
      fiscal_year: 2023,
      progress: '55',
    },
    // Backend Test Account - 1
    {
      account_rid: 'D090k-acc-003',
      account_name: 'Backend Test Account - 1',
      fiscal_year: 2026,
      progress: '55',
    },
    {
      account_rid: 'D090k-acc-003',
      account_name: 'Backend Test Account - 1',
      fiscal_year: 2023,
      progress: '45',
    },
    {
      account_rid: 'D090k-acc-003',
      account_name: 'Backend Test Account - 1',
      fiscal_year: 2022,
      progress: '25',
    },
    {
      account_rid: 'D090k-acc-003',
      account_name: 'Backend Test Account - 1',
      fiscal_year: 2021,
      progress: '10',
    },

    // Internal QA Account
    {
      account_rid: 'D090k-acc-004',
      account_name: 'Internal QA Account',
      fiscal_year: 2026,
      progress: '80',
    },
    {
      account_rid: 'D090k-acc-004',
      account_name: 'Internal QA Account',
      fiscal_year: 2024,
      progress: '72',
    },
    {
      account_rid: 'D090k-acc-004',
      account_name: 'Internal QA Account',
      fiscal_year: 2023,
      progress: '70',
    },
    {
      account_rid: 'D090k-acc-004',
      account_name: 'Internal QA Account',
      fiscal_year: 2022,
      progress: '50',
    },
  ],
};

export const overallProjectValueMock: OverallProjectValueResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Success',
  data: [
    {
      country_rid: 'CNT-US',
      country_code: 'US',
      country_name: 'United States',
      total_project_cost: '950',
      qualified_project_cost: '720',
      qre_cost: '410',
      rd_credits_computed: '82',
      rd_credits_submitted: '75',
      rd_credits_approved: '60',
    },
    {
      country_rid: 'CNT-CA',
      country_code: 'CA',
      country_name: 'Canada',
      total_project_cost: '780',
      qualified_project_cost: '560',
      qre_cost: '320',
      rd_credits_computed: '96',
      rd_credits_submitted: '88',
      rd_credits_approved: '70',
    },
    {
      country_rid: 'CNT-GB',
      country_code: 'GB',
      country_name: 'United Kingdom',
      total_project_cost: '640',
      qualified_project_cost: '480',
      qre_cost: '260',
      rd_credits_computed: '52',
      rd_credits_submitted: '48',
      rd_credits_approved: '40',
    },
    {
      country_rid: 'CNT-IE',
      country_code: 'IE',
      country_name: 'Ireland',
      total_project_cost: '420',
      qualified_project_cost: '300',
      qre_cost: '180',
      rd_credits_computed: '45',
      rd_credits_submitted: '40',
      rd_credits_approved: '35',
    },
    {
      country_rid: 'CNT-AU',
      country_code: 'AU',
      country_name: 'Australia',
      total_project_cost: '510',
      qualified_project_cost: '360',
      qre_cost: '220',
      rd_credits_computed: '66',
      rd_credits_submitted: '60',
      rd_credits_approved: '52',
    },
  ],
};
