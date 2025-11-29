import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';
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
  assigned_to_name?: string;
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
  case_rid?: string;
  account_rid: string;
  task_rid: string;
  page: number;
  limit: number;
  task_type?: string;
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
  case_rid?: string;
  account_rid: string;
  task_rid: string;
  page: number;
  limit: number;
  task_type?: string;
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

// Task Attachments Upload Types
export interface UploadTaskAttachmentsPayload {
  account_rid: string;
  case_rid: string;
  task_rid: string;
  files: File[];
}

export interface UploadTaskAttachmentsResponse extends CommonApiResponse {
  data?: {
    rid?: string;
    [key: string]: unknown;
  };
}

// Task Attachments Delete Types
export interface DeleteTaskAttachmentPayload {
  account_rid: string;
  case_rid: string;
  task_rid: string;
  rid: string;
}

export interface DeleteTaskAttachmentResponse extends CommonApiResponse {
  data?: {
    rid?: string;
    [key: string]: unknown;
  };
}

// Create Task Types
export interface CreateTaskPayload {
  case_rid?: string;
  account_rid: string;
  task_name: string;
  case_team_member_role_rid?: string;
  checklist_template_rid?: string;
  status_rid?: string;
  priority_rid?: string;
  milestone_template_rid?: string;
  task_type_rid?: string;
  task_description?: string;
  effective_start_datetime?: string;
  effective_end_datetime?: string;
  tag_rid?: string | string[];
  tags?: Array<{ tag_rid: string; is_new_tag: boolean }>;
  is_new_tag?: boolean;
  workflow_connector?: Record<string, unknown>;
  assigned_to?: string;
  [key: string]: unknown;
}

export interface CreateTaskResponse extends CommonApiResponse {
  data?: {
    rid?: string;
    task_name?: string;
    [key: string]: unknown;
  };
}

// Comment Management Types
export interface AddCommentPayload {
  account_rid: string;
  case_rid?: string;
  task_rid: string;
  comments: string;
  files?: File[];
  task_type?: string;
}

export interface UpdateCommentPayload {
  account_rid: string;
  case_rid?: string;
  task_rid: string;
  rid: string; // Comment ID
  comments: string;
  files?: File[];
  deleted_file_ids?: string[];
  task_type?: string;
}

export interface DeleteCommentPayload {
  account_rid: string;
  case_rid?: string;
  task_rid: string;
  rid: string; // Comment ID
  deleted_file_ids?: string[];
  task_type?: string;
}

export interface CommentResponse extends CommonApiResponse {
  data?: {
    rid?: string;
    comment_rid?: string;
    [key: string]: unknown;
  };
}

// Case Task URL
export const getCaseTaskListUrl = () => '/api/cases/task/list';
export const getCaseTaskCreateUrl = () => '/api/cases/task/create';
export const getCaseTaskUpdateUrl = () => '/api/cases/task/update';
export const getCaseTaskExportUrl = () => '/api/cases/task/export';
export const getTaskCommentsListUrl = () => '/api/cases/task/comments/list';
export const getTaskAttachmentsListUrl = () =>
  '/api/cases/task/attachments/list';
export const getUploadTaskAttachmentsUrl = () =>
  '/api/cases/task/attachments/add';
export const getDeleteTaskAttachmentUrl = () =>
  '/api/cases/task/attachments/delete';
export const getTaskDropDownListUrl = () => '/api/cases/task/dropDownList';

// Comment URL
export const getAddCommentUrl = () => '/api/cases/task/comments/add';
export const getUpdateCommentUrl = () => '/api/cases/task/comments/update';
export const getDeleteCommentUrl = () => '/api/cases/task/comments/delete';

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

