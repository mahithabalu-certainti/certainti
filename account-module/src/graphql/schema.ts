import { gql } from "graphql-tag";
import {mergeTypeDefs} from "@graphql-tools/merge"

const fetchAccountTypeDefs = gql`

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
    comments: String
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
    industry_rid: String!
    industry_name_other: String
    website: String
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

const updateAccountTypeDefs = gql
`
    input keyContactDetails {
      key_contact_name : String
      key_contact_email : String
      key_contact_role : String
      is_primary_contact : Boolean
      include_in_communication : Boolean
      interaction_cc_recipient : Boolean
      status_rid : String,
      rid : String
    }

    input updateAccountDetails 
    {
      account_rid : String!
      organisation_name : String
      account_name : String
      comments : String
      status_rid : String
      is_parent : Boolean
      parent_account_rid : String
      max_ai_interactions : Int
      autosend_interaction : Boolean
      fiscal_start_date : String
      fiscal_end_date : String
      blended_rate_fte : Float
      blended_rate_subcon : Float
      industry_rid : String
      industry_name_other : String
      website : String
      annual_revenue : String
      data_storage : String
      business_details : String
      country_rid : String
      region_rid : String
      currency_rid : String,
      finance_lead : String,
      finance_executive : String,
      professional_services_consultant : String,
      key_contacts : [keyContactDetails]
    }

    type country {
    rid : String,
    country_name: String
    }

    type industry {
    rid : String,
    industry_name: String
    }

    type status {
    status_name: String
    }

    type currency {
      rid : String,
      currency_code: String,
      currency_name: String,
      currency_symbol: String
    }
    
    type updatedAccountResponse {
      rid : String
      account_name : String
      max_ai_interactions : Int
      autosend_interaction : Boolean
      fiscal_start_date : String
      fiscal_end_date : String
      industry : industry
      industry_name_other : String
      website : String
      annual_revenue : String
      data_storage : String
      business_details : String
      country : country
      currency : currency,
      status : status,
      finance_lead : String,
      finance_executive : String,
      professional_services_consultant : String,
      total_project_hours : Float,
      total_projects : Int,
      qualifying_project_hours_fed : Float,
      qualifying_project_qre_fed : Float,
      qualifying_project_rd_credits_fed : Float,
      parent_account_rid : String
    }

    type updateAccountResponse {
      statusCode : Int
      statusCodeValue : String
      statusMessage : String
      data : updatedAccountResponse
    }

    type Mutation {
      updateInlineAccountDetails(data : updateAccountDetails) : updateAccountResponse
    }
`

const typeDefs = mergeTypeDefs([fetchAccountTypeDefs, updateAccountTypeDefs])

export default typeDefs;
