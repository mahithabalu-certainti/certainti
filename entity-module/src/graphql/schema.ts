import { gql } from "graphql-tag";

const typeDefs = gql`
  enum SortOrder {
    ASC
    DESC
  }

  type ResourceCost {
    id: ID!
    resource_cost_number: String!
    resource_ref_id: String!
    currency: String!
    start_date: String!
    end_date: String
    annual_compensation: Float
    monthly_compensation: Float
    weekly_compensation: Float
    daily_compensation: Float
    hourly_compensation: Float
    status: Boolean!
    created_at: String!
    updated_at: String!
    created_by: String
    updated_by: String
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
  }

  type ResourceCostPaginatedResponse {
    resourceCost: [ResourceCost]
    count: Int
  }

  input CreateResourceCostInput {
    resource_ref_id: String!
    resource_currency: String!
    resource_start_date: String!
    resource_end_date: String
    resource_annual_compensation: Float
    resource_monthly_compensation: Float
    resource_weekly_compensation: Float
    resource_daily_compensation: Float
    resource_hourly_compensation: Float
    status: String
    created_by: String
    updated_by: String
  }

  input UpdateResourceCostInput {
    id: String!
    resource_currency: String!
    resource_start_date: String!
    resource_end_date: String
    resource_annual_compensation: Float
    resource_monthly_compensation: Float
    resource_weekly_compensation: Float
    resource_daily_compensation: Float
    resource_hourly_compensation: Float
    status: String
    updated_by: String
  }

  type Mutation {
    createResourceCost(input: CreateResourceCostInput!): ResourceCost
    updateResourceCost(input: UpdateResourceCostInput!): ResourceCost
  }

  type Query {
    getResourceCosts(pagination: PaginationInput): ResourceCostPaginatedResponse
  }

  # Add scalar type for JSON
  scalar JSON
`;

export default typeDefs;
