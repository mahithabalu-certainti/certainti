import { useQuery } from '@tanstack/react-query';
import { mockResourceDetails } from '../../mockdata/resource-details';
import { mockResourceDetailsApiResponse } from '../../types';

export const fetchResourceDetail = async (
  resourceId: string
): Promise<mockResourceDetailsApiResponse> => {
  console.log('resourceId-fetchResourceDetail', resourceId);
  // const response = await accountServiceApi.get<any>(
  //   AccountDetailUrl(resourceId)
  // );
  console.log('mockResourceDetails', mockResourceDetails);
  return mockResourceDetails;
};

export const useResourceDetail = (resourceId: string) => {
  return useQuery<mockResourceDetailsApiResponse, Error>({
    queryKey: ['resourceDetail', resourceId], // Unique query key
    queryFn: () => fetchResourceDetail(resourceId),
  });
};
