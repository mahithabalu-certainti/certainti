// api.ts (add this to your existing file)
import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { api } from '../../../api/api';

// ... your existing imports and code ...

type ResourceCreatePayload = {
  // Define the expected payload type for resource creation
  // Adjust according to your API requirements
  name: string;
  description?: string;
  // other fields...
};

type ResourceCreateResponse = {
  // Define the expected response type
  data: {
    id: string;
    name: string;
    createdAt: string;
    // other fields...
  };
  message?: string;
};

export const useCreateResource = (
  options?: UseMutationOptions<
    ResourceCreateResponse,
    Error,
    ResourceCreatePayload
  >
): UseMutationResult<ResourceCreateResponse, Error, ResourceCreatePayload> => {
  return useMutation<ResourceCreateResponse, Error, ResourceCreatePayload>({
    mutationFn: async (payload: ResourceCreatePayload) => {
      const response = await api.post<ResourceCreateResponse>(
        '/api/resource/create',
        payload
      );
      return response.data;
    },
    ...options,
  });
};
