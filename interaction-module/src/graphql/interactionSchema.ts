import { gql } from "graphql-tag";

const interactionDefs = gql`

scalar JSON

input InteractionRequest {
rid : String!
status_rid : String!
account_rid : String!
fiscal_year : Int
flag : String
case_rid : String
project_fiscal_rid : String
project_rid : String
}

type InteractionResponse {
  rid: String
  status: String
  r_number: String
  created_by: String
  account_rid: String
  fiscal_year: Int
  modified_by: String
  project_rid: String
  project_code: String
  project_name: String
  total_records: Int
  last_resent_on: String
  recipient_name: String
  interaction_age: Int
  interaction_url: String
  recipient_email: String
  response_source: String
  attachment_count: Int
  created_datetime: String
  interaction_type: String
  key_contact_name: String
  last_reminder_on: String
  interaction_level: String
  key_contact_email: String
  modified_datetime: String
  four_part_r_number: String
  interaction_source: String
  project_fiscal_rid: String
  has_email_recipient: Boolean
  interaction_history: String
  response_updated_on: String
  interaction_batch_id: String
  has_account_recipient: Boolean
  interaction_iteration: Int
  response_submitted_on: String
  four_part_assessment_rid: String
  interaction_assessment_source_rid: String
  status_rid: String
  status_name: String
  interaction_type_rid: String
  interaction_type_name: String
  interaction_source_rid: String
  interaction_source_name: String
  interaction_level_rid: String
  interaction_level_name: String
  response_source_rid: String
  response_source_name: String
  created_user_name: String
  updated_user_name: String
  interaction_assessment_source_name: String
  interaction_status_rid : String
  interaction_status_name : String
}

type Query {
  _empty: String
}
type Response {
statusCode: Int,
statusCodeValue: String,
statusMessage: String,
data: InteractionResponse
}

type Mutation {
updateInteractions(data : InteractionRequest) :Response
}


`;

export default interactionDefs;