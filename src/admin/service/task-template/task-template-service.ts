import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import { interactionServiceApi } from '../../../api/api';
import {
  TaskTemplateDetails,
  TaskTemplateFormPayload,
  TaskTemplateList,
  TaskTemplateListParams,
  ExportTaskTemplateResponse,
  TaskTemplateTypeResponse,
} from '../../types';
import { CommonApiResponse } from '../../../common-service';
import {
  TaskTemplateDetailsMockData,
  TaskTemplateMockData,
  TaskTemplateTypeMockData,
} from '../../mockdata/task-templates';

export const getTaskTemplateListUrl = () => '/api/taskTemplates/list';

export const fetchTaskTemplateList = async (
  params: TaskTemplateListParams
): Promise<{ taskTemplates: TaskTemplateList[]; count: number }> => {
  // const { data } = await interactionServiceApi.post<TaskTemplateListResponse>(
  //   getTaskTemplateListUrl(),
  //   params
  // );
  // return {
  //   taskTemplates: data.data.taskTemplates,
  //   count: data.data.totalCount,
  // };
  console.log('task-template-list-params', params);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return {
    taskTemplates: TaskTemplateMockData.data.taskTemplates,
    count: TaskTemplateMockData.data.totalCount,
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
  return `/api/taskTemplates/detail/${templateId}`;
};

export const fetchTaskTemplateDetails = async (
  templateId: string
): Promise<TaskTemplateDetails> => {
  // const response =
  //   await interactionServiceApi.get<TaskTemplateDetailsResponse>(
  //     getTaskTemplateDetailsURL(templateId)
  //   );
  // return response.data.data.templateDetails;
  console.log('task-template-details-params', templateId);
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return TaskTemplateDetailsMockData.data.templateDetails;
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
  return `/api/taskTemplates/new`;
};

export const createTaskTemplate = async (
  body: Partial<TaskTemplateFormPayload>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await interactionServiceApi.post<CommonApiResponse>(
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
  return `/api/taskTemplates/update`;
};

export const updateTaskTemplateDetails = async (
  body: Partial<TaskTemplateFormPayload>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await interactionServiceApi.post<CommonApiResponse>(
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
export const getTaskTemplateExportUrl = () => '/api/taskTemplates/export';

export const ExportTaskTemplateList = async (
  params: TaskTemplateListParams
): Promise<void> => {
  try {
    const filename = `task_templates.xlsx`;
    const response =
      await interactionServiceApi.post<ExportTaskTemplateResponse>(
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
export const getTaskTemplateTypeUrl = (): string => '/api/taskTemplates/type';

export const fetchTaskTemplateTypes =
  async (): Promise<TaskTemplateTypeResponse> => {
    try {
      //   const { data } =
      //     await interactionServiceApi.get<TaskTemplateTypeResponse>(
      //       getTaskTemplateTypeUrl()
      //     );
      //   return data;
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return TaskTemplateTypeMockData;
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
