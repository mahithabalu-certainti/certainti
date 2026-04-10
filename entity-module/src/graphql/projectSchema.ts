import {gql} from 'graphql-tag'

export const projectSchema = gql`

scalar Date

type keyContactDetails {
rid: String,
r_number: String,
created_by: String,
modified_by: String,
created_datetime: Date,
modified_datetime: Date,
entity_rid: String,
entity_type: String,
key_contact_name: String,
key_contact_email: String,
key_contact_role: String,
is_primary_contact: Boolean,
include_in_communication: Boolean,
interaction_cc_recipient: Boolean,
status_rid: String,
role_name: String,
status_name: String
}

type ProjectFiscalDetails {
    rid: String
    project_fiscal_rid : String
    classification_name : String
    r_number: String
    eid: String
    created_by: String
    modified_by: String
    created_datetime: Date
    modified_datetime: Date
    project_rid: String
    project_code: String
    industry_rid: String
    industry_name: String
    fiscal_year: Int
    project_name: String
    program_name: String
    project_type_rid: String
    project_classification_rid: String
    project_classification_other: String
    project_client_group: String
    project_group: String
    auto_send_ai_interaction: String
    account_rid: String
    country_rid: String
    region_rid: String
    currency_rid: String
    max_ai_interaction: String
    expiry_duration: String
    auto_access_rd: String
    status_rid: String
    project_startdate: String
    project_enddate: String
    total_fte_prj: String
    total_fte_from_prj_res: String
    total_fte_from_tasks: String
    total_subcon_prj: String
    total_subcon_from_prj_res: String
    total_subcon_from_tasks: String
    total_nonlabor_prj: String
    total_nonlabor_from_prj_res: String
    total_resources_prj: String
    total_resources_from_prj_res: String
    total_resources_from_tasks: String
    total_effort_prj: String
    total_effort_fte_prj: String
    total_effort_subcon_prj: String
    total_effort_from_prj_res: String
    total_effort_fte_from_prj_res: String
    total_effort_subcon_from_prj_res: String
    total_effort_from_tasks: String
    total_effort_fte_from_tasks: String
    total_effort_subcon_from_tasks: String
    total_cost_prj: String
    total_cost_fte_prj: String
    total_cost_subcon_prj: String
    total_cost_nonlabor_prj: String
    total_cost_from_prj_res: String
    total_cost_fte_from_prj_res: String
    total_cost_subcon_from_prj_res: String
    total_cost_nonlabor_from_prj_res: String
    total_cost_from_tasks: String
    total_cost_fte_from_tasks: String
    total_cost_subcon_from_tasks: String
    total_cost_prj_blended: String
    qre_final: String
    total_cost_fte_prj_blended : String
    total_cost_subcon_prj_blended : String
    total_cost_from_prj_res_blended : String
    total_cost_fte_from_prj_res_blended : String
    total_cost_subcon_from_prj_res_blended : String
    total_cost_from_tasks_blended : String
    total_cost_fte_from_tasks_blended : String
    total_cost_subcon_from_tasks_blended : String
    blended_rate_fte : String
    blended_rate_subcon : String
    rd_percent_potential_ai : String
    rd_percent_adjustment : String
    rd_percent_final : String
    qre_fte : String
    qre_subcon : String
    qre_nonlabor : String
    rd_credits_fte_fed_level : String
    rd_credits_subcon_fed_level : String
    rd_credits_nonlabor_fed_level : String
    rd_credits_fed_level : String
    rd_credits_total : String
    interaction_cc_list : String
    assessment_status : String
    claim_status : String
    comments : String
    project_description : String
    is_assesed : Boolean
    is_qualified : Boolean
    total_fte : String
    total_effort : String
    total_cost : String
    total_cost_fte : String
    total_cost_subcon : String
    total_cost_nonlabor : String
    project_type_name : String
    currency_symbol: String
  }

type projectNewResponse {
    rid: String
    r_number: String
    eid: String
    created_datetime: Date
    modified_datetime: Date
    created_by: String
    modified_by: String
    project_code: String
    industry_rid: String
    industry_name: String
    account_rid: String
    program_name: String
    project_name: String
    project_startdate: String
    project_enddate: String
    project_type_rid: String
    project_classification_rid: String
    project_classification_other: String
    project_client_group: String
    project_group: String
    status_rid: String
    country_rid: String
    region_rid: String
    currency_rid: String
    comments: String
    project_description: String
    assessment_status: String
    is_assesed: Boolean
    is_qualified: Boolean
    total_fte: String
    total_subcon: String
    total_effort: String
    total_cost: String
    total_effort_fte: String
    total_effort_subcon: String
    total_cost_fte: String
    total_cost_subcon: String
    total_cost_nonlabor: String
    auto_send_ai_interaction: String
    auto_access_rd: String
    max_ai_interaction: String
    blended_rate_fte: String
    blended_rate_subcon: String
    blended_rate: String
    is_rd_qualified: String
    qre: String
    qre_final : String
    project_rid: String
    technical_point_of_contact: String
    financial_consultant: String
    project_point_of_contact: String
    currency_code: String
    currency_symbol: String
    classification_name: String
    is_other_classification: String
    project_type_name: String
    status_name: String
    ProjectFiscal : [ProjectFiscalDetails]
}

type projectQreAdjustmentResponse {
    rid: String
    r_number: String
    eid: String
    created_datetime: Date
    modified_datetime: Date
    created_by: String
    modified_by: String
    project_code: String
    rd_percent_potential_ai: String
    rd_percent_adjustment: String
    rd_percent_final: String
    qre_fte: String
    qre_subcon: String
    qre_nonlabor: String
    qre_final: String
}

type UpdateProjectResponse {
    statusCode : Int,
    statusCodeValue : String,
    statusMessage : String,
    data : projectNewResponse
}

type UpdateProjectQreResponse {
    statusCode : Int,
    statusCodeValue : String,
    statusMessage : String,
    data : projectQreAdjustmentResponse
}

input updateInlineProject {
    account_rid : String!,
    project_rid : String!,
    project_code : String,
    project_name : String,
    project_type_rid : String,
    project_fiscal_rid : String,
    fiscal_year : Int,
    project_classification_rid : String,
    project_classification_other : String,
    project_client_group : String,
    project_group : String,
    assessment_status : String,
    comments : String,
    is_assesed : Boolean,
    is_qualified : Boolean,
    total_cost_nonlabor : String,
    total_cost_subcon : String,
    total_cost_fte : String,
    total_effort : String,
    total_cost : String,
    global_fiscal_year : Int!
}

input QreAdjustmentInput {
  account_rid : String!,
  rid: String!
  rd_percent_potential_ai: Float!    
} 

type Mutation {
    updateSpecificProjectDetails (data : updateInlineProject) : UpdateProjectResponse
    updateQreAdjustment(data: QreAdjustmentInput!): UpdateProjectQreResponse
}
`