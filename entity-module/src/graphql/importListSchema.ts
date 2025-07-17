import { gql } from 'graphql-tag';

const importListSchema = gql`
  enum AlphanumericCondition {
    equals
    not_equals
    contains
    is_empty
    in
    less_than
    greater_than
    between
    before
    after
  }

  input FilterConditionInput {
    equals: String
    not_equals: String
    contains: String
    is_empty: Boolean
    in: [String]
    less_than: String
    greater_than: String
    between: [String]
    before: String
    after: String
  }

  input ImportFiltersInput {
    file_name: FilterConditionInput
    format: FilterConditionInput
    size: FilterConditionInput
    fiscal: FilterConditionInput
    entity: FilterConditionInput
    total_records: FilterConditionInput
    records_loaded_successfully: FilterConditionInput
    records_failed_to_load: FilterConditionInput
    status: FilterConditionInput
    imported_on: FilterConditionInput
    status_description: FilterConditionInput
    import_type: FilterConditionInput
    imported_by: FilterConditionInput
    records_with_warning: FilterConditionInput
  }

  input inputImportList {
    page: Int!
    limit: Int!
    account_rid: String!
    filters: ImportFiltersInput
    sort: String
    sort_by: String
  }

  type array_of_imports {
    rid : String
    file_name: String
    format: String
    size: String
    fiscal: Int
    entity: String
    total_records: Int
    records_loaded_successfully: Int
    records_failed_to_load: Int
    status: String
    imported_on: Date
    status_description: String
    import_type: String
    imported_by: String
    records_with_warning: Int
  }

  type importListResponse {
    page : Int
    limit : Int
    total_count : Int
    imports : [array_of_imports]
    
  }

  type importResponse {
    statusCode: Int
    statusCodeValue: String
    statusMessage: String
    data: importListResponse
  }

  type Mutation {
    listAllImportedData(data: inputImportList): importResponse
  }
`;

export default importListSchema
