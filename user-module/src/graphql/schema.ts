import { gql } from "graphql-tag";

const typeDefs = gql`
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

  type Query {
    permissionById(azureId: String!): PermissionByIdResponse
  }
`;

export default typeDefs;