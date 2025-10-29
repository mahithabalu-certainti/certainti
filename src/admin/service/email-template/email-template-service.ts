import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import { interactionServiceApi } from '../../../api/api';
import {
  EmailTemplateDetails,
  //   EmailTemplateDetailsResponse,
  EmailTemplateFormPayload,
  EmailTemplateList,
  EmailTemplateListParams,
  ExportEmailTemplateResponse,
  //   EmailTemplateListResponse,
} from '../../types';
import { CommonApiResponse } from '../../../common-service';
import {
  EmailTemplateDetailsMockData,
  EmailTemplateMockData,
} from '../../mockdata/email-templates';

export const getEmailTemplateListUrl = () => '/api/emailTemplates/list';

export const fetchEmailTemplateList = async (
  params: EmailTemplateListParams
): Promise<{ emailTemplates: EmailTemplateList[]; count: number }> => {
  //   const { data } = await interactionServiceApi.post<EmailTemplateListResponse>(
  //     getEmailTemplateListUrl(),
  //     params
  //   );
  //   return {
  //     emailTemplates: data.data.emailTemplates,
  //     count: data.data.totalCount,
  //   };
  console.log('email-template-list-params', params);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return {
    emailTemplates: EmailTemplateMockData.data.emailTemplates,
    count: EmailTemplateMockData.data.totalCount,
  };
};

export const useEmailTemplateList = (
  params: EmailTemplateListParams,
  refresh?: number
): UseQueryResult<
  { emailTemplates: EmailTemplateList[]; count: number },
  Error
> => {
  return useQuery<
    { emailTemplates: EmailTemplateList[]; count: number },
    Error
  >({
    queryKey: ['email-template-list', params, refresh],
    queryFn: () => fetchEmailTemplateList(params),
    retry: 0,
    gcTime: 0,
  });
};

// Details
export const getEmailTemplateDetailsURL = (templateId: string) => {
  return `/api/emailTemplates/detail/${templateId}`;
};

export const fetchEmailTemplateDetails = async (
  templateId: string
): Promise<EmailTemplateDetails> => {
  //   const response =
  //     await interactionServiceApi.get<EmailTemplateDetailsResponse>(
  //       getEmailTemplateDetailsURL(templateId)
  //     );

  //   return response.data.data.templateDetails;
  console.log('email-template-details-params', templateId);
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return EmailTemplateDetailsMockData.data.templateDetails;
};

export const useEmailTemplateDetails = (
  templateId: string
): UseQueryResult<EmailTemplateDetails | undefined, Error> => {
  return useQuery<EmailTemplateDetails | undefined, Error>({
    queryKey: ['email-template-details', templateId],
    queryFn: () => fetchEmailTemplateDetails(templateId),
    retry: 0,
    gcTime: 0,
    enabled: !!templateId,
  });
};

// Create & Edit
export const getCreateEmailTemplateUrl = (): string => {
  return `/api/emailTemplates/new`;
};

export const createEmailTemplate = async (
  body: Partial<EmailTemplateFormPayload>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await interactionServiceApi.post<CommonApiResponse>(
      getCreateEmailTemplateUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error create email template:', error);
    throw error;
  }
};

export const useCreateEmailTemplate = () => {
  return useMutation<
    CommonApiResponse,
    Error,
    Partial<EmailTemplateFormPayload>
  >({
    mutationFn: (body) => createEmailTemplate({ ...body }),
  });
};

export const getUpdateEmailTemplateUrl = (): string => {
  return `/api/emailTemplates/update`;
};

export const updateEmailTemplateDetails = async (
  body: Partial<EmailTemplateFormPayload>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await interactionServiceApi.post<CommonApiResponse>(
      getUpdateEmailTemplateUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error updating email template details:', error);
    throw error;
  }
};

export const useUpdateEmailTemplateDetails = () => {
  return useMutation<
    CommonApiResponse,
    Error,
    Partial<EmailTemplateFormPayload>
  >({
    mutationFn: (body) => updateEmailTemplateDetails({ ...body }),
  });
};

// Export
export const getEmailTemplateExportUrl = () => '/api/emailTemplates/export';

export const ExportEmailTemplateList = async (
  params: EmailTemplateListParams
): Promise<void> => {
  try {
    const filename = `email_templates.xlsx`;
    const response =
      await interactionServiceApi.post<ExportEmailTemplateResponse>(
        getEmailTemplateExportUrl(),
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
