import { gql } from "graphql-tag";

const typeDefs = gql`
  enum SortOrder {
    ASC
    DESC
  }

  type ResourceCost {
    rid: ID!
    r_number: String!
    eid: String!
    account_rid: String!
    resource_type: String!
    resource_rid: String!
    resource_number: String!
    resource_ref_id: String!
    effective_date: String!
    end_date: String
    currency_rid: String!
    annual_cost: Float
    monthly_cost: Float
    weekly_cost: Float
    daily_cost: Float
    hourly_cost: Float
    bi_weekly_cost: Float
    semi_annual_cost: Float
    status: String
    created_datetime: String!
    modified_datetime: String!
    created_by: String
    modified_by: String
  }

  type ResourceCostAuditLog {
    id: ID!
    resourceCostId: ID!
    action: String!
    changedBy: String!
    changedAt: String!
    changeDetails: JSON
  }

  input PaginationInput {
    limit: Int = 10
    page: Int = 0
    search: String
    sortBy: String
    sortOrder: String
    filters: JSON
    accountNumber: String!
    fiscalYear: Int!
    resourceRid: String!
  }

  type ResourceCostPaginatedResponse {
    resourceCost: [ResourceCost]
    count: Int
  }

  input CreateResourceCostInput {
    r_number: String!
    eid: String!
    account_rid: String!
    resource_type: String!
    resource_rid: String!
    resource_number: String!
    resource_ref_id: String!
    effective_date: String!
    end_date: String
    currency_rid: String!
    annual_cost: Float
    monthly_cost: Float
    weekly_cost: Float
    daily_cost: Float
    hourly_cost: Float
    bi_weekly_cost: Float
    semi_annual_cost: Float
  }

  input UpdateResourceCostInput {
    rid: ID!
    eid: String!
    effective_date: String!
    end_date: String
    currency_rid: String!
    annual_cost: Float
    monthly_cost: Float
    weekly_cost: Float
    daily_cost: Float
    hourly_cost: Float
    bi_weekly_cost: Float
    semi_annual_cost: Float
    status: String
  }

  type Mutation {
    createResourceCost(input: CreateResourceCostInput!): ResourceCost
    updateResourceCost(input: UpdateResourceCostInput!): ResourceCost
  }

  type Query {
    getResourceCost(id: String!,accountNumber: String!): ResourceCost
    getResourceCosts(pagination: PaginationInput): ResourceCostPaginatedResponse
  }

  # Add scalar type for JSON
  scalar JSON
`;

export default typeDefs;
