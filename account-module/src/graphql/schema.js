const { gql } = require("graphql-tag");

const typeDefs = gql`
  type Account {
    rid: ID!
    r_number: String!
    account_name: String!
    account_description: String
    status: String!
    eid: Int!
    parent_account_rid: Int
    tax_claim_level: String!
    max_ai_interactions: Int!
    expiry_duration: Int!
    autosend_interaction: Boolean!
    fiscal_start_date: String!
    fiscal_end_date: String!
    interaction_cc_list: String
    blended_rate_fte: String!
    blended_rate_subcon: String!
    created_by: String!
    modified_by: String!
    contact_email: String!
    contact_number: String!
    point_of_contact: String!
    poc_email: String!
    poc_number: String!
    industry: String
    website: String
    project_manager: String!
    database_level: Boolean!
    annual_revenue: String
    data_residency: String
    data_storage: String
    created_datetime: String!
    modified_datetime: String!
  }

  type Query {
    getAccountById(id: ID!): Account
  }
`;

module.exports = typeDefs;
