import {gql} from 'graphql-tag'

export const checkListTypeDefs = gql
`
type checkListResponse {
rid: String
r_number: String
created_datetime: Date
created_by: String
modified_datetime: Date
modified_by: String
account_rid: String
checklist_name: String
attach_to: String
attachment_level: String
fiscal_year: Int
status_rid: String
checklist_description: String
checklist_template_rid:String
attached_to: String
created_by_name : String
modified_by_name : String
assigned_to: String
}

type checkListFinalresponse {
statusCode : Int
statusCodeValue : String
statusMessage : String
data : checkListResponse
}

input checkListInlineInput {
	rid: String!
	account_rid: String!
	fiscal_year: Int
	checklist_name: String
	attachment_level: String
	attach_to: String
}

type Mutation {
updateCheckListInline(data : checkListInlineInput) : checkListFinalresponse
}
`
