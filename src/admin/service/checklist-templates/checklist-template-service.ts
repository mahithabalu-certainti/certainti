import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import { caseServiceApi, interactionServiceApi } from '../../../api/api';
import {
  ChecklistLevelApiResponse,
  ChecklistStatusApiResponse,
  ChecklistTemplateDetails,
  ChecklistTemplateFormPayload,
  ChecklistTemplateList,
  ChecklistTemplateListParams,
  ChecklistTemplateListResponse,
  ChecklistTypeApiResponse,
  ExportChecklistTemplateResponse,
  CreateTemplatePayload,
  CreateTemplateResponse,
} from '../../types';
import {
  ChecklistLevelsMockData,
  ChecklistStatusMockData,
  ChecklistTypesMockData,
} from '../../mockdata/checklist-templates';
import { CommonApiResponse } from '../../../common-service';

// List
export const getChecklistTemplateListUrl = (
  params: ChecklistTemplateListParams
) => {
  const queryParams = new URLSearchParams();
  queryParams.append('page', params.page.toString());
  queryParams.append('limit', params.limit.toString());

  if (params.sortBy) {
    queryParams.append('sortBy', params.sortBy);
  }
  if (params.sortOrder) {
    queryParams.append('sortOrder', params.sortOrder);
  }
  if (params.filters) {
    queryParams.append('filters', JSON.stringify(params.filters));
  }

  return `/api/caseManagement/adminChecklist/list?${queryParams.toString()}`;
};

export const fetchChecklistTemplateList = async (
  params: ChecklistTemplateListParams
): Promise<{ checklistTemplates: ChecklistTemplateList[]; count: number }> => {
  const { data } = await caseServiceApi.get<ChecklistTemplateListResponse>(
    getChecklistTemplateListUrl(params)
  );
  return {
    checklistTemplates: data.data.checklist,
    count: data.data.count,
  };
};

export const useChecklistTemplateList = (
  params: ChecklistTemplateListParams,
  refresh?: number
): UseQueryResult<
  { checklistTemplates: ChecklistTemplateList[]; count: number },
  Error
> => {
  return useQuery<
    { checklistTemplates: ChecklistTemplateList[]; count: number },
    Error
  >({
    queryKey: ['checklist-template-list', params, refresh],
    queryFn: () => fetchChecklistTemplateList(params),
    retry: 0,
    gcTime: 0,
  });
};

// Details
export const getChecklistTemplateDetailsURL = (caseId: string) => {
  return `/api/caseManagement/adminChecklist/detail/${caseId}`;
};

export const fetchChecklistTemplateDetails = async (
  caseId: string
): Promise<ChecklistTemplateDetails> => {
  try {
    const { data } = await caseServiceApi.get(
      getChecklistTemplateDetailsURL(caseId)
    );

    if (data?.data?.checklistDetails) {
      const checklistDetails = data.data.checklistDetails;

      return {
        rid: checklistDetails.checklist_template_rid,
        checklist_name: checklistDetails.checklist_name || '',
        r_number: checklistDetails.r_number || '',
        description: checklistDetails.checklist_description || '',
        status_rid: checklistDetails.status_rid || '',
        status_name: checklistDetails.status_name || '',
        checklist_type_rid: checklistDetails.checklist_type_rid || '',
        checklist_type_name: checklistDetails.checklist_type_name || '',
        checklist_level_rid: checklistDetails.checklist_level_rid || '',
        checklist_level_name: checklistDetails.checklist_level_name || '',
        expires_on: checklistDetails.expires_on || '',
        modified_by: checklistDetails.modified_by,
        created_by: checklistDetails.created_by || '',
        created_datetime: checklistDetails.created_datetime || '',
        modified_datetime: checklistDetails.modified_datetime || '',
        questions:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          checklistDetails.checklist_items?.map((item: any) => ({
            rid: item.rid,
            question_seq_num: `Q${String(item.sequence_no).padStart(2, '0')}`,
            question: item.checklist_item_name || '',
            description: item.description || '',
          })) || [],
      };
    }

    throw new Error('Invalid response structure');
  } catch (error) {
    console.error('Error fetching case details:', error);
    throw error;
  }
};

export const useChecklistTemplateDetails = (
  caseId: string
): UseQueryResult<ChecklistTemplateDetails | undefined, Error> => {
  return useQuery({
    queryKey: ['case-details', caseId],
    queryFn: () => fetchChecklistTemplateDetails(caseId),
    enabled: !!caseId,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    gcTime: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });
};

// Create & Edit
export const getCreateChecklistTemplateUrl = (): string => {
  return `/api/checklistTemplates/new`;
};

export const createChecklistTemplate = async (
  body: Partial<ChecklistTemplateFormPayload>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await interactionServiceApi.post<CommonApiResponse>(
      getCreateChecklistTemplateUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error creating checklist template:', error);
    throw error;
  }
};

