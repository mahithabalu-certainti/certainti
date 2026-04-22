import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { userServiceApi } from './api';

type ApiResponse<T> = {
  data: T;
  // Add other fields your API might return, like:
  // message: string;
  // status: number;
};

export const useApi = <T>(
  endpoint: string,
  params?: Record<string, unknown>,
  options?: UseQueryOptions<ApiResponse<T>, Error, T>
): UseQueryResult<T, Error> => {
  return useQuery<ApiResponse<T>, Error, T>({
    queryKey: [endpoint, params],
    queryFn: async () => {
      const response = await userServiceApi.get<ApiResponse<T>>(endpoint, {
        params,
      });
      return response.data;
    },
    select: (data) => data.data,
    ...options,
  });
};
