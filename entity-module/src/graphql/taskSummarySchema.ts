import { gql } from 'graphql-tag'

const typeDefs = gql
    `
type taskResponse {
rid: String
r_number: String
created_datetime: Date
created_by: String
modified_datetime: Date
modified_by: String
account_rid: String
attach_to: String
attachment_level: String
task_name: String
description: String
fiscal_year: Int
assigned_to: String
status_rid: String
priority_rid: String
effective_start_datetime: Date
effective_end_datetime: Date
task_rid: String
status_name: String
priority_name: String
}


type taskFinalresponse {
statusCode : Int
statusCodeValue : String
statusMessage : String
data : taskResponse
}

input taskInlineInput {
rid : String!
task_rid : String!
account_rid : String!
task_type_name: String!
attachment_level: String!
attach_to: String!
task_name: String
description: String
fiscal_year: Int
assigned_to: String
effective_start_datetime: Date
effective_end_datetime: Date
status_rid: String
priority_rid: String
}

type Mutation {
updateTaskSummaryInline(data : taskInlineInput) : taskFinalresponse
}
`
export default typeDefs