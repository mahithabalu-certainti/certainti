import { gql } from '@apollo/client';

export const UPDATE_INLINE_ACCOUNT_DETAILS = gql`
  mutation UpdateInlineAccountDetails($data: updateAccountDetails!) {
    updateInlineAccountDetails(data: $data) {
      statusCode
      statusCodeValue
      statusMessage
      data
    }
  }
`;
