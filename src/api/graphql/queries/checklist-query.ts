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
        checklist_name
        checklist_description
        checklist_template_rid
        created_datetime
        created_by
        modified_datetime
        modified_by
        account_rid
        attach_to
        attachment_level
        fiscal_year
        assigned_to
        status_rid
        created_by_name
        modified_by_name
        attached_to
      }
    }
  }
`;
