import { gql } from '@apollo/client';

export const CHECKLIST_UPDATE = gql`
  mutation UpdateCheckListInline($data: checkListInlineInput!) {
    updateCheckListInline(data: $data) {
      statusCode
      statusCodeValue
      statusMessage
      data {
        rid
        r_number
        created_datetime
        created_by
        modified_datetime
        modified_by
        account_rid
        checklist_name
        attach_to
        attachment_level
        fiscal_year
        descriptions
        attached_to
        created_by_name
        modified_by_name
      }
    }
  }
`;
