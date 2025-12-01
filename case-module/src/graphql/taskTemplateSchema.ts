import {gql} from 'graphql-tag'

export const taskTemplateDefs = gql`
scalar Date

type TaskResponse {
rid: String
r_number: String
created_by_name: String
modified_by_name: String
created_datetime: Date
modified_datetime: Date
task_name: String
sequence_no: Int
effort_in_days: Int
effective_start_datetime: Date
effective_end_datetime: Date
role_name: String
case_team_member_role_rid: String
checklist_name: String
checklist_template_rid: String
priority_name: String
priority_rid: String
status_name: String
status_rid: String
milestone_name: String
milestone_template_rid: String
task_type_rid : String
task_type_name : String
task_description : String
weightage_rid : String
weightage_value : Int
task_category_rid : String
category_name : String
}

type finalTaskResponse {
statusCode : Int
statusCodeValue : String
statusMessage : String
data : TaskResponse
}

input taskUpdateInput {
rid : String
milestone_template_rid: String
priority_rid: String
checklist_template_rid: String
case_team_member_role_rid: String
effort_in_days: String
task_name : String
task_type_rid : String
task_description : String
task_category_rid : String
weightage_rid : String
status_rid : String
}

type Mutation {
UpdateTaskTemplateInline (data : taskUpdateInput) : finalTaskResponse
}





`