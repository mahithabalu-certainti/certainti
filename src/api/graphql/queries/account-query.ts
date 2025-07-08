import { gql } from '@apollo/client';

export const UPDATE_ACCOUNT = gql`
  mutation UpdateInlineAccountDetails($data: updateAccountDetails!) {
    updateInlineAccountDetails(data: $data) {
      statusCode
      statusCodeValue
      statusMessage
      data
    }
  }
`;
