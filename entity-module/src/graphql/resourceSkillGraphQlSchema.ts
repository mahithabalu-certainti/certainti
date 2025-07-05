import { gql } from "graphql-tag";
import {mergeTypeDefs} from '@graphql-tools/merge'

const listDefs = gql`
type ResourceSkill {
  rid: ID!
  r_number: String
  eid: String
  account_rid: String
  resource_type: String
  resource_rid: String
  resource_number: String
  resource_desc: String
  skill_rid: String
  start_date: String
  skill_description: String
  skill_level: String
  fiscal_year: Int
  years_of_experience: String
  resource_ref_id: String
  technical_weightage: String
  status: String
  created_datetime: String
  modified_datetime: String
  created_by: String
  modified_by: String
  resource_full_name: String
  skill_name: String
  Resource: ResourceData
}

type ResourceData {
  rid: String
  full_name: String
  resource_type: String
}

type ResourceSkillResponse {
  resourceSkill: [ResourceSkill!]
  count: Int!
}

input ResourceSkillInput {
  eid: String
  account_rid: String!
  resource_type: String!
  resource_rid: String!
  resource_number: String!
  resource_desc: String
  skill_rid: String
  start_date: String!
  skill_description: String
  skill_level: String!
  years_of_experience: String!
  resource_ref_id: String
  technical_weightage: String
  status: String
  created_by: String
  modified_by: String
  skill_name: String
  skill_type: String
  accountNumber: String!
}

input UpdateResourceSkillInput {
  rid: ID!
  eid: String
  start_date: String
  skill_description: String
  skill_level: String
  years_of_experience: String
  modified_by: String
  technical_weightage: String
  skill_type: String
  status: String
  accountNumber: String!
}

type Query {
  getResourceSkills(
    rid: String
    page: Int
    limit: Int
    search: String
    filters: JSON
    sortBy: String
    sortOrder: String
    accountNumber: String!
    fiscalYear: Int!
    resourceRid: String!
  ): ResourceSkillResponse
  getResourceSkill(id: String!,accountNumber: String!): ResourceSkill
}

type Mutation {
  createResourceSkill(input: ResourceSkillInput!): ResourceSkill
  updateResourceSkill(input: UpdateResourceSkillInput!): ResourceSkill
}

 # Add scalar type for JSON
  scalar JSON
`;

const inlineEditDefs = gql`

  type updateSkillResponse {
    statusCode : Int,
    statusCodeValue : String,
    statusMessage : String
  }

  input updateResourceSkillInline {
    account_rid : String!,
    resource_rid : String!,
    resource_skill_rid : String!,
    start_date : String,
    end_date : String,
    skill_type_rid : String,
    skill_subtype_rid : String,
    skill_level_rid : String,
    skill_details : String
  }

  type Mutation {
    updateResourceSkillInline (data : updateResourceSkillInline) : updateSkillResponse
  }
`

const typeDefs = mergeTypeDefs([inlineEditDefs, listDefs])

export default typeDefs;