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

export const ADMIN_CHECKLIST_UPDATE = gql`
  mutation UpdateAdminChecklist($data: UpdateAdminChecklistInput!) {
    updateAdminChecklist(data: $data) {
      statusCode
      statusCodeValue
      statusMessage
      data {
        rid
        r_number
        created_by
        modified_by
        created_datetime
        modified_datetime
        checklist_name
        checklist_description
        effective_startdate
        effective_enddate
        case_teammember_role_rid
        status_rid
        task_level
        assigned_to
        created_user_name
        modified_user_name
        status_name
        role_name
      }
    }
  }
`;
