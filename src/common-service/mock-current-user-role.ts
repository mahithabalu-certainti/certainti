import { GetCurrentUserRoleApiResponse, UserRoles } from '.';

export const mockCurrentUserRole: GetCurrentUserRoleApiResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Success',
  data: {
    rid: '84268de1-936a-43c3-b98c-a48858c8bb42',
    user_role: UserRoles.AccountAdministration,
  },
};
