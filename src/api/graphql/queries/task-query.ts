import { gql } from '@apollo/client';

export const UPDATE_TASK_SUMMARY_INLINE = gql`
  mutation UpdateTaskSummaryInline($data: updateInlineTaskSummary!) {
    updateTaskSummaryInline(data: $data) {
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
        attach_to
        attachment_level
        task_name
        description
        fiscal_year
        assigned_to
        status_rid
        priority_rid
        effective_start_datetime
        effective_end_datetime
        task_rid
      }
    }
  }
`;
