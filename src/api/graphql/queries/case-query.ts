import { gql } from '@apollo/client';

export const UPDATE_CASE = gql`
  mutation UpdateInlineCaseDetails($data: UpdateInlineCaseInput!) {
    updateInlineCaseDetails(data: $data) {
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
        account_rid
        case_name
        description
        fiscal_year
        filing_type_rid
        case_owner_rid
        case_startdate
        planned_submission_date
        statutory_submission_date
        status_rid
        case_total_projects
        case_total_qualified_projects
        case_total_project_cost
        case_total_rd_cost
        case_total_qre_cost
        case_completion_percentage
        case_total_qualified_project_cost
        submitted_datetime
        approved_datetime
        account_name
        filing_type_name
        case_owner_name
        status_name
        country_name
        currency_code
        currency_symbol
        created_user_name
        modified_user_name
      }
    }
  }
`;
