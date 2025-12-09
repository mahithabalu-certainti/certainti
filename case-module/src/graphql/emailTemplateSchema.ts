import { gql } from 'graphql-tag';

export const emailTemplateTypeDefs = gql`
  type EmailTemplate {
    rid: String
    r_number: String
    created_by: String
    modified_by: String
    created_datetime: Date
    modified_datetime: Date
    template_name: String
    description: String
    category_rid: String
    subject: String
    body_html: String
    status_rid: String
    # Additional fields for list queries
    created_user_name: String
    modified_user_name: String
    status_name: String
    category_name: String
  }

  input EmailTemplateFilterInput {
    template_name: String
    description: String
    category_rid: String
    status_rid: String
    created_datetime_from: Date
    created_datetime_to: Date
    modified_datetime_from: Date
    modified_datetime_to: Date
  }

  input UpdateEmailTemplateInput {
    email_template_rid: String!
    template_name: String
    description: String
    category_rid: String
    subject: String
    status_rid: String
  }

  type EmailTemplateResponse {
    statusCode: Int
    statusCodeValue: String
    statusMessage: String
    data: EmailTemplate
  }

  type EmailTemplateListResponse {
    statusCode: Int
    statusCodeValue: String
    statusMessage: String
    data: EmailTemplateListData
  }

  type EmailTemplateListData {
    templates: [EmailTemplate]
    count: Int
  }

  extend type Query {
    getEmailTemplateList(
      filters: EmailTemplateFilterInput
      page: Int = 1
      limit: Int = 10
      sortBy: String = "created_datetime"
      sortOrder: String = "DESC"
      search: String
    ): EmailTemplateListResponse
  }

  extend type Mutation {
    updateEmailTemplate(data: UpdateEmailTemplateInput!): EmailTemplateResponse
  }
`;
