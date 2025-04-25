import { ManageProfileApiResponse } from "../types/manage-user";

export const manageProfileMockData: ManageProfileApiResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Success',
  data: {
    profile: [
      {
        rid: '848a701c-684a-4161-b3e2-3a466e3464f5',
        createdBy: 'KK KK',
        createdOn: '2023-07-18T09:00:00.000Z',
        profileName: 'Technical Consultant',
      },
      {
        rid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        createdBy: 'John Doe',
        createdOn: '2023-08-01T12:30:00.000Z',
        profileName: 'Project Manager',
      },
      {
        rid: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
        createdBy: 'Jane Smith',
        createdOn: '2023-07-25T15:45:00.000Z',
        profileName: 'UI/UX Designer',
      },
      {
        rid: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
        createdBy: 'Mike Johnson',
        createdOn: '2023-08-05T08:15:00.000Z',
        profileName: 'Software Engineer',
      }
    ],
    count: 4,  // Updated count to match the number of profiles
  },
};
