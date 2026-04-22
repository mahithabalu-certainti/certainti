import { gql } from '@apollo/client';

export const UPDATE_USER_GROUP = gql`
  mutation UserGroupUpdate($input: UserGroupUpdate!) {
    userGroupUpdate(input: $input) {
      success
      message
      usergroup {
        rid
        r_number
        group_name
        is_consultant_only_group
        group_type_rid
        status_rid
        created_datetime
        modified_datetime
        created_by
        modified_by
      }
    }
  }
`;
