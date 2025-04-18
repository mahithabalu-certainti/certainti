import { useApiMutation } from '../../../api/mutation';
import { ResourceUpdateResponse } from '../../types/resource-edit';

export const useUpdateResource = () => {
  return useApiMutation<unknown, Partial<ResourceUpdateResponse>>(
    'https://dev-platform20-api-management.azure-api.net/entityService/api/resources/update',
    'put'
  );
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
