/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import { caseServiceApi } from '../../../api/api';
import {
  TaskTemplateDetails,
  TaskTemplateFormPayload,
  TaskTemplateList,
  TaskTemplateListParams,
  ExportTaskTemplateResponse,
  TaskTemplateTypeResponse,
  TaskTemplateListResponse,
  TaskAssigneRoleTypeResponse,
  TaskMilestoneTypeResponse,
  TaskPriorityTypeResponse,
  TaskCheckListTypeResponse,
  TaskTemplateDetailsResponse,
  TaskLinkTypeResponse,
  TaskTemplateResponse,
} from '../../types';
import { CommonApiResponse } from '../../../common-service';

export const getTaskTemplateListUrl = () =>
  '/api/caseManagement/taskTemplate/list';

export const fetchTaskTemplateList = async (
  params: TaskTemplateListParams
): Promise<{ taskTemplates: TaskTemplateList[]; count: number }> => {
  const { data } = await caseServiceApi.post<TaskTemplateListResponse>(
    getTaskTemplateListUrl(),
    params
  );
  return {
    taskTemplates: data.data.task_templates,
    count: data.data.total_result,
  };
};

export const useTaskTemplateList = (
  params: TaskTemplateListParams,
  refresh?: number
): UseQueryResult<
  { taskTemplates: TaskTemplateList[]; count: number },
  Error
> => {
  return useQuery<{ taskTemplates: TaskTemplateList[]; count: number }, Error>({
    queryKey: ['task-template-list', params, refresh],
    queryFn: () => fetchTaskTemplateList(params),
    retry: 0,
    gcTime: 0,
  });
};

// Details
export const getTaskTemplateDetailsURL = (templateId: string) => {
  return `/api/caseManagement/taskTemplate/${templateId}`;
};

export const fetchTaskTemplateDetails = async (
  templateId: string
): Promise<TaskTemplateDetails> => {
  const response = await caseServiceApi.get<TaskTemplateDetailsResponse>(
    getTaskTemplateDetailsURL(templateId)
  );
  return response.data.data;
};

export const useTaskTemplateDetails = (
  templateId: string
): UseQueryResult<TaskTemplateDetails | undefined, Error> => {
  return useQuery<TaskTemplateDetails | undefined, Error>({
    queryKey: ['task-template-details', templateId],
    queryFn: () => fetchTaskTemplateDetails(templateId),
    retry: 0,
    gcTime: 0,
    enabled: !!templateId,
  });
};

// Create & Edit
export const getCreateTaskTemplateUrl = (): string => {
  return `/api/caseManagement/taskTemplate/create`;
};

export const createTaskTemplate = async (
  body: Partial<TaskTemplateFormPayload>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await caseServiceApi.post<CommonApiResponse>(
      getCreateTaskTemplateUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error creating task template:', error);
    throw error;
  }
};

export const useCreateTaskTemplate = () => {
  return useMutation<
    CommonApiResponse,
    Error,
    Partial<TaskTemplateFormPayload>
  >({
    mutationFn: (body) => createTaskTemplate({ ...body }),
  });
};

export const getUpdateTaskTemplateUrl = (): string => {
  return `api/caseManagement/taskTemplate/update`;
};

export const updateTaskTemplateDetails = async (
  body: Partial<TaskTemplateFormPayload>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await caseServiceApi.put<CommonApiResponse>(
      getUpdateTaskTemplateUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error updating task template details:', error);
    throw error;
  }
};

export const useUpdateTaskTemplateDetails = () => {
  return useMutation<
    CommonApiResponse,
    Error,
    Partial<TaskTemplateFormPayload>
  >({
    mutationFn: (body) => updateTaskTemplateDetails({ ...body }),
  });
};

// Export
export const getTaskTemplateExportUrl = () =>
  '/api/caseManagement/taskTemplate/export';