export const useCreateChecklistTemplate = () => {
  return useMutation<
    CommonApiResponse,
    Error,
    Partial<ChecklistTemplateFormPayload>
  >({
    mutationFn: (body) => createChecklistTemplate({ ...body }),
  });
};

export const getUpdateChecklistTemplateUrl = (): string => {
  return `/api/checklistTemplates/update`;
};

export const updateChecklistTemplateDetails = async (
  body: CreateTemplatePayload
): Promise<CreateTemplateResponse> => {
  try {
    const { data } = await caseServiceApi.post<CreateTemplateResponse>(
      getCreateTemplateUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error updating checklist template details:', error);
    throw error;
  }
};

export const useUpdateChecklistTemplateDetails = () => {
  return useMutation<CreateTemplateResponse, Error, CreateTemplatePayload>({
    mutationFn: (body) => updateChecklistTemplateDetails(body),
  });
};

export const getCreateTemplateUrl = (): string => {
  return '/api/caseManagement/adminChecklist/create';
};

export const createTemplate = async (
  body: CreateTemplatePayload
): Promise<CreateTemplateResponse> => {
  try {
    const { data } = await caseServiceApi.post<CreateTemplateResponse>(
      getCreateTemplateUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
};

export const useCreateTemplate = () => {
  return useMutation<CreateTemplateResponse, Error, CreateTemplatePayload>({
    mutationFn: (body) => createTemplate(body),
  });
};

// Export All checklist
export const getChecklistTemplateExportAllUrl = () =>
  '/api/checklistTemplates/exportAll';

export const ExportChecklistTemplateAllList = async (
  params: ChecklistTemplateListParams
): Promise<void> => {
  try {
    const filename = `checklist_templates.xlsx`;
    const response =
      await interactionServiceApi.post<ExportChecklistTemplateResponse>(
        getChecklistTemplateExportAllUrl(),
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

// Export individual checklist
export const getChecklistTemplateExportUrl = () =>
  '/api/checklistTemplates/export';

export const ExportChecklistTemplate = async (
  templateId: string,
  checklistName: string,
  timezone: string
): Promise<void> => {
  try {
    const filename = `${checklistName ? checklistName + '_' : ''}template.xlsx`;
    const response =
      await interactionServiceApi.post<ExportChecklistTemplateResponse>(
        getChecklistTemplateExportUrl(),
        {
          template_rid: templateId,
          timezone,
        }
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

// Checklist ->  level, status, type
export const getChecklistTypeUrl = (): string => {
  return '/api/checklist/type';
};

export const fetchChecklistTypes =
  async (): Promise<ChecklistTypeApiResponse> => {
    try {
      // const { data } =
      //   await interactionServiceApi.get<ChecklistTypeApiResponse>(
      //     getChecklistTypeUrl()
      //   );
      // return data;

      await new Promise((resolve) => setTimeout(resolve, 2000));
      return ChecklistTypesMockData;
    } catch (error) {
      console.error('Error fetching checklist types:', error);
      throw error;
    }
  };

export const useGetChecklistTypes = () => {
  return useQuery<ChecklistTypeApiResponse, Error>({
    queryKey: ['checklist-type'],
    queryFn: () => fetchChecklistTypes(),
    retry: 0,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

export const getChecklistLevelUrl = (): string => {
  return '/api/checklist/level';
};

export const fetchChecklistLevels =
  async (): Promise<ChecklistLevelApiResponse> => {
    try {
      // const { data } =
      //   await interactionServiceApi.get<GetChecklistLevelApiResponse>(
      //     getChecklistLevelUrl()
      //   );
      // return data;

      await new Promise((resolve) => setTimeout(resolve, 2000));
      return ChecklistLevelsMockData;
    } catch (error) {
      console.error('Error fetching checklist levels:', error);
      throw error;
    }
  };

export const useGetChecklistLevels = () => {
  return useQuery<ChecklistLevelApiResponse, Error>({
    queryKey: ['checklist-level'],
    queryFn: () => fetchChecklistLevels(),
    retry: 0,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

export const getChecklistStatusUrl = (): string => {
  return '/api/checklist/status';
};

export const fetchChecklistStatus =
  async (): Promise<ChecklistStatusApiResponse> => {
    try {
      // const { data } =
      //   await interactionServiceApi.get<ChecklistStatusApiResponse>(
      //     getChecklistStatusUrl()
      //   );
      // return data;

      await new Promise((resolve) => setTimeout(resolve, 2000));
      return ChecklistStatusMockData;
    } catch (error) {
      console.error('Error fetching checklist status:', error);
      throw error;
    }
  };

export const useGetChecklistStatus = () => {
  return useQuery<ChecklistStatusApiResponse, Error>({
    queryKey: ['checklist-status'],
    queryFn: () => fetchChecklistStatus(),
    retry: 0,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};
