import { useQuery } from '@tanstack/react-query';
import { interactionServiceApi } from '../../../api/api';

// Case Task Types
export interface CaseTaskListParams {
  page: number;
  limit: number;
  search?: string;
  account_rid?: string;
  case_rid: string;
}

export interface CaseTaskType {
  rid: string;
  task_name: string;
  description?: string;
  status?: string;
  assigned_to?: string;
  start_date?: string;
  due_date?: string;
  created_date?: string;
  priority?: string;
  progress?: number;
  [key: string]: unknown;
}

export interface CaseTaskApiResponse {
  data: {
    data: CaseTaskType[];
    totalRecords: number;
    currentPage: number;
    totalPages: number;
  };
  status: string;
  message: string;
}

// Case Task URL
export const getCaseTaskListUrl = () => '/case-tasks/list';

// Fetch Case Task List
export const fetchCaseTaskList = async (
  params: CaseTaskListParams
): Promise<CaseTaskApiResponse> => {
  const { data } = await interactionServiceApi.post<CaseTaskApiResponse>(
    getCaseTaskListUrl(),
    params
  );
  return data;
};

// Custom Hook for Case Tasks
export const useGetCaseTaskList = (
  params: CaseTaskListParams,
  refreshTrigger?: number
) => {
  return useQuery<CaseTaskApiResponse, Error>({
    queryKey: ['caseTask', params, refreshTrigger],
    queryFn: () => fetchCaseTaskList(params),
    staleTime: 0, // No cache
    gcTime: 0, // Immediately remove from cache
    retry: 0,
    enabled: !!params.case_rid,
  });
};
