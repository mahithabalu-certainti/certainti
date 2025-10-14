import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  accountServiceApi,
  userServiceApi,
  resourceServiceApi,
  interactionServiceApi,
  exInteractionServiceApi,
} from '../api/api';
import {
  CommonApiResponse,
  DeleteAttachmentRequest,
  DocumentTypeResponse,
  GenerateOtp,
  GetAllCountriesApiResponse,
  GetCurrentUserRoleApiResponse,
  GetImportEntityTypeApiResponse,
  GetInteractionLevelApiResponse,
  GetInteractionResponeSourcesApiResponse,
  GetInteractionStatusApiResponse,
  GetInteractionTypesApiResponse,
  GetStatusApiResponse,
  InteractionQuestionUpdateRequest,
  UploadAttachmentRequest,
  VerifyOtp,
  VerifyOtpApiResponse,
} from './';
import {
  InteractionDetails,
  InteractionDetailsResponse,
  InteractionQuestionResUpdateResponse,
  UploadInteractionAttachmentResponse,
} from '../consultant/types';

export const getAllCountriesUrl = (): string => {
  return `/api/accounts/country`;
};
/**
 * Fetches detailed information for a all country
 * @returns Promise with user details
 */
export const fetchAllCountries =
  async (): Promise<GetAllCountriesApiResponse> => {
    try {
      const { data } =
        await accountServiceApi.get<GetAllCountriesApiResponse>(
          getAllCountriesUrl()
        );
      // await new Promise((resolve) => setTimeout(resolve, 1000));
      return data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  };
/**
 * React Query hook for fetching country list (view only)
 * @returns UseQueryResult with user details and query state
 */
export const getDocumentInfoUrl = (categoryId?: string): string => {
  return categoryId
    ? `api/attachment/document-type-category?category_rid=${categoryId}`
    : 'api/attachment/document-type-category';
};

export const useGetAllCountries = () => {
  return useQuery<GetAllCountriesApiResponse, Error>({
    queryKey: ['getAllCountry'], // Unique query key
    queryFn: () => fetchAllCountries(),
    retry: 0,
    staleTime: Infinity, // Cache data forever until manually invalidated
    gcTime: Infinity, // Never delete from cache
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
};

export const fetchAllDocumentInfo = async (): Promise<DocumentTypeResponse> => {
  try {
    const { data } =
      await resourceServiceApi.get<DocumentTypeResponse>(getDocumentInfoUrl());
    return data;
  } catch (error) {
    console.error('Error fetching document types:', error);
    throw error;
  }
};

export const useGetAllDocumentInfo = () => {
  return useQuery<DocumentTypeResponse, Error>({
    queryKey: ['getAllDocumentInfo'],
    queryFn: () => fetchAllDocumentInfo(),
    retry: 0,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

export const fetchDocumentCategoryType = async (
  categoryId: string
): Promise<DocumentTypeResponse> => {
  try {
    const { data } = await resourceServiceApi.get<DocumentTypeResponse>(
      getDocumentInfoUrl(categoryId)
    );
    return data;
  } catch (error) {
    console.error('Error fetching document category type :', error);
    throw error;
  }
};

export const useGetDocumentCategoryType = (categoryId: string) => {
  return useQuery<DocumentTypeResponse, Error>({
    queryKey: ['getDocumentCategoryType', categoryId],
    queryFn: () => fetchDocumentCategoryType(categoryId),
    retry: 0,
    enabled: !!categoryId,
  });
};

export const getCurrentUserRoleUrl = (id: string): string => {
  return `/api/user/${id}/permission`;
};

/**
 * Fetches current user Role (view only)
 * @returns Promise with user details
 */
export const fetchCurrentUserRole = async (
  userId: string,
  idToken: string
): Promise<GetCurrentUserRoleApiResponse> => {
  try {
    const { data } = await userServiceApi.get<GetCurrentUserRoleApiResponse>(
      getCurrentUserRoleUrl(userId),
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      }
    );
    return data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

export const getStatusUrl = (): string => {
  return `/api/accounts/status`;
};

export const fetchStatus = async (): Promise<GetStatusApiResponse> => {
  try {
    const { data } =
      await accountServiceApi.get<GetStatusApiResponse>(getStatusUrl());
    return data;
  } catch (error) {
    console.error('Error fetching status list:', error);
    throw error;
  }
};

export const useGetStatus = () => {
  return useQuery<GetStatusApiResponse, Error>({
    queryKey: ['getStatus'],
    queryFn: () => fetchStatus(),
    retry: 0,
    staleTime: Infinity, // Cache data forever until manually invalidated
    gcTime: Infinity, // Never delete from cache
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
};

export const getImportEntityTypesUrl = (): string => {
  return `/api/accounts/importEntityTypes`;
};

export const fetchImportEntityTypes =
  async (): Promise<GetImportEntityTypeApiResponse> => {
    try {
      const { data } =
        await accountServiceApi.get<GetImportEntityTypeApiResponse>(
          getImportEntityTypesUrl()
        );
      return data;
    } catch (error) {
      console.error('Error fetching entity type list:', error);
      throw error;
    }
  };

export const useGetImportEntityTypes = () => {
  return useQuery<GetImportEntityTypeApiResponse, Error>({
    queryKey: ['import-entity-types'],
    queryFn: () => fetchImportEntityTypes(),
    retry: 0,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

export const usePostGenerateOtp = () => {
  return useMutation<CommonApiResponse, Error, GenerateOtp>({
    mutationFn: (body) => postMailIntractionOtp(body),
  });
};

export const postMailIntractionOtp = async (
  body: GenerateOtp
): Promise<CommonApiResponse> => {
  try {
    const { data } = await exInteractionServiceApi.post<CommonApiResponse>(
      `/api/otp/generate`,
      body
    );
    return data;
  } catch (error) {
    console.error('Error generate OTP', error);
    throw error;
  }
};

//Interactions
export const getInteractionStatusUrl = (
  statusId?: string,
  reminder_specific_list?: boolean
): string => {
  const params = new URLSearchParams();

  if (statusId) {
    params.append('current_status', statusId);
  }

  if (reminder_specific_list) {
    params.append('reminder_specific_list', 'true');
  }

  const query = params.toString();
  return `/api/interactions/interactionStatus${query ? `?${query}` : ''}`;
};

export const fetchInteractionStatus = async (
  statusId?: string,
  reminder_specific_list?: boolean
): Promise<GetInteractionStatusApiResponse> => {
  try {
    const { data } =
      await interactionServiceApi.get<GetInteractionStatusApiResponse>(
        getInteractionStatusUrl(statusId, reminder_specific_list)
      );
    return data;
  } catch (error) {
    console.error('Error fetching interaction status:', error);
    throw error;
  }
};

export const usePostReSendOtp = () => {
  return useMutation<CommonApiResponse, Error, GenerateOtp>({
    mutationFn: (body) => postReSendOtp(body),
  });
};

export const postReSendOtp = async (
  body: GenerateOtp
): Promise<CommonApiResponse> => {
  try {
    const { data } = await exInteractionServiceApi.post<CommonApiResponse>(
      `/api/otp/resend`,
      body
    );
    return data;
  } catch (error) {
    console.error('Error fetching highlights details:', error);
    throw error;
  }
};

export const usePostVerifyOtp = () => {
  return useMutation<VerifyOtpApiResponse, Error, VerifyOtp>({
    mutationFn: (body) => postVerifyOtp(body),
  });
};

export const postVerifyOtp = async (
  body: VerifyOtp
): Promise<VerifyOtpApiResponse> => {
  try {
    const { data } = await exInteractionServiceApi.post<VerifyOtpApiResponse>(
      `/api/otp/verify`,
      body
    );
    return data;
  } catch (error) {
    console.error('Error fetching highlights details:', error);
    throw error;
  }
};

export const useGetInteractionStatus = () => {
  return useQuery<GetInteractionStatusApiResponse, Error>({
    queryKey: ['interaction-status'],
    queryFn: () => fetchInteractionStatus(),
    retry: 0,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

export const fetchInteractionLevel =
  async (): Promise<GetInteractionLevelApiResponse> => {
    try {
      const { data } =
        await interactionServiceApi.get<GetInteractionLevelApiResponse>(
          '/api/interactions/interactionLevel'
        );
      return data;
    } catch (error) {
      console.error('Error fetching interaction status:', error);
      throw error;
    }
  };

export const useGetInteractionLevel = () => {
  return useQuery<GetInteractionLevelApiResponse, Error>({
    queryKey: ['interaction-level'],
    queryFn: () => fetchInteractionLevel(),
    retry: 0,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

export const useGetInteractionStatusById = (statusId: string) => {
  return useQuery<GetInteractionStatusApiResponse, Error>({
    queryKey: ['gat-interaction-status-by-id'],
    queryFn: () => fetchInteractionStatus(statusId),
    retry: 0,
    enabled: !!statusId,
  });
};
export const useGetInteractionStatusByReminder = (
  reminder_specific_list?: boolean
) => {
  return useQuery<GetInteractionStatusApiResponse, Error>({
    queryKey: ['gat-interaction-status-by-id'],
    queryFn: () => fetchInteractionStatus('', reminder_specific_list),
    retry: 0,
    enabled: !!reminder_specific_list,
  });
};

export const getInteractionTypesUrl = (): string => {
  return `/api/interactions/interactionTypes`;
};

export const fetchInteractionTypes =
  async (): Promise<GetInteractionTypesApiResponse> => {
    try {
      const { data } =
        await interactionServiceApi.get<GetInteractionTypesApiResponse>(
          getInteractionTypesUrl()
        );
      return data;
    } catch (error) {
      console.error('Error fetching interaction types:', error);
      throw error;
    }
  };

export const useGetInteractionTypes = () => {
  return useQuery<GetInteractionTypesApiResponse, Error>({
    queryKey: ['interaction-types'],
    queryFn: () => fetchInteractionTypes(),
    retry: 0,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

export const getInteractionResponeSourcesUrl = (): string => {
  return `/api/interactions/responseSource`;
};

export const fetchInteractionResponeSources =
  async (): Promise<GetInteractionResponeSourcesApiResponse> => {
    try {
      const { data } =
        await interactionServiceApi.get<GetInteractionResponeSourcesApiResponse>(
          getInteractionResponeSourcesUrl()
        );
      return data;
    } catch (error) {
      console.error('Error fetching interaction respone sources:', error);
      throw error;
    }
  };

export const useGetInteractionResponeSources = () => {
  return useQuery<GetInteractionResponeSourcesApiResponse, Error>({
    queryKey: ['interaction-sources'],
    queryFn: () => fetchInteractionResponeSources(),
    retry: 0,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

const fetchInteractionQuestions = async (
  accountId: string,
  interactionId: string,
  authToken: string,
  userId: string
): Promise<InteractionDetails> => {
  // Only send the provided headers, do not merge with defaults
  const response =
    await exInteractionServiceApi.get<InteractionDetailsResponse>(
      `/api/interactions/detail/${accountId}/${interactionId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'x-user-id': userId,
        },
        // Prevent merging with common headers if axios is configured that way
        transformRequest: [
          (data, headers) => {
            headers['Authorization'] = `Bearer ${authToken}`;
            headers['x-user-id'] = userId;
            // Remove any other headers that may be set globally
            Object.keys(headers).forEach((key) => {
              if (key !== 'Authorization' && key !== 'x-user-id') {
                delete headers[key];
              }
            });
            return data;
          },
        ],
      }
    );
  return response.data.data.interactionDetails;
};

export const useGetInteractionQuestions = (
  accountId?: string,
  interactionId?: string,
  projectFiscalRid?: string,
  authToken?: string,
  userId?: string
): UseQueryResult<InteractionDetails | undefined, Error> => {
  return useQuery<InteractionDetails | undefined, Error>({
    queryKey: [
      'interaction-questions',
      accountId,
      interactionId,
      projectFiscalRid,
    ],
    queryFn: () =>
      fetchInteractionQuestions(
        accountId!,
        interactionId!,
        authToken!,
        userId!
      ),
    retry: 0,
    gcTime: 0,
    enabled: !!authToken && !!userId && !!interactionId && !!accountId,
  });
};

export const updateInteractionQuestions = async (
  body: InteractionQuestionUpdateRequest
): Promise<InteractionQuestionResUpdateResponse> => {
  try {
    // Always use authToken and userId from body, even if available elsewhere
    const { authToken, userId, ...rest } = body;
    const { data } =
      await exInteractionServiceApi.put<InteractionQuestionResUpdateResponse>(
        '/api/interactions/updateResponse',
        rest,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'x-user-id': userId,
          },
          // Prevent merging with common headers if axios is configured that way
          transformRequest: [
            (data, headers) => {
              // Clear all existing headers first
              Object.keys(headers).forEach((key) => {
                delete headers[key];
              });
              // Set only the required headers
              headers['Authorization'] = `Bearer ${authToken}`;
              headers['x-user-id'] = userId;
              headers['Content-Type'] = 'application/json';
              return JSON.stringify(data);
            },
          ],
        }
      );
    return data;
  } catch (error) {
    console.error('Error updating interaction response:', error);
    throw error;
  }
};
export const useUpdateInteractionQuestion = () => {
  return useMutation<
    InteractionQuestionResUpdateResponse,
    Error,
    InteractionQuestionUpdateRequest
  >({
    mutationFn: (body) => updateInteractionQuestions(body),
  });
};

export const uploadAttachment = async (
  body: UploadAttachmentRequest
): Promise<UploadInteractionAttachmentResponse> => {
  try {
    // Always use authToken and userId from body, even if available elsewhere
    const { authToken, userId, ...rest } = body;
    const formData = new FormData();
    formData.append('account_rid', rest.account_rid);
    formData.append('project_rid', rest.project_rid);
    formData.append('interaction_rid', rest.interaction_rid);
    formData.append('file', rest.file);

    const response = await exInteractionServiceApi.post(
      '/api/interactions/uploadAttachment',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${authToken}`,
          'x-user-id': userId,
        },
        // Prevent merging with common headers if axios is configured that way
        transformRequest: [
          (data, headers) => {
            // Clear all existing headers first
            Object.keys(headers).forEach((key) => {
              delete headers[key];
            });
            // Set only the required headers
            headers['Authorization'] = `Bearer ${authToken}`;
            headers['x-user-id'] = userId;
            headers['Content-Type'] = 'multipart/form-data';
            return data;
          },
        ],
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error uploading attachment:', error);
    throw error;
  }
};

export const useUploadAttachment = () => {
  return useMutation<
    UploadInteractionAttachmentResponse,
    Error,
    UploadAttachmentRequest
  >({
    mutationFn: (body) => uploadAttachment(body),
  });
};

export const deleteAttachment = async (
  body: DeleteAttachmentRequest
): Promise<CommonApiResponse> => {
  try {
    // Always use authToken and userId from body, even if available elsewhere
    const { authToken, userId, ...rest } = body;
    const response = await exInteractionServiceApi.delete(
      '/api/interactions/deleteAttachment ',
      {
        data: rest,
        headers: {
          Authorization: `Bearer ${authToken}`,
          'x-user-id': userId,
        },
        // Prevent merging with common headers if axios is configured that way
        transformRequest: [
          (data, headers) => {
            // Clear all existing headers first
            Object.keys(headers).forEach((key) => {
              delete headers[key];
            });
            // Set only the required headers
            headers['Authorization'] = `Bearer ${authToken}`;
            headers['x-user-id'] = userId;
            headers['Content-Type'] = 'application/json';
            return JSON.stringify(data);
          },
        ],
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error uploading attachment:', error);
    throw error;
  }
};

export const useDeleteAttachment = () => {
  return useMutation<CommonApiResponse, Error, DeleteAttachmentRequest>({
    mutationFn: (body) => deleteAttachment(body),
  });
};
