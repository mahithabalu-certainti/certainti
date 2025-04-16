// api.ts (add this to your existing file)
import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { mockResourceCreateApiResponse } from '../../mockdata/resource-create';
import {
  ResourceCreateApiResponse,
  ResourceCreatePayload,
} from '../../types/resource-create';

export const useCreateResource = (
  options?: UseMutationOptions<
    ResourceCreateApiResponse,
    Error,
    ResourceCreatePayload
  >
): UseMutationResult<
  ResourceCreateApiResponse,
  Error,
  ResourceCreatePayload
> => {
  return useMutation<ResourceCreateApiResponse, Error, ResourceCreatePayload>({
    mutationFn: async () =>
      // payload: ResourceCreatePayload
      {
        // const response = await api.post<ResourceCreateApiResponse>(
        //   ResourceCreateURL,
        //   payload
        // );
        return mockResourceCreateApiResponse;
      },
    ...options,
  });
};
