import { gql } from '@apollo/client';

export const UPDATE_ACCOUNT = gql`
  mutation UpdateInlineAccountDetails($data: updateAccountDetails!) {
    updateInlineAccountDetails(data: $data) {
      statusCode
      statusCodeValue
      statusMessage
      data {
        rid
        account_name
        parent_account_rid
        currency_rid
        total_project_hours
        total_projects
        total_project_cost
        total_projects_rd_credits
        qualifying_project_hours_fed
        qualifying_project_qre_fed
        qualifying_project_rd_credits_fed
        r_number
        storage_type
        professional_services_consultant
        finance_lead
        finance_executive
        industry_name_other
        country {
          rid
          country_name
        }
        currency {
          rid
          currency_code
          currency_symbol
        }
        parent_account {
          rid
          account_name
        }
        industry {
          rid
          industry_name
        }
        status {
          status_name
        }
      }
    }
  }
`;
