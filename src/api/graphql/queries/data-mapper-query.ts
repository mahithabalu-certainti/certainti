import { gql } from '@apollo/client';

export const UPDATE_DATA_MAPPER = gql`
  mutation UpdateDataMapperInline($data: dataMapperInlineInput!) {
    updateDataMapperInline(data: $data) {
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
        form_name
        browse_file
        document_name
        effective_from_date
        effective_to_date
        country_rid
        state_rid
        format
        size_in_mb
        status_rid
        is_active
        is_federal
        error_message
        country_name
        state_name
        status_name
        created_by_name
        modified_by_name
      }
    }
  }
`;
