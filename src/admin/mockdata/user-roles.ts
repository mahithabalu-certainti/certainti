import { UserRolesApiResponse } from '../types/manage-user';

export const mockUserRoles: UserRolesApiResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Success',
  data: {
    roles: [
      {
        rid: '1a94f781-e3ef-41e9-874f-1742c2e86d91',
        business_teams: 'Account Administration',
      },
      {
        rid: 'f15143ee-4796-4abd-a984-fa559a624f18',
        business_teams: 'Project Administration',
      },
      {
        rid: '5ef971eb-e481-431a-99bb-988eb5840f81',
        business_teams: 'Case Administration',
      },
      {
        rid: '80a4391a-3c78-4c26-b34f-43e90b6c7344',
        business_teams: 'Project Financial Administration',
      },
      {
        rid: 'c5b5c663-27d1-4416-a8cb-87e37da71ff9',
        business_teams: 'Project Financial Review',
      },
      {
        rid: 'ce394e79-8a7b-48b8-b32c-46ff79c9dad7',
        business_teams: 'Project Technical Review',
      },
    ],
  },
};
