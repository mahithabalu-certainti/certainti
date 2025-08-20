import { InteractionAttachmentApiResponse } from '../types';

export const interactionAttachmentMockData: InteractionAttachmentApiResponse = {
  data: {
    attachments: [
      {
        rid: '1',
        question_number: 'Q-001',
        name: 'Attachment 1.pdf',
        type: 'PDF',
        size: '1.2 MB',
        uploaded_by: 'John Doe',
        uploaded_date: '2023-07-28',
        download: 'download-link-1',
      },
      {
        rid: '2',
        question_number: 'Q-002',
        name: 'Attachment 2.docx',
        type: 'DOCX',
        size: '2.5 MB',
        uploaded_by: 'Jane Smith',
        uploaded_date: '2023-07-27',
        download: 'download-link-2',
      },
    ],
    total_count: 2,
  },
};
