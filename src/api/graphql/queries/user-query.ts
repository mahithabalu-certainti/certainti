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
      }
    }
  }
`;
