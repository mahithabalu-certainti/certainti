// // api.ts (add this to your existing file)
// import {
//   useMutation,
//   UseMutationOptions,
//   UseMutationResult,
// } from '@tanstack/react-query';
// import { mockResourceCreateApiResponse } from '../../mockdata/resource-create';
// import {
//   ResourceCreateApiResponse,
//   ResourceCreatePayload,
// } from '../../types/resource-create';

// export const useCreateResource = (
//   options?: UseMutationOptions<
//     ResourceCreateApiResponse,
//     Error,
//     ResourceCreatePayload
//   >
// ): UseMutationResult<
//   ResourceCreateApiResponse,
//   Error,
//   ResourceCreatePayload
// > => {
//   return useMutation<ResourceCreateApiResponse, Error, ResourceCreatePayload>({
//     mutationFn: async () =>
//       // payload: ResourceCreatePayload
//       {
//         // const response = await api.post<ResourceCreateApiResponse>(
//         //   ResourceCreateURL,
//         //   payload
//         // );
//         return mockResourceCreateApiResponse;
//       },
//     ...options,
//   });
// };

import { useMutation } from '@tanstack/react-query';
import {
  Resource,
  ResourceCreateApiResponse,
} from '../../types/resource-create';
import { resourceServiceApi } from '../../../api/api';

export const useCreateResource = (accountId: string) => {
  return useMutation<ResourceCreateApiResponse, Error, Partial<Resource>>({
    mutationFn: (body) => createResource(body, accountId),
  });
};

export const createResource = async (
  body: Partial<Resource>,
  accountId: string
): Promise<ResourceCreateApiResponse> => {
  try {
    const { data } = await resourceServiceApi.post<ResourceCreateApiResponse>(
      '/api/resources/new',
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
