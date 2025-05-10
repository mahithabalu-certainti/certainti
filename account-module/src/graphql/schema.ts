import { gql } from "graphql-tag";

const typeDefs = gql`

  scalar Date
  scalar JSON

  type Country {
    country_name: String!
  }

  type Currency {
    currency_code: String!
  }

  type ParentAccount {
    account_name: String
  }

  type Account {
    rid: ID!
    r_number: String!
    account_name: String!
    account_description: String
    status: String!
    eid: String
    parent_account_rid: Int
    tax_claim_level: String!
    max_ai_interactions: Int!
    expiry_duration: Int!
    autosend_interaction: Boolean!
    fiscal_start_date: Date!
    fiscal_end_date: Date!
    interaction_cc_list: String
    blended_rate_fte: String
    blended_rate_subcon: String
    created_by: String
    modified_by: String
    primary_contact_name: String!
    primary_contact_email: String!
    primary_contact_number: String!
    finance_poc_name: String!
    finance_poc_email: String!
    finance_poc_number: String!
    industry_rid: String
    industry_name: String
    website: String
    project_manager: String!
    database_level: Boolean!
    annual_revenue: String
    data_storage: String!
    business_details: String!
    created_datetime: Date
    modified_datetime: Date
    country: Country
    currency: Currency
    parent_account: ParentAccount
    child_accounts: [Account]
  }

  input PaginationInput {
    limit: Int = 10
    page: Int = 0
    search: String
    sortBy: String
    sortOrder: String
    filters: JSON,
    globalFilters: JSON, 
    fiscalYear: String
  }

  type AccountConnection {
    account: [Account]
    count: Int
  }

  type Query {
    getAccountById(id: ID!): Account
    getAccounts(pagination: PaginationInput): AccountConnection
  }
`;

export default typeDefs;
