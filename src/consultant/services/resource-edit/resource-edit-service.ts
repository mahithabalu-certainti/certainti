import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { api } from '../../../api/api';

// ... your existing imports and code ...

type ResourceUpdatePayload = {
  // Define the expected payload type for resource update
  id: string; // Assuming you need to pass the ID in the payload
  name?: string;
  description?: string;
  // other updatable fields...
};

type ResourceUpdateResponse = {
  // Define the expected response type
  data: {
    id: string;
    name: string;
    updatedAt: string;
    // other fields...
  };
  message?: string;
};

export const useUpdateResource = (
  options?: UseMutationOptions<
    ResourceUpdateResponse,
    Error,
    ResourceUpdatePayload
  >
): UseMutationResult<ResourceUpdateResponse, Error, ResourceUpdatePayload> => {
  return useMutation<ResourceUpdateResponse, Error, ResourceUpdatePayload>({
    mutationFn: async (payload: ResourceUpdatePayload) => {
      const response = await api.put<ResourceUpdateResponse>(
        '/api/resource/update',
        payload
      );
      return response.data;
    },
    ...options,
  });
};
