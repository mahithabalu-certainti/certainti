import { ManageUserDetailApiResponse, UserRole } from '../types/manage-user';

export const mockUserDetails: ManageUserDetailApiResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Success',
  data: {
    users: {
      rid: '90ec4002-9aa2-4347-be66-57a93ecfde08',
      r_number: '',
      azure_id: 'c78c57bb-e89c-4310-9f8a-d429e8ebcdf4',
      first_name: 'Rizwan',
      last_name: 'Mohamed',
      full_name: 'Rizwan Mohamed',
      email: 'mohamed.rizwan@certainti.ai',
      street: '',
      city: '',
      state: '',
      zip_code: '',
      country: '2042d653-741c-4e7c-b5e0-0e1ba017134b',
      role_rid: '2d219324-a763-45e3-83ed-53d5b40b890f',
      profile_rid: '1a94f781-e3ef-41e9-874f-1742c2e86d91',
      status: 'active',
      created_by: 'Admin',
      modified_by: 'Admin',
      created_datetime: '2025-04-08T12:42:50.970Z',
      modified_datetime: '2025-04-15T12:53:52.082Z',
      profile: {
        profile_name: 'Administrator',
      },
      business_teams: {
        business_teams: 'Account Administration',
      },
      role: '',
      organization: '',
      profile_id: '',
      updated_by: UserRole.Admin,
    },
  },
};
