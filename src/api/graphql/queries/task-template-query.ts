import { gql } from '@apollo/client';

export const TASK_TEMPLATE = gql`
  mutation UpdateTaskTemplateInline($data: taskUpdateInput!) {
    UpdateTaskTemplateInline(data: $data) {
      statusCode
      statusCodeValue
      statusMessage
      data {
        rid
        r_number
        created_by_name
        modified_by_name
        created_datetime
        modified_datetime
        task_name
        sequence_no
        effort_in_days
        effective_start_datetime
        effective_end_datetime
        role_name
        case_team_member_role_rid
        checklist_name
        priority_name
        priority_rid
        status_name
        status_rid
        milestone_name
        milestone_template_rid
        checklist_template_rid
        task_description
        task_type_name
        task_type_rid
        task_category_rid
        weightage_rid
        category_name
        weightage_value
      }
    }
  }
`;
