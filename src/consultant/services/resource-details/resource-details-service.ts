import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/api';
import { ResourceDetailsApiResponse } from '../../types';
import { ResourceDetailURL } from '../urls';

export const fetchResourceDetail = async (
  resourceId: string,
  accountNumber: string
): Promise<ResourceDetailsApiResponse> => {
  const response = await api.get<ResourceDetailsApiResponse>(
    ResourceDetailURL(resourceId, accountNumber)
  );
  return response.data;
};

export const useResourceDetail = (
  resourceId: string,
  accountNumber: string
) => {
  return useQuery<ResourceDetailsApiResponse, Error>({
    queryKey: ['resourceDetail', resourceId, accountNumber],
    queryFn: () => fetchResourceDetail(resourceId, accountNumber),
    retry: 0,
    gcTime: 0,
    enabled: !!resourceId && !!accountNumber,
  });
};
