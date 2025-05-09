import { Resource } from 'i18next';
import { ResourceUpdateResponse } from '../../types/resource-edit';
import { useMutation } from '@tanstack/react-query';
import { resourceServiceApi } from '../../../api/api';

export const useUpdateResource = (accountId: string) => {
  return useMutation<ResourceUpdateResponse, Error, Partial<Resource>>({
    mutationFn: (body) => updateResource(body, accountId),
  });
};

export const updateResource = async (
  body: Partial<Resource>,
  accountId: string
): Promise<ResourceUpdateResponse> => {
  try {
    const { data } = await resourceServiceApi.put<ResourceUpdateResponse>(
      '/api/resources/update',
      body,
      {
        headers: { 'x-account-id': accountId },
      }
    );
    return data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

// export const useUpdateResource = (
//   options?: UseMutationOptions<
//     ResourceUpdateResponse,
//     Error,
//     ResourceUpdatePayload
//   >
// ): UseMutationResult<ResourceUpdateResponse, Error, ResourceUpdatePayload> => {
//   return useMutation<ResourceUpdateResponse, Error, ResourceUpdatePayload>({
//     mutationFn: async () =>
//       // payload: ResourceUpdatePayload
//       {
//         // const response = await api.put<ResourceUpdateResponse>(
//         //   ResourceUpdateURL,
//         //   payload
//         // );
//         return mockResourceUpdateResponse;
//       },
//     ...options,
//   });
// };
