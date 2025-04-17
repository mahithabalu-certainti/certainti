import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { mockResourceUpdateResponse } from '../../mockdata/resource-update';
import {
  ResourceUpdatePayload,
  ResourceUpdateResponse,
} from '../../types/resource-edit';

export const useUpdateResource = (
  options?: UseMutationOptions<
    ResourceUpdateResponse,
    Error,
    ResourceUpdatePayload
  >
): UseMutationResult<ResourceUpdateResponse, Error, ResourceUpdatePayload> => {
  return useMutation<ResourceUpdateResponse, Error, ResourceUpdatePayload>({
    mutationFn: async () =>
      // payload: ResourceUpdatePayload
      {
        // const response = await api.put<ResourceUpdateResponse>(
        //   ResourceUpdateURL,
        //   payload
        // );
        return mockResourceUpdateResponse;
      },
    ...options,
  });
};
