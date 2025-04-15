import { ManageUserDetailApiResponse, UserRole } from '../types/manage-user';

export const mockUserDetails: ManageUserDetailApiResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Success',
  data: {
    users: [
      {
        rid: 'b48f4ae6-2bab-46c6-8835-9f3db7581e82',
        first_name: 'Kevin',
        last_name: 'Peter',
        full_name: 'Kevin Peter',
        email: 'john4568@yopmail.com',
        street: '47 W 13th St',
        city: 'New York',
        state: 'Brooklyn',
        zip_code: 'NY 10011',
        country: '3',
        status: 'active',
        profile_rid: '5ef971eb-e481-431a-99bb-988eb5840f81',
        azure_id: 'asd22e4',
        organization: import.meta.env.VITE_ORGANIZATION,
        profile_id: 'sdfds234',
        role: 'asdsdd',
        role_rid: 'asdsadad',
        updated_by: UserRole.Admin,
      },
    ],
  },
};
