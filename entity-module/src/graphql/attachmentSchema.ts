import {gql} from 'graphql-tag'

const typeDefs = gql
`
type attachmentResponse {
document_rid: String
r_number: String
created_datetime: Date
created_by: String
modified_datetime: Date
modified_by: String
account_rid: String
browse_file: String
document_name: String
attach_to: String
attachment_level: String
fiscal_year: Int
format: String
size_in_mb: String
document_category_rid: String
document_type_rid: String
document_category_others: String
document_type_others: String
comments: String
document_type: String
document_category: String
uploaded_by: String
attached_to: String
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