import { gql } from '@apollo/client';

export const UPDATE_RESOURCE_COST = gql`
  mutation UpdateResourceCostInline($data: resourceCostInlineInput!) {
    updateResourceCostInline(data: $data) {
      statusCodeValue
      statusMessage
      statusCode
    }
  }
`;

export const UPDATE_RESOURCE_SKILL = gql`
  mutation UpdateResourceSkillInline($data: updateResourceSkillInline!) {
    updateResourceSkillInline(data: $data) {
      statusCode
      statusCodeValue
      statusMessage
    }
  }
`;

export const UPDATE_RESOURCE = gql`
  mutation UpdateResourceInline($data: updateInlineResource!) {
    updateResourceInline(data: $data) {
      statusCode
      statusCodeValue
      statusMessage
    }
  }
`;
