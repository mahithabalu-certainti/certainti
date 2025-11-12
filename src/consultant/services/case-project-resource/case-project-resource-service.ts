import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { caseServiceApi } from '../../../api/api';
import {
  CaseProjectResourceListResponse,
  CaseProjectResourceListURLParams,
} from '../../types/case-project-resource';
import { CaseProjectResourcesURL } from './case-project-resource-url';

export const fetchCaseProjectResourceList = async (
  params: CaseProjectResourceListURLParams
): Promise<CaseProjectResourceListResponse> => {
  const response = await caseServiceApi.get<CaseProjectResourceListResponse>(
    CaseProjectResourcesURL(params)
  );
  return response.data;
};

export const useCaseProjectResourceList = (
  params: CaseProjectResourceListURLParams,
  refreshAttachments?: number
): UseQueryResult<CaseProjectResourceListResponse, Error> => {
  return useQuery<CaseProjectResourceListResponse, Error>({
    queryKey: ['caseProjectResourceList', params, refreshAttachments],
    queryFn: () => fetchCaseProjectResourceList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.case_rid && !!params.accountRid,
  });
};
