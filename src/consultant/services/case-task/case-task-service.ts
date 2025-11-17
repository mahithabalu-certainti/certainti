import { useQuery, useMutation } from '@tanstack/react-query';
import { caseServiceApi } from '../../../api/api';
import { CaseExportResponse } from '../../types';
import { CommonApiResponse } from '../../../common-service';

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

// Task Comments Types
export interface TaskCommentsListParams {
  case_rid: string;
  account_rid: string;
  task_rid: string;
  page: number;
  limit: number;
}

export interface TaskComment {
  id?: string;
  comment_rid?: string;
  user: string;
  user_name?: string;
  text: string;
  comment_text?: string;
  date: string;
  created_date?: string;
  initials?: string;
  color?: string;
  attachments?: string[];
  user_avatar_color?: string;
  [key: string]: unknown;
}

export interface TaskCommentsApiResponse {
  data: {
    total_result: number;
    data: TaskComment[];
    totalRecords?: number;
    currentPage?: number;
    totalPages?: number;
  };
  status: string;
  message: string;
}

// Task Attachments Types
export interface TaskAttachmentsListParams {
  case_rid: string;
  account_rid: string;
  task_rid: string;
  page: number;
  limit: number;
}

export interface TaskAttachment {
  id?: string;
  attachment_rid?: string;
  file_name: string;
  file_path?: string;
  file_size?: number;
  file_type?: string;
  uploaded_by?: string;
  uploaded_by_name?: string;
  uploaded_date?: string;
  created_date?: string;
  [key: string]: unknown;
}

export interface TaskAttachmentsApiResponse {
  data: {
    total_result: number;
    data: TaskAttachment[];
    totalRecords?: number;
    currentPage?: number;
    totalPages?: number;
  };
  status: string;
  message: string;
}

// Create Task Types
export interface CreateTaskPayload {
  case_rid: string;
  account_rid: string;
  task_name: string;
  effort_in_days: string;
  reminder_interval?: number;
  case_team_member_role_rid?: string;
  checklist_template_rid?: string;
  status_rid?: string;
  priority_rid?: string;
  milestone_template_rid?: string;
  task_type_rid?: string;
  task_description?: string;
  effective_start_datetime?: string;
  effective_end_datetime?: string;
  [key: string]: unknown;
}

export interface CreateTaskResponse extends CommonApiResponse {
  data?: {
    rid?: string;
    task_name?: string;
    [key: string]: unknown;
  };
}

// Case Task URL
export const getCaseTaskListUrl = () => '/api/cases/task/list';
export const getCaseTaskCreateUrl = () => '/api/cases/task/create';
export const getCaseTaskExportUrl = () => '/api/cases/task/export';
export const getTaskCommentsListUrl = () => '/api/cases/task/comments/list';
export const getTaskAttachmentsListUrl = () =>
  '/api/cases/task/attachments/list';

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

// Fetch Task Comments List
export const fetchTaskCommentsList = async (
  params: TaskCommentsListParams
): Promise<TaskCommentsApiResponse> => {
  const { data } = await caseServiceApi.post<TaskCommentsApiResponse>(
    getTaskCommentsListUrl(),
    params
  );
  return data;
};

// Fetch Task Attachments List
export const fetchTaskAttachmentsList = async (
  params: TaskAttachmentsListParams
): Promise<TaskAttachmentsApiResponse> => {
  const { data } = await caseServiceApi.post<TaskAttachmentsApiResponse>(
    getTaskAttachmentsListUrl(),
    params
  );
  return data;
};

// Create Case Task
export const createCaseTask = async (
  payload: CreateTaskPayload
): Promise<CreateTaskResponse> => {
  try {
    const { data } = await caseServiceApi.post<CreateTaskResponse>(
      getCaseTaskCreateUrl(),
      payload
    );
    return data;
  } catch (error) {
    console.error('Error creating case task:', error);
    throw error;
  }
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

// Custom Hook for Task Comments
export const useGetTaskCommentsList = (
  params: TaskCommentsListParams,
  options?: {
    onSuccess?: (data: TaskCommentsApiResponse) => void;
    onError?: (error: Error) => void;
    enabled?: boolean;
  }
) => {
  return useQuery<TaskCommentsApiResponse, Error>({
    queryKey: ['taskComments', params],
    queryFn: () => fetchTaskCommentsList(params),
    staleTime: 0,
    gcTime: 0,
    retry: 0,
    enabled: !!(
      params.case_rid &&
      params.account_rid &&
      params.task_rid &&
      options?.enabled !== false
    ),
    ...options,
  });
};

// Custom Hook for Task Attachments
export const useGetTaskAttachmentsList = (
  params: TaskAttachmentsListParams,
  options?: {
    onSuccess?: (data: TaskAttachmentsApiResponse) => void;
    onError?: (error: Error) => void;
    enabled?: boolean;
  }
) => {
  return useQuery<TaskAttachmentsApiResponse, Error>({
    queryKey: ['taskAttachments', params],
    queryFn: () => fetchTaskAttachmentsList(params),
    staleTime: 0,
    gcTime: 0,
    retry: 0,
    enabled: !!(
      params.case_rid &&
      params.account_rid &&
      params.task_rid &&
      options?.enabled !== false
    ),
    ...options,
  });
};

// Custom Hook for Creating Case Task
export const useCreateCaseTask = () => {
  return useMutation<CreateTaskResponse, Error, CreateTaskPayload>({
    mutationFn: (payload) => createCaseTask(payload),
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
