import { ResponseInteractionListResponse } from '../../../../../types';

export const mockResponse: ResponseInteractionListResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Interaction Response history fetched successfully',
  data: {
    page: 1,
    limit: 10,
    totalCount: 2,
    response_history: [
      {
        rid: 'D001-bec9649a-3c62-4a12-bf77-a8df09b543e9',
        r_number: 'INT-0000000029',
        response_on: '2025-08-13T11:26:42.044+00:00',
        total_records: 2,
        response_email: null,
        response_by_rid: 'D001-09c06141-8832-472f-9a88-74cd917a45bb',
        response_source: 'Manual',
        interaction_response: 'dhivya',
        interaction_source_rid: 'D001-079287d0-d214-4bbe-9bb7-3c26a3c8dccb',
        interaction_source_name: 'Manual',
        response_by: 'Super User Certainti',
      },
      {
        rid: 'D001-bec9649a-3c62-4a12-bf77-a8df09b543e9',
        r_number: 'INT-0000000029',
        response_on: '2025-08-13T11:26:52.103+00:00',
        total_records: 2,
        response_email: null,
        response_by_rid: 'D001-09c06141-8832-472f-9a88-74cd917a45bb',
        response_source: 'Manual',
        interaction_response: 'dhivya',
        interaction_source_rid: 'D001-079287d0-d214-4bbe-9bb7-3c26a3c8dccb',
        interaction_source_name: 'Manual',
        response_by: 'Super User Certainti',
      },
    ],
  },
};
