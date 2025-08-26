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
  DocumentTypeResponse,
  GenerateOtp,
  GetAllCountriesApiResponse,
  GetCurrentUserRoleApiResponse,
  GetImportEntityTypeApiResponse,
  GetInteractionSourcesApiResponse,
  GetInteractionStatusApiResponse,
  GetInteractionTypesApiResponse,
  GetStatusApiResponse,
  VerifyOtp,
  VerifyOtpApiResponse,
} from './';
import {
  InteractionDetails,
  InteractionDetailsResponse,
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
    console.error('Error fetching highlights details:', error);
    throw error;
  }
};

//Interactions
export const getInteractionStatusUrl = (statusId?: string): string => {
  return statusId
    ? `/api/interactions/interactionStatus?current_status=${statusId}`
    : `/api/interactions/interactionStatus`;
};

export const fetchInteractionStatus = async (
  statusId?: string
): Promise<GetInteractionStatusApiResponse> => {
  try {
    const { data } =
      await interactionServiceApi.get<GetInteractionStatusApiResponse>(
        getInteractionStatusUrl(statusId)
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

export const useGetInteractionStatusById = (statusId: string) => {
  return useQuery<GetInteractionStatusApiResponse, Error>({
    queryKey: ['gat-interaction-status-by-id'],
    queryFn: () => fetchInteractionStatus(statusId),
    retry: 0,
    enabled: !!statusId,
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

export const getInteractionSourcesUrl = (): string => {
  return `/api/interactions/interactionSource`;
};

export const fetchInteractionSources =
  async (): Promise<GetInteractionSourcesApiResponse> => {
    try {
      const { data } =
        await interactionServiceApi.get<GetInteractionSourcesApiResponse>(
          getInteractionSourcesUrl()
        );
      return data;
    } catch (error) {
      console.error('Error fetching interaction sources:', error);
      throw error;
    }
  };

export const useGetInteractionSources = () => {
  return useQuery<GetInteractionSourcesApiResponse, Error>({
    queryKey: ['interaction-sources'],
    queryFn: () => fetchInteractionSources(),
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
  auth_token: string
): Promise<InteractionDetails> => {
  const parseData = JSON.parse(auth_token);
  const response = await interactionServiceApi.get<InteractionDetailsResponse>(
    `/api/interactions/detail/${accountId}/${interactionId}`,
    {
      headers: {
        Authorization: `Bearer ${parseData.auth_token}`,
        'x-user-id': parseData.email,
      },
    }
  );
  return response.data.data.interactionDetails;
};

export const useGetInteractionQuestions = (
  accountId?: string,
  interactionId?: string,
  auth_token?: string
): UseQueryResult<InteractionDetails | undefined, Error> => {
  return useQuery<InteractionDetails | undefined, Error>({
    queryKey: ['interaction-questions', accountId, interactionId],
    queryFn: () =>
      fetchInteractionQuestions(accountId!, interactionId!, auth_token!),
    retry: 0,
    gcTime: 0,
    enabled: !!auth_token && !!interactionId && !!accountId,
  });
};
