import { gql } from "graphql-tag";
import {mergeTypeDefs} from "@graphql-tools/merge"

const resourceDefs = gql`
  type Resource {
    rid: ID!
    r_number: String
    eid: String
    account_rid: ID
    resource_ref_id: String
    resource_type: String
    resource_firstname: String
    resource_middlename: String
    resource_lastname: String
    resource_fullname: String
    resource_orgname: String
    resource_role: String
    fiscal_year: Int
    resource_email: String
    resource_mobile: String
    country: ID
    region: ID
    currency: ID
    cost_frequency: String
    cost: Float
    resource_startdate: String
    resource_enddate: String
    designation: String
    manager_name: String
    total_years_experience: Int
    total_years_in_org: Int
    resource_desc: String
    resource_status: String
    created_datetime: String
    modified_datetime: String
    created_by: ID
    modified_by: ID
    country_code: String
    currency_code: String
    region_name: String
  }

  type GetResource {
    rid: ID!
    r_number: String
    resource_ref_id: String
    resource_fullname: String
    resource_type: String
    resource_status: String
    resource_email: String
    resource_mobile: String
    resource_role: String
  }

  input CreateResourceInput {
    account_number: String!
    account_id: ID!
    resource_ref_id: String!
    resource_type: ResourceType!
    first_name: String
    middle_name: String
    last_name: String
    full_name: String
    org_name: String
    role: String
    fiscal_year: Int!
    email: String
    mobile: String
    country: ID
    region: ID
    currency: ID
    effective_from_date: String
    effective_end_date: String
    designation: String
    manager_name: String
    total_years_experience: Float
    total_years_in_org: Float
    description: String
    cost: Float
    cost_frequencty: CostFrequency
    resource_status: ResourceStatus
    created_by: ID!
  }

  input UpdateResourceInput {
    resource_id: ID!
    account_number: String!
    resource_ref_id: String!
    resource_type: String! # FullTime | Contract
    first_name: String
    middle_name: String
    last_name: String
    full_name: String
    org_name: String
    role: String
    fiscal_year: Int!
    email: String
    mobile: String
    country: ID
    region: ID
    currency: ID
    effective_from_date: String
    effective_end_date: String
    designation: String
    manager_name: String
    total_years_experience: Float
    total_years_in_org: Float
    description: String
    cost: Float
    cost_frequency: String # Annual | Semi-Annual | Monthly | Bi-Weekly | Weekly | Daily | Hourly
    resource_status: String # Active | Inactive
    modified_by: ID!
  }

  enum ResourceType {
    FullTime
    Contract
  }

  enum CostFrequency {
    Annual
    Semi_annual
    Monthly
    Bi_weekly
    Weekly
    Daily
    Hourly
  }

  enum ResourceStatus {
    Active
    Inactive
  }

  input ResourcesInput {
    limit: Int = 10
    page: Int = 0
    search: String
    sortBy: String
    sortOrder: String
    filters: JSON
    fiscalYear: Int
  }

  type ResourceConnection {
    resources: [GetResource]
    count: Int
  }

  type Query {
    getResources(
      r_number: String!
      pagination: ResourcesInput
    ): ResourceConnection
    getResourceById(rid: String!, r_number: String!): Resource
  }

  type Mutation {
    createResource(input: CreateResourceInput!): Resource
    updateResource(input: UpdateResourceInput!): Int
  }
`;

const resourceInlineDefs = gql`
type resourceResponse {
  rid : String, 
  r_number : String,
  resource_code : String,
  resource_name : String,
  resource_firstname : String,
  resource_lastname : String,
  resource_type_rid : String,
  status_rid : String,
  resource_role : String,
  resource_designation : String,
  resource_orgname : String,
  comments : String,
  resource_total_experience : String,
  country_rid : String,
  region_rid : String,
  city_rid : String,
  account_name : String,
  total_project_hours : String,
  estimated_rd_hours : String,
  country_name : String,
  region_name : String,
  city_name : String,
  resource_type_name : String,
  status_name : String
}

type updateInlineResourceResponse {
  statusCode : Int,
  statusCodeValue : String,
  statusMessage : String,
  data : resourceResponse
}

input updateInlineResource {
  resource_rid : String!,
  account_rid : String!,
  resource_name : String,
  resource_firstname : String,
  resource_lastname : String,
  resource_type_rid : String,
  resource_orgname : String,
  resource_designation : String,
  resource_role : String,
  region_rid : String,
  country_rid : String,
  status_rid : String,
  city_rid : String,
  comments : String,
  resource_code : String
}

type Mutation {
  updateResourceInline(data : updateInlineResource) : updateInlineResourceResponse
}
`

const typeDefs = mergeTypeDefs([resourceDefs, resourceInlineDefs])

export default typeDefs;
