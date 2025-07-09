import { gql } from '@apollo/client';

export const UPDATE_ACCOUNT = gql`
  mutation UpdateInlineAccountDetails($data: updateAccountDetails!) {
    updateInlineAccountDetails(data: $data) {
      statusCode
      statusCodeValue
      statusMessage
      data {
        rid
        r_number
        eid
        created_by
        modified_by
        created_datetime
        modified_datetime
        comments
        account_name
        status_rid
        is_parent
        annual_revenue
        region_rid
        storage_type
        logo_url
        organisation_name
        parent_account_rid
        database_connection_rid
        country_rid
        currency_rid
        industry_rid
        industry_name_other
        is_file_drop_enabled
        file_drop_medium
        file_drop_config_id
        professional_services_consultant
        finance_lead
        finance_executive
        total_project_hours
        total_projects
        total_project_cost
        total_projects_rd_credits
        qualifying_project_hours_fed
        qualifying_project_qre_fed
        qualifying_project_rd_credits_fed
        industry_rid_name
        country {
          country_name
          country_code
        }
        currency {
          currency_code
          currency_symbol
        }
        status {
          status_name
        }
        industry {
          rid
          industry_name
        }
        parent_account {
          account_name
        }
      }
    }
  }
`;
