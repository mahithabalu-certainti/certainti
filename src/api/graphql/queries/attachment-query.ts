import { gql } from '@apollo/client';

export const ATTACHMENT_UPDATE = gql`
  mutation UpdateAttachmentInline($data: attachmentInlineInput!) {
    updateAttachmentInline(data: $data) {
      statusCode
      statusCodeValue
      statusMessage
      data {
        document_rid
        r_number
        created_datetime
        created_by
        modified_datetime
        modified_by
        account_rid
        browse_file
        document_name
        attach_to
        attachment_level
        fiscal_year
        format
        size_in_mb
        document_category_rid
        document_type_rid
        document_category_others
        document_type_others
        comments
        document_type
        document_category
        uploaded_by
        attached_to
      }
    }
  }
`;
