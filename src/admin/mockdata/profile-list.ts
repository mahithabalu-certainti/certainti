import { UserProfileApiResponse } from '../types/manage-user';

export const manageProfileMockData: UserProfileApiResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Success',
  data: {
    profiles: [
      {
        rid: 'D001-c99d1f8e-3948-4899-95ac-0c04a81a87fa',
        created_by: 'D001-09c06141-8832-472f-9a88-74cd917a45bb',
        created_datetime: '2025-06-20T14:32:56.525Z',
        profile_name: 'Adminn',
        profile_type: 'default',
        profile_description:
          'Admin Profile with clone by Client Finance Associate',
        profile_status: 'active',
      },
      {
        rid: 'D001-03aefb04-b011-46c1-90c1-b56974941950',
        created_by: 'D001-09c06141-8832-472f-9a88-74cd917a45bb',
        created_datetime: '2025-06-23T13:55:21.116Z',
        profile_name: 'Alpha',
        profile_type: 'default',
        profile_description:
          'It supports financial operations by managing budgets, tracking project costs, preparing financial reports, and ensuring billing accuracy for clientss',
        profile_status: 'active',
      },
      {
        rid: 'D001-76d5c773-8b2a-4c7f-9b5b-5780bb83a279',
        created_by: 'D001-09c06141-8832-472f-9a88-74cd917a45bb',
        created_datetime: '2025-06-19T14:37:48.002Z',
        profile_name: 'Client Finance Associates',
        profile_type: 'default',
        profile_description:
          'Supports financial operations by managing budgets, tracking project costs, preparing financial reports, and ensuring billing accuracy for clients',
        profile_status: 'active',
      },
      {
        rid: 'D001-b78460e0-2248-43b7-8d61-4cb936d4b205',
        created_by: 'D001-09c06141-8832-472f-9a88-74cd917a45bb',
        created_datetime: '2025-06-19T14:38:34.459Z',
        profile_name: 'Client Finance Executive',
        profile_type: 'default',
        profile_description:
          'Oversees financial activities related to client accounts, ensuring accurate budgeting, forecasting, billing, and reporting.',
        profile_status: 'active',
      },
      {
        rid: 'D001-1f56802f-6fe9-4694-9dae-16dc353a642a',
        created_by: 'D001-09c06141-8832-472f-9a88-74cd917a45bb',
        created_datetime: '2025-06-30T13:24:54.250Z',
        profile_name: 'client test updated',
        profile_type: 'default',
        profile_description: 'Lorem ipsum updated profile newly',
        profile_status: 'active',
      },
      {
        rid: 'D001-49ed732a-6eae-45ca-b3de-6414f0484dc1',
        created_by: 'D001-09c06141-8832-472f-9a88-74cd917a45bb',
        created_datetime: '2025-06-19T14:37:03.112Z',
        profile_name: 'Financial Consultant',
        profile_type: 'default',
        profile_description:
          'Provides expert advice on managing finances, investments, and long-term financial planning',
        profile_status: 'active',
      },
      {
        rid: 'D001-777fcaf2-86c5-45d6-ae87-5ae2c04db94f',
        created_by: 'D001-09c06141-8832-472f-9a88-74cd917a45bb',
        created_datetime: '2025-06-19T14:39:13.517Z',
        profile_name: 'Project Point of Contact',
        profile_type: 'default',
        profile_description:
          'Designated individual responsible for communication and coordination between stakeholders involved in a project',
        profile_status: 'active',
      },
      {
        rid: 'D001-2d2c05c0-8dd3-4a69-b58e-abca5f917502',
        created_by: 'D001-477aac5d-3d92-4420-8e65-4153af4f3aed',
        created_datetime: '2025-06-19T10:13:22.656Z',
        profile_name: 'R&D Services Consultant',
        profile_type: 'default',
        profile_description:
          'Specializes in guiding organizations through research and development (R&D) initiatives.',
        profile_status: 'active',
      },
      {
        rid: 'D001-d8c8d804-8d8a-4792-9182-73299a31e497',
        created_by: 'D001-09c06141-8832-472f-9a88-74cd917a45bb',
        created_datetime: '2025-06-19T11:35:06.127Z',
        profile_name: 'Technical Consultant',
        profile_type: 'default',
        profile_description:
          'Technical Consultant - provides expert advice, guidance, and hands-on support in implementing and optimizing technology solutions for businesses',
        profile_status: 'active',
      },
    ],
  },
};
