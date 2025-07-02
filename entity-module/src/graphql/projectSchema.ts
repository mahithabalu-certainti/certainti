import {gql} from 'graphql-tag'

export const projectSchema = gql`

type UpdateProjectResponse {
    statusCode : Int,
    statusCodeValue : String,
    statusMessage : String
}

input updateInlineProject {
    account_rid : String!,
    project_rid : String!,
    project_code : String!,
    project_name : String,
    project_type_rid : String,
    project_fiscal_rid : String,
    fiscal_year : Int,
    project_classification_rid : String,
    project_client_group : String,
    project_group : String,
    assessment_status : String,
    comments : String
}

type Mutation {
    updateSpecificProjectDetails (data : updateInlineProject) : UpdateProjectResponse
}
`