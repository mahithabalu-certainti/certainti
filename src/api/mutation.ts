import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { accountServiceApi } from './api';

export const useApiMutation = <T, V = void>(
  endpoint: string,
  method: 'post' | 'put' | 'patch' | 'delete' = 'post',
  options?: UseMutationOptions<T, Error, V>
): UseMutationResult<T, Error, V> => {
  return useMutation<T, Error, V>({
    mutationFn: async (data) => {
      const response = await accountServiceApi[method]<T>(endpoint, data);
      return response.data;
    },
    ...options,
  });
};
