import {gql} from 'graphql-tag'

const typeDefs = gql
`
type attachmentResponse {
rid: String
created_datetime: Date
browse_file: String
document_name: String
attach_to: String
attachment_level: String
fiscal_year: Int
account_rid: String
format: String
size_in_mb: String
document_category_rid: String
document_type_rid: String
document_category_others: String
document_type_others: String
comments: String
created_by: String
r_number: String
modified_datetime: Date
modified_by: String 
}

type response {
statusCode : Int
statusCodeValue : String
statusMessage : String
data : attachmentResponse
}

input attachmentInlineInput {
rid : String!
account_rid : String!
fiscal_year: Int
document_category_rid: String
document_type_rid: String
document_category_others: String
document_type_others: String
comments: String
}

type Mutation {
updateAttachmentInline(data : attachmentInlineInput) : response
}
`
export default typeDefs