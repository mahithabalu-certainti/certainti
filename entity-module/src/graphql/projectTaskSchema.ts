import { gql } from 'apollo-server-express';

export const projectTaskSchema = gql`
  type ProjectTask {
      rid: String,
      r_number: String,
      account_rid: String,
      account_name: String,
      project_rid: String,
      project_name: String,
      project_code: String,
      project_resource_rid: String,
      resource_rid: String,
      resource_code: String,
      fiscal_year: Int,
      start_date: String,
      end_date: String,
      resource_name: String,
      resource_type_rid: String,
      resource_type_name: String,
      designation: String,
      resource_role: String,
      status_rid: String,
      country_rid: String,
      country_name: String,
      region_rid: String,
      region_name: String,
      currency_rid: String,
      resource_orgname: String,
      effort_project_task_level: Float,
      cost_project_task_level: Float,
      description: String,
      comments: String,
      created_datetime: String,
      modified_datetime: String
      created_by: String
      modified_by: String
  }

  type ProjectTaskResponse {
    statusCode: Int
    statusCodeValue: String
    statusMessage: String
    data: ProjectTask
  }

  input updateInlineProjectTask {
    rid: String!
    account_rid: String!
    fiscal_year: Int
    effort_project_task_level: Float
    cost_project_task_level: Float
    region_rid: String
    country_rid: String
    comments: String
  }

  type Mutation {
    updateProjectTask(
      data: updateInlineProjectTask
    ): ProjectTaskResponse
  }
`;