// Add Task Comment
export const addTaskComment = async (
  payload: AddCommentPayload
): Promise<CommentResponse> => {
  try {
    const formData = new FormData();
    formData.append('account_rid', payload.account_rid);
    if (payload.case_rid) {
      formData.append('case_rid', payload.case_rid);
    }
    if (payload.task_type) {
      formData.append('task_type', payload.task_type);
    }
    formData.append('task_rid', payload.task_rid);
    formData.append('comments', payload.comments);

    // Add files if present
    if (payload.files && payload.files.length > 0) {
      payload.files.forEach((file) => {
        formData.append('files', file);
      });
    }

    const { data } = await caseServiceApi.post<CommentResponse>(
      getAddCommentUrl(),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  } catch (error) {
    console.error('Error adding task comment:', error);
    throw error;
  }
};

// Update Task Comment
export const updateTaskComment = async (
  payload: UpdateCommentPayload
): Promise<CommentResponse> => {
  try {
    const formData = new FormData();
    formData.append('account_rid', payload.account_rid);
    if (payload.case_rid) {
      formData.append('case_rid', payload.case_rid);
    }
    if (payload.task_type) {
      formData.append('task_type', payload.task_type);
    }
    formData.append('task_rid', payload.task_rid);
    formData.append('rid', payload.rid);
    formData.append('comments', payload.comments);
    formData.append(
      'deleted_file_ids',
      JSON.stringify(payload.deleted_file_ids || [])
    );

    // Add files if present
    if (payload.files && payload.files.length > 0) {
      payload.files.forEach((file) => {
        formData.append('files', file);
      });
    }

    const { data } = await caseServiceApi.put<CommentResponse>(
      getUpdateCommentUrl(),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  } catch (error) {
    console.error('Error updating task comment:', error);
    throw error;
  }
};

// Delete Task Comment
export const deleteTaskComment = async (
  payload: DeleteCommentPayload
): Promise<CommentResponse> => {
  try {
    const { data } = await caseServiceApi.post<CommentResponse>(
      getDeleteCommentUrl(),
      payload
    );
    return data;
  } catch (error) {
    console.error('Error deleting task comment:', error);
    throw error;
  }
};

// Delete Task Attachment
export const deleteTaskAttachment = async (
  payload: DeleteTaskAttachmentPayload
): Promise<DeleteTaskAttachmentResponse> => {
  try {
    const { data } = await caseServiceApi.post<DeleteTaskAttachmentResponse>(
      getDeleteTaskAttachmentUrl(),
      payload
    );
    return data;
  } catch (error) {
    console.error('Error deleting task attachment:', error);
    throw error;
  }
};

// Upload Task Attachments
export const uploadTaskAttachments = async (
  payload: UploadTaskAttachmentsPayload
): Promise<UploadTaskAttachmentsResponse> => {
  try {
    const formData = new FormData();
    formData.append('account_rid', payload.account_rid);
    formData.append('case_rid', payload.case_rid);
    formData.append('task_rid', payload.task_rid);

    // Add all files to the payload
    payload.files.forEach((file) => {
      formData.append('files', file);
    });

    const { data } = await caseServiceApi.post<UploadTaskAttachmentsResponse>(
      getUploadTaskAttachmentsUrl(),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  } catch (error) {
    console.error('Error uploading task attachments:', error);
    throw error;
  }
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

// Update Case Task
export const updateCaseTask = async (
  payload: CreateTaskPayload & { rid?: string }
): Promise<CreateTaskResponse> => {
  try {
    const { data } = await caseServiceApi.put<CreateTaskResponse>(
      getCaseTaskUpdateUrl(),
      payload
    );
    return data;
  } catch (error) {
    console.error('Error updating case task:', error);
    throw error;
  }
};

// Case Tasks
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

// Task Comments
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
      params.account_rid &&
      params.task_rid &&
      options?.enabled !== false
    ),
    ...options,
  });
};

// Infinite Scrolling Task Comments (Limit: 5 per page)
export interface InfiniteTaskCommentsParams {
  case_rid?: string;
  account_rid: string;
  task_rid: string;
  task_type?: string;
}

