import { ProjectListByAccountsApiResponse } from '../types';

export const mockProjectListByAccounts: ProjectListByAccountsApiResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Success',
  data: {
    projects: [
      {
        project_rid: 'D001-ed7436f1-3087-4a48-9491-1f46150961c3',
        project_name: 'Gopi',
        account_rid: 'D001-61c08383-92ec-4b84-97b5-337993d8144f',
        has_access: false,
        access_type: null,
        project_code: '',
      },
      {
        project_rid: 'D001-1e8e22c8-3c03-4271-af71-a4d8d3877df3',
        project_name: 'projects',
        account_rid: 'D001-61c08383-92ec-4b84-97b5-337993d8144f',
        has_access: false,
        access_type: null,
        project_code: '',
      },
      {
        project_rid: 'D001-56a160e5-6015-41cd-b8b0-0f703c4f2088',
        project_name: 'projects',
        account_rid: 'D001-61c08383-92ec-4b84-97b5-337993d8144f',
        has_access: false,
        access_type: null,
        project_code: '',
      },
      {
        project_rid: 'D001-8b6f2803-2863-432f-9c3d-baa40b543c66',
        project_name: 'projects',
        account_rid: 'D001-61c08383-92ec-4b84-97b5-337993d8144f',
        has_access: false,
        access_type: null,
        project_code: '',
      },
    ],
    totalCount: 10,
  },
};
