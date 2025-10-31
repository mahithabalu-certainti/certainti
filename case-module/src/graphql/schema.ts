import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar Date

  type Case {
    rid: String
    r_number: String
    created_by: String
    modified_by: String
    created_datetime: Date
    modified_datetime: Date
    account_rid: String
    case_name: String
    description: String
    fiscal_year: Int
    filing_type_rid: String
    case_owner_rid: String
    case_startdate: Date
    planned_submission_date: Date
    statutory_submission_date: Date
    status_rid: String
    case_total_projects: Int
    case_total_qualified_projects: Int
    case_total_project_cost: Float
    case_total_rd_cost: Float
    case_total_qre_cost: Float
    case_completion_percentage: Float
    case_total_qualified_project_cost: Float
    submitted_datetime: Date
    approved_datetime: Date
    
    # Joined fields from related tables
    account_name: String
    filing_type_name: String
    case_owner_name: String
    status_name: String
    country_name: String
    currency_code: String
    currency_symbol: String
    created_by_name: String
    modified_by_name: String
  }

  input CaseFilterInput {
    case_name: String
    fiscal_year: Int
    filing_type_rid: String
    case_owner_rid: String
    status_rid: String
    created_datetime_from: Date
    created_datetime_to: Date
    submitted_datetime_from: Date
    submitted_datetime_to: Date
  }

  input UpdateInlineCaseInput {
    account_rid: String!
    case_rid: String!
    case_name: String
    filing_type_rid: String
    case_owner_rid: String
    status_rid: String
  }

  type CaseResponse {
    statusCode: Int
    statusCodeValue: String
    statusMessage: String
    data: Case
  }

  type CaseListResponse {
    statusCode: Int
    statusCodeValue: String
    statusMessage: String
    data: CaseListData
  }

  type CaseListData {
    caseInfo: [Case]
    count: Int
  }

  type Query {
    getCasesList(
      account_rid: String!
      filters: CaseFilterInput
      page: Int = 1
      limit: Int = 10
      sortBy: String = "created_datetime"
      sortOrder: String = "DESC"
    ): CaseListResponse
  }

  type Mutation {
    updateInlineCaseDetails(data: UpdateInlineCaseInput!): CaseResponse
  }
`;