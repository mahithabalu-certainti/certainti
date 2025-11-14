import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import { caseServiceApi } from '../../../api/api';
import {
  CategoryPlaceholderResponse,
  EmailCategoryResponse,
  EmailPlaceholderResponse,
  EmailTemplateDetails,
  EmailTemplateDetailsResponse,
  EmailTemplateFormPayload,
  EmailTemplateList,
  EmailTemplateListParams,
  EmailTemplateListResponse,
  ExportEmailTemplateResponse,
} from '../../types';
import { CommonApiResponse } from '../../../common-service';
import {
  getEmailTemplateExportUrl,
  getEmailTemplateListUrl,
} from './email-template-url';

// List
export const fetchEmailTemplateList = async (
  params: EmailTemplateListParams
): Promise<{ emailTemplates: EmailTemplateList[]; count: number }> => {
  const { data } = await caseServiceApi.get<EmailTemplateListResponse>(
    getEmailTemplateListUrl(params)
  );
  return {
    emailTemplates: data.data.emailTemplates,
    count: data.data.count,
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
  return `/api/caseManagement/emailTemplate/detail/${templateId}`;
};

export const fetchEmailTemplateDetails = async (
  templateId: string
): Promise<EmailTemplateDetails> => {
  const response = await caseServiceApi.get<EmailTemplateDetailsResponse>(
    getEmailTemplateDetailsURL(templateId)
  );

  return response.data.data.emailTemplateDetails;
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
  return `/api/caseManagement/emailTemplate/create`;
};

export const createEmailTemplate = async (
  body: Partial<EmailTemplateFormPayload>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await caseServiceApi.post<CommonApiResponse>(
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
  return `/api/caseManagement/emailTemplate/update`;
};

export const updateEmailTemplateDetails = async (
  body: Partial<EmailTemplateFormPayload>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await caseServiceApi.post<CommonApiResponse>(
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
export const ExportEmailTemplateList = async (
  params: EmailTemplateListParams
): Promise<void> => {
  try {
    const filename = `email_templates.xlsx`;
    const response = await caseServiceApi.get<ExportEmailTemplateResponse>(
      getEmailTemplateExportUrl(params)
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

// Email Placeholders
export const getEmailPlaceholderUrl = (): string => {
  return `/api/caseManagement/emailPlaceHolders`;
};

export const fetchEmailPlaceholder =
  async (): Promise<EmailPlaceholderResponse> => {
    try {
      const { data } = await caseServiceApi.get<EmailPlaceholderResponse>(
        getEmailPlaceholderUrl()
      );
      return data;
    } catch (error) {
      console.error('Error fetching email placeholder list:', error);
      throw error;
    }
  };

export const useGetEmailPlaceholder = () => {
  return useQuery<EmailPlaceholderResponse, Error>({
    queryKey: ['get-email-placeholder-list'],
    queryFn: () => fetchEmailPlaceholder(),
    retry: 0,
    gcTime: 0,
    enabled: true,
  });
};

// Category Placeholders
export const getCategoryPlaceholderUrl = (categoryId: string): string => {
  return `/api/caseManagement/categoryPlaceHolders/${categoryId}`;
};

export const fetchCategoryPlaceholder = async (
  categoryId: string
): Promise<CategoryPlaceholderResponse> => {
  try {
    const { data } = await caseServiceApi.get<CategoryPlaceholderResponse>(
      getCategoryPlaceholderUrl(categoryId)
    );
    return data;
  } catch (error) {
    console.error('Error fetching category placeholder list:', error);
    throw error;
  }
};

export const useGetCategoryPlaceholder = (categoryId: string) => {
  return useQuery<CategoryPlaceholderResponse, Error>({
    queryKey: ['get-category-placeholder-list', categoryId],
    queryFn: () => fetchCategoryPlaceholder(categoryId),
    retry: 0,
    gcTime: 0,
    enabled: !!categoryId,
  });
};

// Email Category List
export const getEmailCategoryUrl = (): string => {
  return `/api/caseManagement/emailTemplate/categories`;
};

export const fetchEmailCategory = async (): Promise<EmailCategoryResponse> => {
  try {
    const { data } = await caseServiceApi.get<EmailCategoryResponse>(
      getEmailCategoryUrl()
    );
    return data;
  } catch (error) {
    console.error('Error fetching email category list:', error);
    throw error;
  }
};

export const useGetEmailCategory = () => {
  return useQuery<EmailCategoryResponse, Error>({
    queryKey: ['get-email-category-list'],
    queryFn: () => fetchEmailCategory(),
    retry: 0,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};
