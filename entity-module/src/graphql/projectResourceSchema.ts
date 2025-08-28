import { gql } from "graphql-tag";

export const projectResourceSchema = gql`
  type ProjectResource {
    rid: ID
    r_number: String
    eid: String
    created_by: String!
    modified_by: String
    created_datetime: String!
    modified_datetime: String
    account_rid: String!
    project_rid: String!
    project_fiscal_rid: String!
    resource_rid: String!
    project_code: String!
    project_resource_code: String!
    fiscal_year: Int!
    start_date: String
    end_date: String
    resource_code: String!
    resource_name: String
    resource_type_rid: String
    designation: String
    resource_role: String
    assigned_skill_role_type_rid: String
    total_hours_pro_res: String
    total_cost_pro_res: String
    status_rid: String
    country_rid: String
    region_rid: String
    currency_rid: String
    resource_orgname: String
    effort_project_resource_level: String
    cost_project_resource_level: String
    qre_final: String
    qre_percent: String
    salary: String
    bonus: String
    insurance: String
    deductions: String
    description: String
    country_name: String
    country_code: String
    region_name: String
    currency_name: String
    currency_symbol: String
    created_name: String
    modified_name: String
    status_name: String
    resource_type_name: String
    assigned_skill_role: String
  }

  type ProjectRessourceResponse {
    statusCode: Int
    statusCodeValue: String
    statusMessage: String
    data: ProjectResource
  }

  input updateInlineProjectResource {
    account_rid: String!
    project_fiscal_rid: String!
    project_resource_rid: String!
    resource_name: String
    resource_code: String
    region_rid: String
    country_rid: String
    resource_type_rid: String
    resource_role: String
    total_hours_pro_res: String
    total_cost_pro_res: String
    description: String
  }

  type Mutation {
    updateProjectResource(
      data: updateInlineProjectResource
    ): ProjectRessourceResponse
  }
`;
