import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import { caseServiceApi, interactionServiceApi } from '../../../api/api';
import {
  ChecklistTemplateDetails,
  ChecklistTemplateFormPayload,
  ChecklistTemplateList,
  ChecklistTemplateListParams,
  ChecklistTemplateListResponse,
  ExportChecklistTemplateResponse,
  CreateTemplatePayload,
  CreateTemplateResponse,
} from '../../types';
import { CommonApiResponse } from '../../../common-service';
import { buildQueryString } from '../helpers';
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
  const response = await caseServiceApi.get(
    getChecklistTemplateDetailsURL(caseId)
  );
  return response.data.data.checklistDetails;
};

export const useChecklistTemplateDetails = (
  caseId: string
): UseQueryResult<ChecklistTemplateDetails | undefined, Error> => {
  return useQuery({
    queryKey: ['case-details', caseId],
    queryFn: () => fetchChecklistTemplateDetails(caseId),
    enabled: !!caseId,
    retry: 0,
    gcTime: 0,
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
  return `/api/caseManagement/adminChecklist/update`;
};

export const updateChecklistTemplateDetails = async (
  body: CreateTemplatePayload
): Promise<CreateTemplateResponse> => {
  try {
    const { data } = await caseServiceApi.post<CreateTemplateResponse>(
      getUpdateChecklistTemplateUrl(),
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
export const getChecklistTemplateExportAllUrl = (
  params: ChecklistTemplateListParams
) => {
  const queryParams: Record<string, unknown> = {
    sortBy: params.sortBy || 'createdAt',
    sortOrder: params.sortOrder || 'DESC',
    filters: params.filters,
    timezone: params.timezone,
    ...(params.search && { search: params.search }),
  };

  return `/api/caseManagement/adminChecklist/export?${buildQueryString(queryParams)}`;
};
export const ExportChecklistTemplateAllList = async (
  params: ChecklistTemplateListParams
): Promise<void> => {
  try {
    const filename = `checklist_templates.xlsx`;
    const response = await caseServiceApi.get<ExportChecklistTemplateResponse>(
      getChecklistTemplateExportAllUrl(params)
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
export const getChecklistTemplateExportUrl = (
  templateId: string,
  timezone: string
) =>
  `/api/caseManagement/adminChecklist/export/${templateId}?timezone=${timezone}`;

export const ExportChecklistTemplate = async (
  templateId: string,
  checklistName: string,
  timezone: string
): Promise<void> => {
  try {
    const filename = `${checklistName ? checklistName + '_' : ''}template.xlsx`;
    const response = await caseServiceApi.get<ExportChecklistTemplateResponse>(
      getChecklistTemplateExportUrl(templateId, timezone)
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
