import { ActiveUserForGroupApiResponse } from '../types';

export const userGroupUserList: ActiveUserForGroupApiResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Success',
  data: {
    users: [
      {
        rid: 'D001-d3de2e85-a82f-4ed7-a896-8c4568b31d55',
        email: 'johnmathew@mailinator.com',
        status_rid: 'D001-5c952c6a-7f05-4e99-be04-97ea50bcf87b',
        first_name: 'John',
        org_id: 'D001-5d9f3cf1-1aed-4c20-9268-b755c7a8fb24',
        is_consultant_firm: false,
        organization_name: 'freshwork-USA',
      },
    ],
    count: 1,
  },
};
