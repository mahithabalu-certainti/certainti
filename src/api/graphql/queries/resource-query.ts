import { gql } from '@apollo/client';

export const UPDATE_RESOURCE_COST = gql`
  mutation UpdateResourceCostInline($data: resourceCostInlineInput!) {
    updateResourceCostInline(data: $data) {
      statusCode
      statusCodeValue
      statusMessage
      data {
        rid
        r_number
        eid
        created_by
        modified_by
        created_datetime
        modified_datetime
        account_rid
        resource_rid
        resource_code
        resource_number
        fiscal_year
        effective_from
        end_date
        effort_in_hrs
        currency_rid
        comments
        deductions
        insurance
        bonus
        resource_cost
        salary
        net_resource_cost
        status_rid
        resource_type_rid
        resource_name
        resource_orgname
        resource_designation
        resource_role
        account_name
        status_name
        resource_type_name
        currency_code
        currency_name
        currency_symbol
      }
    }
  }
`;

export const UPDATE_RESOURCE_SKILL = gql`
  mutation UpdateResourceSkillInline($data: updateResourceSkillInline!) {
    updateResourceSkillInline(data: $data) {
      statusCode
      statusCodeValue
      statusMessage
      data {
        rid
        r_number
        eid
        created_by
        modified_by
        created_datetime
        modified_datetime
        account_rid
        resource_rid
        resource_number
        start_date
        skill_description
        skill_type_others
        skill_subtype_others
        resource_code
        skill_type_rid
        skill_subtype_rid
        skill_details
        comments
        status_rid
        resource_type_rid
        skill_level_rid
        resource_name
        resource_role
        resource_orgname
        resource_designation
        years_of_experience
        account_name
        skill_type_name
        skill_subtype_name
        skill_level_name
      }
    }
  }
`;

export const UPDATE_RESOURCE = gql`
  mutation UpdateResourceInline($data: updateInlineResource!) {
    updateResourceInline(data: $data) {
      statusCode
      statusCodeValue
      statusMessage
      data {
        rid
        r_number
        resource_code
        resource_name
        resource_firstname
        resource_lastname
        resource_type_rid
        status_rid
        resource_role
        resource_designation
        resource_orgname
        comments
        resource_total_experience
        country_rid
        region_rid
        city_rid
        account_name
        total_project_hours
        estimated_rd_hours
        country_name
        region_name
        city_name
        resource_type_name
        status_name
      }
    }
  }
`;
