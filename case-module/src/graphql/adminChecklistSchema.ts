import { gql } from 'graphql-tag';

export const adminChecklistTypeDefs = gql`
  # Admin Checklist Types
  type AdminChecklist {
    rid: String
    r_number: String
    created_by: String
    modified_by: String
    created_datetime: Date
    modified_datetime: Date
    checklist_name: String
    checklist_description: String
    effective_startdate: Date
    effective_enddate: Date
    case_teammember_role_rid: String
    status_rid: String
    task_level: String
    assigned_to: String
    
    # Additional fields that might be returned from list queries
    created_user_name: String
    modified_user_name: String
    status_name: String
    role_name: String
  }

  input AdminChecklistFilterInput {
    checklist_name: String
    checklist_description: String
    status_rid: String
    created_datetime_from: Date
    created_datetime_to: Date
    modified_datetime_from: Date
    modified_datetime_to: Date
  }

  input UpdateAdminChecklistInput {
    rid: String!
    checklist_name: String
    checklist_description: String
    status_rid: String
  }

  type AdminChecklistResponse {
    statusCode: Int
    statusCodeValue: String
    statusMessage: String
    data: AdminChecklist
  }

  type AdminChecklistListResponse {
    statusCode: Int
    statusCodeValue: String
    statusMessage: String
    data: AdminChecklistListData
  }

  type AdminChecklistListData {
    checklist: [AdminChecklist]
    count: Int
  }

  extend type Query {
    getAdminChecklistList(
      filters: AdminChecklistFilterInput
      page: Int = 1
      limit: Int = 10
      sortBy: String = "created_datetime"
      sortOrder: String = "DESC"
      search: String
    ): AdminChecklistListResponse
  }

  extend type Mutation {
    updateAdminChecklist(data: UpdateAdminChecklistInput!): AdminChecklistResponse
  }
`;