export const ExportTaskTemplateList = async (
  params: TaskTemplateListParams
): Promise<void> => {
  try {
    const filename = `task_templates.xlsx`;
    const response = await caseServiceApi.post<ExportTaskTemplateResponse>(
      getTaskTemplateExportUrl(),
      params
    );
    const base64Data = response.data?.data;

    if (!base64Data) {
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
// Task template type
export const getTaskTemplateTypeUrl = (): string =>
  '/api/caseManagement/taskTemplate/taskType';

export const fetchTaskTemplateTypes =
  async (): Promise<TaskTemplateTypeResponse> => {
    try {
      const { data } = await caseServiceApi.get<TaskTemplateTypeResponse>(
        getTaskTemplateTypeUrl()
      );
      return data;
    } catch (error) {
      console.error('Error fetching task template types:', error);
      throw error;
    }
  };

export const useGetTaskTemplateTypes = () => {
  return useQuery<TaskTemplateTypeResponse, Error>({
    queryKey: ['task-template-types'],
    queryFn: fetchTaskTemplateTypes,
    retry: 0,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

// Task milestone type
export const getTaskMilestoneTypeUrl = (): string =>
  '/api/caseManagement/caseMilestones';

export const fetchTaskMilestoneTypes =
  async (): Promise<TaskMilestoneTypeResponse> => {
    try {
      const { data } = await caseServiceApi.get<TaskMilestoneTypeResponse>(
        getTaskMilestoneTypeUrl()
      );
      return data;
    } catch (error) {
      console.error('Error fetching task template types:', error);
      throw error;
    }
  };

export const useGetTaskMilestoneTypes = () => {
  return useQuery<TaskMilestoneTypeResponse, Error>({
    queryKey: ['task-milestone-types'],
    queryFn: fetchTaskMilestoneTypes,
    retry: 0,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};
// Task priority type
export const getTaskPriorityTypeUrl = (): string =>
  '/api/caseManagement/priority';

export const fetchTaskPriorityTypes =
  async (): Promise<TaskPriorityTypeResponse> => {
    try {
      const { data } = await caseServiceApi.get<TaskPriorityTypeResponse>(
        getTaskPriorityTypeUrl()
      );
      return data;
    } catch (error) {
      console.error('Error fetching task template types:', error);
      throw error;
    }
  };

export const useGetTaskPriorityTypes = () => {
  return useQuery<TaskPriorityTypeResponse, Error>({
    queryKey: ['task-priority-types'],
    queryFn: fetchTaskPriorityTypes,
    retry: 0,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};
// Task checklist type
export const getTaskChecklistTypeUrl = (): string =>
  '/api/caseManagement/checklist';

export const fetchTaskCheckListTypes =
  async (): Promise<TaskCheckListTypeResponse> => {
    try {
      const { data } = await caseServiceApi.get<TaskCheckListTypeResponse>(
        getTaskChecklistTypeUrl()
      );
      return data;
    } catch (error) {
      console.error('Error fetching task template types:', error);
      throw error;
    }
  };

export const useGetTaskCheckListTypes = () => {
  return useQuery<TaskCheckListTypeResponse, Error>({
    queryKey: ['task-checklist-types'],
    queryFn: fetchTaskCheckListTypes,
    retry: 0,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};
// Task assign role type
export const getTaskAssignRoleTypeUrl = (): string =>
  '/api/cases/caseTeamRoles';

export const fetchTaskAssignRoleTypes =
  async (): Promise<TaskAssigneRoleTypeResponse> => {
    try {
      const { data } = await caseServiceApi.get<TaskAssigneRoleTypeResponse>(
        getTaskAssignRoleTypeUrl()
      );
      return data;
    } catch (error) {
      console.error('Error fetching task template types:', error);
      throw error;
    }
  };

export const useGetTaskAssignRoleTypes = () => {
  return useQuery<TaskAssigneRoleTypeResponse, Error>({
    queryKey: ['task-assignerole-types'],
    queryFn: fetchTaskAssignRoleTypes,
    retry: 0,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

export const getTaskConnectorTypeUrl = (): string =>
  '/api/caseManagement/workflowConnector/list';

export const fetchTaskConnectorTypes =
  async (): Promise<TaskLinkTypeResponse> => {
    try {
      const { data } = await caseServiceApi.get<TaskLinkTypeResponse>(
        getTaskConnectorTypeUrl()
      );
      // console.log(data, 'taskConecterTypes');
      return data;
    } catch (error) {
      console.error('Error fetching task template types:', error);
      throw error;
    }
  };
export const useGetTaskConnectorTypes = () => {
  return useQuery<TaskLinkTypeResponse, Error>({
    queryKey: ['task-workflowConnector-types'],
    queryFn: fetchTaskConnectorTypes,
    retry: 0,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};
export const getTaskTemplateUrl = (): string =>
  '/api/caseManagement/taskTemplate/dropdown';

export const fetchTaskTemplate = async (
  payload: Record<string, any>
): Promise<TaskTemplateResponse> => {
  try {
    const { data } = await caseServiceApi.post<TaskTemplateResponse>(
      getTaskTemplateUrl(),
      payload
    );
    return data;
  } catch (error) {
    console.error('Error fetching task template types:', error);
    throw error;
  }
};
export const useGetTaskTemplate = (payload: Record<string, any>) => {
  return useQuery<TaskTemplateResponse, Error>({
    queryKey: ['task-template', payload],
    queryFn: () => fetchTaskTemplate(payload),
    retry: 0,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};
