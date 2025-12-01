import { gql } from '@apollo/client';

export const EMAIL_TEMPLATE = gql`
  mutation UpdateEmailTemplate($data: UpdateEmailTemplateInput!) {
    updateEmailTemplate(data: $data) {
      statusCode
      statusCodeValue
      statusMessage
      data {
        rid
        r_number
        created_by
        modified_by
        created_datetime
        modified_datetime
        template_name
        description
        category_rid
        subject
        body_html
        status_rid
        created_user_name
        modified_user_name
        status_name
        category_name
      }
    }
  }
`;
