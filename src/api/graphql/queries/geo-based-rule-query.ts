import { gql } from '@apollo/client';

export const GEO_BASED_RULE = gql`
  mutation UpdateGeoBasedRuleInline($data: geoBasedRuleUpdateInput!) {
    UpdateGeoBasedRuleInline(data: $data) {
      statusCode
      statusCodeValue
      statusMessage
      data {
        rid
        r_number
        config_name
        country_name
        country_rid
        state_name
        state_rid
        is_federal
        effective_start_date
        effective_end_date
        status_name
        status_rid
        created_datetime
        modified_datetime
        created_user_name
        modified_user_name
        credit_config_group_rid
      }
    }
  }
`;
