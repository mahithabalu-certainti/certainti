import { gql } from 'graphql-tag'

export const dataMapperSchema = gql
    `
type dataMapperResponse {
rid: String
r_number: String
created_datetime: Date
created_by: String
modified_datetime: Date
modified_by: String
form_name: String
browse_file: String
document_name: String
effective_from_date: Date
effective_to_date: Date
country_rid: String
state_rid: String
format: String
size_in_mb: String
status_rid: String
is_active: Boolean
error_message: String
country_name: String
state_name: String
status_name: String
created_by_name: String
modified_by_name: String
}


type dataMapperFinalResponse {
statusCode : Int
statusCodeValue : String
statusMessage : String
data : dataMapperResponse
}

input dataMapperInlineInput {
rid : String!
form_name: String
effective_from_date: Date
effective_to_date: Date
country_rid: String
state_rid: String
is_active: Boolean
}

type Mutation {
updateDataMapperInline(data : dataMapperInlineInput) : dataMapperFinalResponse
}
`
