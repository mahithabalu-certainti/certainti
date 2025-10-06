import { gql } from '@apollo/client';

export const NOTES_UPDATE = gql`
  mutation UpdateNotesInline($data: notesInlineInput!) {
    updateNotesInline(data: $data) {
      statusCode
      statusCodeValue
      statusMessage
      data {
        rid
        notes_rid
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
        title
        notes_owner
        descriptions
        created_by_name
        modified_by_name
        attached_to
        uploaded_by
      }
    }
  }
`;
