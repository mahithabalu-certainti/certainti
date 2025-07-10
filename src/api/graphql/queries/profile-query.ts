import { gql } from '@apollo/client';

export const UPDATE_USER_PROFILE = gql`
  mutation UpdateUserProfile($input: UpdateUserProfileInput!) {
    updateUserProfile(input: $input) {
      success
      message
      profile {
        rid
        r_number
        profile_name
        profile_description
        profile_type
        profile_status
        created_datetime
        modified_datetime
        created_by
        modified_by
      }
    }
  }
`;
