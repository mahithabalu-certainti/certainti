import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  InteractionDetails,
  InteractionFormPayload,
  InteractionDetailsResponse,
  InteractionList,
  InteractionListResponse,
  InteractionListURLParams,
  SendInteractionPayload,
} from '../../types';
import { interactionServiceApi } from '../../../api/api';
import { CommonApiResponse } from '../../../common-service';
import {
  getInteractionExportUrl,
  getInteractionListUrl,
} from '../urls/interactions-url';

export const exportInteractions = async (
  body: InteractionListURLParams
): Promise<void> => {
  try {
    const response = await interactionServiceApi.post(
      getInteractionExportUrl(),
      body,
      {
        responseType: 'blob',
      }
    );

    const contentDisposition = response.headers['content-disposition'];
    let fileName = 'project_interactions.xlsx';
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="([^"]+)"/);
      if (fileNameMatch && fileNameMatch[1]) {
        fileName = fileNameMatch[1];
      }
    }

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting interactions:', error);
    throw error;
  }
};

export const useExportInteractions = () => {
  return useMutation<void, Error, InteractionListURLParams>({
    mutationFn: (body) => exportInteractions(body),
  });
};

const getInteractionDetailsURL = (accountId: string, interactionId: string) => {
  return `/api/interactions/detail/${accountId}/${interactionId}`;
};

export const fetchInteractionList = async (
  params: InteractionListURLParams
): Promise<{ interactions: InteractionList[]; count: number }> => {
  const { data } = await interactionServiceApi.post<InteractionListResponse>(
    getInteractionListUrl(),
    params
  );
  return {
    interactions: data.data.interactions,
    count: data.data.totalCount,
  };
};

export const useInteractionList = (
  params: InteractionListURLParams,
  shouldFetchList: boolean,
  refreshInteractions?: number
): UseQueryResult<
  { interactions: InteractionList[]; count: number },
  Error
> => {
  return useQuery<{ interactions: InteractionList[]; count: number }, Error>({
    queryKey: ['interaction-list', params, refreshInteractions],
    queryFn: () => fetchInteractionList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.account_rid && !!params.fiscal_year && !!shouldFetchList,
  });
};

export const useGetAllInteractionList = (
  params: InteractionListURLParams,
  refreshTrigger?: number
): UseQueryResult<
  { interactions: InteractionList[]; count: number },
  Error
> => {
  return useQuery<{ interactions: InteractionList[]; count: number }, Error>({
    queryKey: ['all-interaction-list', params, refreshTrigger],
    queryFn: () => fetchInteractionList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.isGlobal,
  });
};

const fetchInteractionDetails = async (
  accountId: string,
  interactionId: string
): Promise<InteractionDetails> => {
  const response = await interactionServiceApi.get<InteractionDetailsResponse>(
    getInteractionDetailsURL(accountId, interactionId)
  );

  return response.data.data.interactionDetails;
};

export const useInteractionDetails = (
  accountId?: string,
  interactionId?: string
): UseQueryResult<InteractionDetails | undefined, Error> => {
  return useQuery<InteractionDetails | undefined, Error>({
    queryKey: ['interaction-details', accountId, interactionId],
    queryFn: () => fetchInteractionDetails(accountId!, interactionId!),
    retry: 0,
    gcTime: 0,
    enabled: !!interactionId && !!accountId,
  });
};

// Create & Edit
export const getCreateInteractionUrl = (): string => {
  return `/api/interactions/new`;
};

export const createInteraction = async (
  body: Partial<InteractionFormPayload>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await interactionServiceApi.post<CommonApiResponse>(
      getCreateInteractionUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error create interaction:', error);
    throw error;
  }
};

export const useCreateInteraction = () => {
  return useMutation<CommonApiResponse, Error, Partial<InteractionFormPayload>>(
    {
      mutationFn: (body) => createInteraction({ ...body }),
    }
  );
};

export const getUpdateInteractionUrl = (): string => {
  return `/api/interactions/update`;
};

export const updateInteractionDetails = async (
  body: Partial<InteractionFormPayload>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await interactionServiceApi.put<CommonApiResponse>(
      getUpdateInteractionUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error updating interaction details:', error);
    throw error;
  }
};

export const useUpdateInteractionDetails = () => {
  return useMutation<CommonApiResponse, Error, Partial<InteractionFormPayload>>(
    {
      mutationFn: (body) => updateInteractionDetails({ ...body }),
    }
  );
};

// Send interaction
export const sendInteraction = async (
  body: SendInteractionPayload
): Promise<CommonApiResponse> => {
  try {
    const { data } = await interactionServiceApi.post<CommonApiResponse>(
      '/api/interactions/sendInteraction',
      body
    );
    return data;
  } catch (error) {
    console.error('Error sending interaction:', error);
    throw error;
  }
};

export const useSendInteraction = () => {
  return useMutation<CommonApiResponse, Error, SendInteractionPayload>({
    mutationFn: (body) => sendInteraction(body),
  });
};
