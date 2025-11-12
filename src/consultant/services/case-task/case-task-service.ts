import { useQuery } from '@tanstack/react-query';
import { caseServiceApi } from '../../../api/api';
import { CaseExportResponse } from '../../types';

// Case Task Types
export interface CaseTaskListParams {
  case_rid: string;
  account_rid: string;
  page: number;
  limit: number;
  search?: string;
  sort?: string;
  sort_by?: 'ASC' | 'DESC';
  filter?: {
    assigned_to?: {
      equals?: string;
    };
    [key: string]: unknown;
  };
}

export interface CaseTaskType {
  rid: string;
  task_name: string;
  description?: string;
  task_status_name?: string;
  assigned_to?: string;
  effective_start_datetime?: string;
  effective_end_datetime?: string;
  created_date?: string;
  priority?: string;
  progress?: number;
  [key: string]: unknown;
  total_result: string;
}

export interface CaseTaskApiResponse {
  data: {
    total_result: number;
    data: CaseTaskType[];
    totalRecords: number;
    currentPage: number;
    totalPages: number;
  };
  status: string;
  message: string;
}

// Case Task URL
export const getCaseTaskListUrl = () => '/api/cases/task/list';
export const getCaseTaskExportUrl = () => '/api/cases/task/export';
// Fetch Case Task List
export const fetchCaseTaskList = async (
  params: CaseTaskListParams
): Promise<CaseTaskApiResponse> => {
  const { data } = await caseServiceApi.post<CaseTaskApiResponse>(
    getCaseTaskListUrl(),
    params
  );
  return data;
};

// Custom Hook for Case Tasks
export const useGetCaseTaskList = (
  params: CaseTaskListParams,
  refreshTrigger?: number,
  options?: {
    onSuccess?: (data: CaseTaskApiResponse) => void;
    onError?: (error: Error) => void;
  }
) => {
  return useQuery<CaseTaskApiResponse, Error>({
    queryKey: ['caseTask', params, refreshTrigger],
    queryFn: () => fetchCaseTaskList(params),
    staleTime: 0, // No cache
    gcTime: 0, // Immediately remove from cache
    retry: 0,
    enabled: !!(params.case_rid && params.account_rid),
    ...options,
  });
};

export const ExportCaseTaskList = async (
  params: CaseTaskListParams
): Promise<void> => {
  try {
    const filename = `case-tasks.xlsx`;
    const response = await caseServiceApi.post<CaseExportResponse>(
      getCaseTaskExportUrl(),
      params
    );
    console.log('response', response);
    const base64Data = response.data?.data;

    if (!base64Data) {
      console.error('No base64 data found in the response.');
      return;
    }
    if (typeof base64Data !== 'string' || !base64Data) {
      console.error('No base64 data found in the response.');
      return;
    }
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Export failed:', error);
  }
};
