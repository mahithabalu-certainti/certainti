import { UserGroupTypesApiResponse } from '../types';

export const mockUserGroupTypes: UserGroupTypesApiResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Success',
  data: {
    groupTypes: [
      {
        rid: 'D001-9db5e71d-227f-4aac-89c2-8cde39ff3062',
        group_type_name: 'Client Firm Child',
        group_type_description: 'Client Firm Child',
        type: 'AUTO_ASSIGNED_CHILD',
        is_consultant_only_group: false,
      },
      {
        rid: 'D001-e6cb5ea8-e992-4f92-825e-1ce987bfb91c',
        group_type_name: 'Client Firm Global',
        group_type_description: 'Client Firm Global',
        type: 'AUTO_ASSIGNED_PARENT',
        is_consultant_only_group: false,
      },
      {
        rid: 'D001-99bc7fdd-f233-4736-808d-73ba1a700024',
        group_type_name: 'Custom Child Client Firm',
        group_type_description: 'Custom Child Client Firm',
        type: 'CUSTOM',
        is_consultant_only_group: false,
      },
      {
        rid: 'D001-dd4a5324-34d6-421c-a7dc-b30964f9e73e',
        group_type_name: 'Custom Global Client Firm',
        group_type_description: 'Client Firm Custom',
        type: 'CUSTOM',
        is_consultant_only_group: false,
      },
      {
        rid: 'D001-345f2190-4c8e-4863-a662-077ef687b687',
        group_type_name: 'Custom Global Consultant Firm',
        group_type_description: 'Consultant Firm Custom',
        type: 'CUSTOM',
        is_consultant_only_group: true,
      },
      {
        rid: 'D001-a647bb37-37fc-48e4-abdf-60d7104234c6',
        group_type_name: 'Global Consultant Firm',
        group_type_description: 'Consultant Firm Global',
        type: 'DEFAULT',
        is_consultant_only_group: true,
      },
      {
        rid: 'D001-37d3d408-9feb-4235-acce-32166d1dca66',
        group_type_name: 'Platform Administrators',
        group_type_description: 'Platform Admin',
        type: 'DEFAULT',
        is_consultant_only_group: true,
      },
    ],
  },
};