export const useInfiniteTaskCommentsList = (
  params: InfiniteTaskCommentsParams,
  options?: {
    enabled?: boolean;
  }
) => {
  return useInfiniteQuery<TaskCommentsApiResponse, Error>({
    queryKey: ['taskCommentsInfinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetchTaskCommentsList({
        ...params,
        page: pageParam as number,
        limit: 5, // Load 5 comments per page
      });
      return response;
    },
    getNextPageParam: (
      lastPage: TaskCommentsApiResponse,
      allPages: TaskCommentsApiResponse[]
    ) => {
      // If the last page has no data, there are no more pages.
      if (!lastPage.data.data || lastPage.data.data.length === 0) {
        return undefined;
      }

      // If the number of records in the last page is less than the limit,
      // it means we've reached the end.
      if (lastPage.data.data.length < 5) {
        return undefined;
      }

      // Otherwise, return the next page number
      return allPages.length + 1;
    },
    initialPageParam: 1,
    staleTime: 0,
    gcTime: 0,
    retry: 0,
    enabled: !!(
      params.account_rid &&
      params.task_rid &&
      options?.enabled !== false
    ),
  });
};

// Task Attachments
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
      params.account_rid &&
      params.task_rid &&
      options?.enabled !== false
    ),
    ...options,
  });
};

// Adding Comments
export const useAddTaskComment = () => {
  return useMutation<CommentResponse, Error, AddCommentPayload>({
    mutationFn: (payload) => addTaskComment(payload),
  });
};

// Updating Comments
export const useUpdateTaskComment = () => {
  return useMutation<CommentResponse, Error, UpdateCommentPayload>({
    mutationFn: (payload) => updateTaskComment(payload),
  });
};

//  Deleting Comments
export const useDeleteTaskComment = () => {
  return useMutation<CommentResponse, Error, DeleteCommentPayload>({
    mutationFn: (payload) => deleteTaskComment(payload),
  });
};

// Deleting Task Attachments
export const useDeleteTaskAttachment = () => {
  return useMutation<
    DeleteTaskAttachmentResponse,
    Error,
    DeleteTaskAttachmentPayload
  >({
    mutationFn: (payload) => deleteTaskAttachment(payload),
  });
};

// Uploading Task Attachments
export const useUploadTaskAttachments = () => {
  return useMutation<
    UploadTaskAttachmentsResponse,
    Error,
    UploadTaskAttachmentsPayload
  >({
    mutationFn: (payload) => uploadTaskAttachments(payload),
  });
};

// Creating Case Task
export const useCreateCaseTask = () => {
  return useMutation<CreateTaskResponse, Error, CreateTaskPayload>({
    mutationFn: (payload) => createCaseTask(payload),
  });
};

// Updating Case Task
export const useUpdateCaseTask = () => {
  return useMutation<
    CreateTaskResponse,
    Error,
    CreateTaskPayload & { rid?: string }
  >({
    mutationFn: (payload) => updateCaseTask(payload),
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

// Task Drop Down List Types
export interface TaskDropDownListParams {
  case_rid: string;
  account_rid: string;
  search?: string;
}

export interface TaskDropDownListResponse {
  data: Array<{
    rid: string;
    task_name: string;
  }>;
  status: string;
  message: string;
}

// Fetch Task Drop Down List
export const fetchTaskDropDownList = async (
  params: TaskDropDownListParams
): Promise<TaskDropDownListResponse> => {
  const { data } = await caseServiceApi.post<TaskDropDownListResponse>(
    getTaskDropDownListUrl(),
    params
  );
  return data;
};

// Hook for Task Drop Down List
export const useGetTaskDropDownList = (
  params: TaskDropDownListParams,
  options?: {
    enabled?: boolean;
  }
) => {
  return useQuery<TaskDropDownListResponse, Error>({
    queryKey: ['taskDropDownList', params],
    queryFn: () => fetchTaskDropDownList(params),
    staleTime: 0,
    gcTime: 0,
    retry: 0,
    enabled: !!(
      params.case_rid &&
      params.account_rid &&
      options?.enabled !== false
    ),
    ...options,
  });
};
