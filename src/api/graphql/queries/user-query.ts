import { gql } from '@apollo/client';

export const UPDATE_USER = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      success
      message
      user {
        rid
        email
        first_name
        status_rid
        created_datetime
        modified_datetime
        azure_id
        profile {
          rid
          profile_name
        }
        business_teams {
          rid
          business_teams
        }
        status {
          status_name
          status_description
        }
      }
    }
  }
`;
