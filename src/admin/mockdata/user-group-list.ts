import { UserGroupApiResponse } from '../types';

export const mockUserGroupList: UserGroupApiResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Success',
  data: {
    usergroup: [
      {
        rid: 'D001-23534a16-a850-44d6-b493-6178dc5fd82f',
        created_datetime: '2025-07-15T09:11:44.030Z',
        modified_datetime: null,
        group_name: 'G-Zoho-CY',
        is_consultant_only_group: false,
        group_type_rid: 'D001-9db5e71d-227f-4aac-89c2-8cde39ff3062',
        user_count: '0',
        user: {
          first_name: 'Super User',
          last_name: 'Certainti',
        },
        usergrouptype: {
          group_type_name: 'Child Client Firm',
          type: 'AUTO_ASSIGNED',
        },
        account_name: null,
      },
      {
        rid: 'D001-45f283de-6e20-4526-a003-2dc19e169a6a',
        created_datetime: '2025-07-15T09:59:02.564Z',
        modified_datetime: null,
        group_name: 'G-Separate DB',
        is_consultant_only_group: false,
        group_type_rid: 'D001-9db5e71d-227f-4aac-89c2-8cde39ff3062',
        user_count: '0',
        user: {
          first_name: 'Yogeshkumar',
          last_name: 'Tester',
        },
        usergrouptype: {
          group_type_name: 'Child Client Firm',
          type: 'AUTO_ASSIGNED',
        },
        account_name: null,
      },
      {
        rid: 'D001-13339b8b-2d45-49bf-8276-24b19b806643',
        created_datetime: '2025-07-15T14:40:31.564Z',
        modified_datetime: null,
        group_name: 'G-Hub-Test',
        is_consultant_only_group: true,
        group_type_rid: 'D001-e6cb5ea8-e992-4f92-825e-1ce987bfb91c',
        user_count: '0',
        user: {
          first_name: 'Vishnud',
          last_name: 'Varshini',
        },
        usergrouptype: {
          group_type_name: 'Global Client Firm',
          type: 'AUTO_ASSIGNED',
        },
        account_name: null,
      },
    ],
    count: 3,
  },
};
