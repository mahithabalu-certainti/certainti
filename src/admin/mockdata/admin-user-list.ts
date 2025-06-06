/* eslint-disable @typescript-eslint/no-explicit-any */

export const ManageUserMockData: any = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Success',
  data: {
    users: [
      {
        rid: '848a701c-684a-4161-b3e2-3a466e3464f5',
        email: 'test@gmail.com',
        status: 'active',
        full_name: 'KK KK',
        first_name: 'KK',
        profile: {
          profile_name: 'Technical Consultant',
        },
        business_teams: {
          business_teams: 'Account Administration',
        },
      },
      {
        rid: '001891c0-ddfe-4521-a806-e489916616ad',
        email: 'rahul.adams@example.com',
        status: 'active',
        full_name: 'Isabella Adams',
        first_name: 'Rahul',
        profile: {
          profile_name: 'Administrator',
        },
        business_teams: {
          business_teams: 'Case Administration',
        },
      },
    ],
  },
  requestId: 'b189dc09-d117-4d19-ab3d-420aab3a7ac6',
};
