import { gql } from 'graphql-tag';

const importListSchema = gql`

  input inputImportList {
    account_rid: String!
    rid : String!
    fiscal_year : Int
  }

  type importListResponse {
    rid: String
    size: String
    entity: String
    fiscal: Int
    format: String
    status: String
    r_number: String
    file_name: String
    imported_on: String
    total_records: Int
    records_with_warning: Int
    records_failed_to_load: Int
    records_failed_to_stage: Int
    records_loaded_successfully: Int
    imported_by: String
  }

  type importResponse {
    statusCode: Int
    statusCodeValue: String
    statusMessage: String
    data: importListResponse
  }

  type Mutation {
    updateInlineEditForImports(data: inputImportList): importResponse
  }
`;

export default importListSchema
