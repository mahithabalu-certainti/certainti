import { gql } from '@apollo/client';

export const IMPORT_UPDATE = gql`
  mutation UpdateInlineEditForImports($data: inputImportList!) {
    updateInlineEditForImports(data: $data) {
      statusCode
      statusCodeValue
      statusMessage
      data {
        rid
        size
        entity
        fiscal
        format
        status
        r_number
        file_name
        imported_on
        total_records
        records_with_warning
        records_failed_to_load
        records_failed_to_stage
        records_loaded_successfully
        imported_by
      }
    }
  }
`;
