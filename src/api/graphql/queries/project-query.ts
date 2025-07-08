import { gql } from '@apollo/client';

export const UPDATE_PROJECT = gql`
  mutation UpdateSpecificProjectDetails($data: updateInlineProject!) {
    updateSpecificProjectDetails(data: $data) {
      statusCode
      statusCodeValue
      statusMessage
    }
  }
`;
