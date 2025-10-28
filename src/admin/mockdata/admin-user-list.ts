import { ManageUserApiResponse } from '../types/manage-user';

export const ManageUserMockData: ManageUserApiResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Success',
  data: {
    count: 2,
    users: [
      {
        rid: '848a701c-684a-4161-b3e2-3a466e3464f5',
        email: 'test@gmail.com',
        status: {
          status_description: '',
          status_name: '',
        },
        full_name: 'KK KK',
        first_name: 'KK',
        profile: {
          profile_name: 'Technical Consultant',
          rid: '',
        },
        business_teams: {
          business_teams: 'Account Administration',
          rid: '',
        },
        created_datetime: '',
        modified_datetime: '',
        status_rid: '',
        azure_id: '',
      },
      {
        rid: '001891c0-ddfe-4521-a806-e489916616ad',
        email: 'rahul.adams@example.com',
        status: {
          status_description: '',
          status_name: '',
        },
        full_name: 'Isabella Adams',
        first_name: 'Rahul',
        profile: {
          profile_name: 'Administrator',
          rid: '',
        },
        business_teams: {
          business_teams: 'Case Administration',
          rid: '',
        },
        created_datetime: '',
        modified_datetime: '',
        status_rid: '',
        azure_id: '',
      },
    ],
  },
};
