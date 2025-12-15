import {gql} from 'graphql-tag'

export const jurisdictionTypeDefs = gql`
  scalar JSON

  type JurisdictionConfig {
    rid: ID!
    jurisdiction_config_group_rid: String
    platform_config_group_rid: String
    effective_start_date: String
    effective_end_date: String
    is_federal: Boolean
    status_rid: String
    jurisdictionConfig: JSON
    platformConfig: JSON
    created_by: String
    created_user_name:String
    created_at: String
    modified_by: String
    modified_at: String
    modified_user_name: String
    status_name: String
    credit_config_group_rid: String
  }

  type JurisdictionConfigList {
    configs: [JurisdictionConfig]
    count: Int
  }

  input JurisdictionConfigInput {
    config_rid: ID
    config_name: String
    effective_start_date: String
    effective_end_date: String
    is_federal: Boolean!
    status_rid: String
  }

  type JurisdictionConfigResponse {
    statusCode: Int!
    message: String!
    errorMessage: String
    data: JurisdictionConfigResult
  }

  type JurisdictionConfigResult {
    data: JurisdictionConfig
  }

  type JurisdictionConfigListResponse {
    statusCode: Int!
    message: String!
    errorMessage: String
    data: JurisdictionConfig
  }

  extend type Query {
    listJurisdictionConfig(
      page: Int, limit: Int, filters: String, sortBy: String, sortOrder: String, search: String
    ): JurisdictionConfigListResponse
    getJurisdictionConfigDetailsById(config_rid: ID!): JurisdictionConfigResponse
  }

  extend type Mutation {
    updateJurisdictionConfig(input: JurisdictionConfigInput!): JurisdictionConfigListResponse
  }
`;
