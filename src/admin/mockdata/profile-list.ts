import { UserProfileApiResponse } from '../types/manage-user';

export const manageProfileMockData: UserProfileApiResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Success',
  data: {
    profiles: [
      {
        rid: '848a701c-684a-4161-b3e2-3a466e3464f5',
        created_by: 'KK KK',
        created_datetime: '2023-07-18T09:00:00.000Z',
        profile_name: 'Technical Consultant',
        profile_description: '',
        profile_status: '',
        profile_type: '',
      },
      {
        rid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        created_by: 'John Doe',
        created_datetime: '2023-08-01T12:30:00.000Z',
        profile_name: 'Project Manager',
        profile_description: '',
        profile_status: '',
        profile_type: '',
      },
      {
        rid: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
        created_by: 'Jane Smith',
        created_datetime: '2023-07-25T15:45:00.000Z',
        profile_name: 'UI/UX Designer',
        profile_description: '',
        profile_status: '',
        profile_type: '',
      },
      {
        rid: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
        created_by: 'Mike Johnson',
        created_datetime: '2023-08-05T08:15:00.000Z',
        profile_name: 'Software Engineer',
        profile_description: '',
        profile_status: '',
        profile_type: '',
      },
    ],
  },
};
