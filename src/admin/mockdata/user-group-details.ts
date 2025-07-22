import { UserGroupDetailsApiResponse } from '../types';

export const mockUserGroupDetails: UserGroupDetailsApiResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Success',
  data: {
    userGroupById: {
      rid: 'D001-a1dc7073-25f8-4a24-b567-ff7960c3b8a4',
      r_number: 'GRP-0000001009',
      created_by: 'Super User Certainti',
      modified_by: null,
      created_datetime: '2025-07-21T17:50:08.981Z',
      modified_datetime: null,
      group_name: 'Sample one',
      group_type_rid: 'D001-345f2190-4c8e-4863-a662-077ef687b687',
      is_consultant_only_group: true,
      status_rid: 'D001-5c952c6a-7f05-4e99-be04-97ea50bcf87b',
      group_type: 'CUSTOM',
      users: [
        {
          rid: 'D001-79c7fc6e-d99c-4a69-9e24-c064bac251a0',
          email: 'arun.mani@certainti.ai',
          name: 'Arun Mani',
          account_rid: 'RESDEV',
          is_consultant: true,
          has_access: false,
        },
        {
          rid: 'D001-caace427-6365-469d-b8e5-d6322da67d40',
          email: 'dhivya.s@hubino.com',
          name: 'Dhivya Sivasami',
          account_rid: 'RESDEV',
          is_consultant: true,
          has_access: true,
        },
      ],
      accounts: [
        {
          rid: 'D001-4ec104fe-b303-4740-bb69-956bb5f6774d',
          account_name: 'MicroSoft-Global',
          has_access: false,
        },
        {
          rid: 'D001-9958281d-97ff-4fd1-ad54-40dca746157e',
          account_name: 'Hubino innovation',
          has_access: false,
        },
      ],
      projects: [
        {
          project_rid: 'D001-cb46d3e6-9740-45ba-98cf-1dbad4a4824a',
          project_name: 'Gopi',
          project_code: 'PR004546',
          account_rid: 'D001-61c08383-92ec-4b84-97b5-337993d8144f',
          account_name: 'Zoho-UK',
          has_access: true,
          access_type: 'INCLUDE',
        },
      ],
    },
  },
};
