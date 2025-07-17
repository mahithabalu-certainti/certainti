import { gql } from "graphql-tag";

const typeDefs = gql`

  scalar Date
  
  type Permission {
    type: String
    name: String
    desc: String
    is_enabled: Boolean
    permission_id: String
  }

  type PermissionByIdResponse {
    rid: String
    user_role: String
    user_id: String
    permissions: [Permission]
  }

  input UpdateUserInput {
    rid: ID!
    azure_id: String!
    first_name: String
    status_rid: String
    profile_rid: String
    role_rid: String
  }
  
  type profile_user {
  rid : String
  profile_name : String
  }

  type business_teams_user {
  rid : String
  business_teams : String
  }

  type status_user {
  status_name : String
  status_description : String
  }

  type User {
    rid: ID
    email: String
    first_name: String
    status_rid: String
    created_datetime: Date
    modified_datetime: Date
    azure_id : String
    profile : profile_user
    business_teams : business_teams_user
    status : status_user
  }

  type UpdateUserResponse {
    success: Boolean!
    message: String
    user: User
  }

  input UpdateUserProfileInput {
    rid: ID!
    profile_name: String
    profile_description: String
  }

  type Profile {
    rid: String,
    r_number: String,
    profile_name: String,
    profile_description: String,
    profile_type: String,
    profile_status: String,
    created_datetime: Date,
    modified_datetime: Date,
    created_by: String,
    modified_by: String
  }

  type UpdateUserProfileResponse {
    success: Boolean!
    message: String
    profile: Profile
  }
  type UserGroup {
    rid: String,
    r_number: String,
    group_name: String,
    is_consultant_only_group: Boolean,
    group_type_rid: String,
    status_rid: String,
    created_datetime: Date,
    modified_datetime: Date,
    created_by: String,
    modified_by: String
  }

  type updateUserGroupResponse {
      statusCode : Int
      statusCodeValue : String
      statusMessage : String
      data : UserGroup
    }

   input UserGroupUpdate {
    group_rid: ID!
    group_name: String!
    status_rid : String
  }

  type Query {
    permissionById(azureId: String!): PermissionByIdResponse
  }

  type Mutation {
    updateUser(input: UpdateUserInput!): UpdateUserResponse!
    updateUserProfile(input: UpdateUserProfileInput!): UpdateUserProfileResponse!
    userGroupUpdate(data: UserGroupUpdate!): updateUserGroupResponse!
  }
`;

export default typeDefs;
