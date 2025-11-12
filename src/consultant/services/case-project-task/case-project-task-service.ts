import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { caseServiceApi } from '../../../api/api';
import {
  CaseProjectTaskListResponse,
  CaseProjectTaskListURLParams,
} from '../../types/case-project-task';
import { CaseProjectTasksURL } from './case-project-task-url';

export const fetchCaseProjectTaskList = async (
  params: CaseProjectTaskListURLParams
): Promise<CaseProjectTaskListResponse> => {
  const response = await caseServiceApi.get<CaseProjectTaskListResponse>(
    CaseProjectTasksURL(params)
  );
  return response.data;
};

export const useCaseProjectTaskList = (
  params: CaseProjectTaskListURLParams,
  refreshAttachments?: number
): UseQueryResult<CaseProjectTaskListResponse, Error> => {
  return useQuery<CaseProjectTaskListResponse, Error>({
    queryKey: ['caseProjectTaskList', params, refreshAttachments],
    queryFn: () => fetchCaseProjectTaskList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.case_rid && !!params.accountRid,
  });
};
