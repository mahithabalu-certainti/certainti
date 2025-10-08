import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { resourceServiceApi } from '../../../../api/api';
import {
  casesResponseDetails,
  createCasesApiResponse,
} from '../../../types/cases-details';

export const useCreateCases = (
  options?: UseMutationOptions<
    Partial<createCasesApiResponse>,
    Error,
    Partial<casesResponseDetails>
  >
): UseMutationResult<
  Partial<createCasesApiResponse>,
  Error,
  Partial<casesResponseDetails>
> => {
  return useMutation({
    mutationKey: ['create-cases'],
    mutationFn: async (payload) => {
      const res = await resourceServiceApi.post(
        '/api/create_cases/new',
        payload
      );
      return res.data;
    },
    ...options,
  });
};

export const useUpdateCases = (
  options?: UseMutationOptions<
    Partial<createCasesApiResponse>,
    Error,
    Partial<casesResponseDetails>
  >
): UseMutationResult<
  Partial<createCasesApiResponse>,
  Error,
  Partial<casesResponseDetails>
> => {
  return useMutation({
    mutationKey: ['update-cases'],
    mutationFn: async (payload) => {
      const res = await resourceServiceApi.put(
        '/api/update_cases/update',
        payload
      );
      return res.data;
    },
    ...options,
  });
};
