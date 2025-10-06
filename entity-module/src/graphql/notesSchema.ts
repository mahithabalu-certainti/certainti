import {gql} from 'graphql-tag'

const typeDefs = gql
`
type notesResponse {
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
title: String
notes_owner: String
descriptions: String
uploaded_by: String
attached_to: String
}

type notesFinalresponse {
statusCode : Int
statusCodeValue : String
statusMessage : String
data : notesResponse
}

input notesInlineInput {
rid : String!
account_rid : String!
fiscal_year: Int
title: String
notes_owner: String
descriptions: String
}

type Mutation {
updateNotesInline(data : notesInlineInput) : notesFinalresponse
}
`
export default typeDefs