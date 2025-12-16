import { gql } from '@apollo/client';

export const GEO_BASED_RULE = gql`
  mutation UpdateJurisdictionConfig($input: JurisdictionConfigInput!) {
    updateJurisdictionConfig(input: $input) {
      statusCode
      message
      errorMessage
      data {
        rid
        r_number
        config_name
        jurisdiction_config_group_rid
        platform_config_group_rid
        effective_start_date
        effective_end_date
        is_federal
        status_rid
        jurisdictionConfig
        platformConfig
        created_by
        created_user_name
        created_at
        modified_by
        modified_at
        modified_user_name
        status_name
        credit_config_group_rid
        country_name
        state_name
        country_rid
        state_rid
      }
    }
  }
`;

