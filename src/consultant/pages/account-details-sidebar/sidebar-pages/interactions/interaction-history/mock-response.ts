import { InteractionHistoryData } from './utils';

export const mockInteractionHistory: InteractionHistoryData = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Interaction History fetched successfully',
  data: {
    project_code: 'PRJ-091',
    project_name: 'sample project',
    response_source: 'email',
    interaction_rnumber: 'INT-9181',
    interaction_history: [
      {
        rid: 'D001-04baf317-2cc3-484c-b0f2-bd451a78753d',
        action: 'Created',
        date: '2025-08-13 11:27:09.979427',
      },
      {
        rid: 'D001-7ca79475-64a5-4232-a0af-b4a21594105e',
        action: 'Sent',
        date: '2025-08-13 11:27:09.979427',
      },
    ],
  },
};
