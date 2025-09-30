import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  ExportInteractionTemplateResponse,
  InteractionTemplateDetails,
  InteractionTemplateDetailsResponse,
  InteractionTemplateList,
  InteractionTemplateListResponse,
  TemplateFormPayload,
  TemplateListParams,
} from '../../types';
import { interactionServiceApi } from '../../../api/api';
import { CommonApiResponse } from '../../../common-service';

export const getInteractionTemplateExportUrl = () =>
  '/api/interactionTemplates/export';

export const ExportInteractionTemplate = async (
  templateId: string,
  templateName: string
): Promise<void> => {
  try {
    const filename = `${templateName ? templateName + '_' : ''}template.xlsx`;
    const response =
      await interactionServiceApi.post<ExportInteractionTemplateResponse>(
        getInteractionTemplateExportUrl(),
        {
          template_rid: templateId,
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

export const getInteractionAllTemplateExportUrl = () =>
  '/api/interactionTemplates/exportAll';

export const ExportInteractionAllTemplateList = async (
  params: TemplateListParams
): Promise<void> => {
  try {
    const filename = `interaction_templates.xlsx`;
    const response =
      await interactionServiceApi.post<ExportInteractionTemplateResponse>(
        getInteractionAllTemplateExportUrl(),
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

export const getInteractionListUrl = () => '/api/interactionTemplates/list';

export const fetchInteractionTemplateList = async (
  params: TemplateListParams
): Promise<{ interactions: InteractionTemplateList[]; count: number }> => {
  const { data } =
    await interactionServiceApi.post<InteractionTemplateListResponse>(
      getInteractionListUrl(),
      params
    );
  return {
    interactions: data.data.interactions,
    count: data.data.totalCount,
  };
};

export const useInteractionTemplateList = (
  params: TemplateListParams,
  refreshTemplate?: number
): UseQueryResult<
  { interactions: InteractionTemplateList[]; count: number },
  Error
> => {
  return useQuery<
    { interactions: InteractionTemplateList[]; count: number },
    Error
  >({
    queryKey: ['interaction-template-list', params, refreshTemplate],
    queryFn: () => fetchInteractionTemplateList(params),
    retry: 0,
    gcTime: 0,
  });
};

const getInteractionTemplateDetailsURL = (templateId: string) => {
  return `/api/interactionTemplates/detail/${templateId}`;
};

const fetchInteractionTemplateDetails = async (
  templateId: string
): Promise<InteractionTemplateDetails> => {
  const response =
    await interactionServiceApi.get<InteractionTemplateDetailsResponse>(
      getInteractionTemplateDetailsURL(templateId)
    );

  return response.data.data.interactionDetails;
};

export const useInteractionTemplateDetails = (
  templateId: string
): UseQueryResult<InteractionTemplateDetails | undefined, Error> => {
  return useQuery<InteractionTemplateDetails | undefined, Error>({
    queryKey: ['interaction-template-details', templateId],
    queryFn: () => fetchInteractionTemplateDetails(templateId),
    retry: 0,
    gcTime: 0,
    enabled: !!templateId,
  });
};

// Create & Edit
export const getCreateInteractionTemplateUrl = (): string => {
  return `/api/interactionTemplates/new`;
};

export const createInteractionTemplate = async (
  body: Partial<TemplateFormPayload>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await interactionServiceApi.post<CommonApiResponse>(
      getCreateInteractionTemplateUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error create interaction template:', error);
    throw error;
  }
};

export const useCreateInteractionTemplate = () => {
  return useMutation<CommonApiResponse, Error, Partial<TemplateFormPayload>>({
    mutationFn: (body) => createInteractionTemplate({ ...body }),
  });
};

export const getUpdateInteractionTemplateUrl = (): string => {
  return `/api/interactionTemplates/update`;
};

export const updateInteractionTemplateDetails = async (
  body: Partial<TemplateFormPayload>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await interactionServiceApi.post<CommonApiResponse>(
      getUpdateInteractionTemplateUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error updating interaction details:', error);
    throw error;
  }
};

export const useUpdateInteractionTemplateDetails = () => {
  return useMutation<CommonApiResponse, Error, Partial<TemplateFormPayload>>({
    mutationFn: (body) => updateInteractionTemplateDetails({ ...body }),
  });
};
