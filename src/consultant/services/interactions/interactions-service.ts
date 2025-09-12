import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  InteractionDetails,
  InteractionFormPayload,
  InteractionDetailsResponse,
  InteractionList,
  InteractionListResponse,
  InteractionListURLParams,
  SendInteractionPayload,
  ExportInteractionResponse,
  AccountSendInteractionPayload,
  AccountInteractionListResponse,
} from '../../types';
import { interactionServiceApi } from '../../../api/api';
import { CommonApiResponse } from '../../../common-service';
import {
  getInteractionExportUrl,
  getInteractionHistoryExportUrl,
  // getInteractionExportUrl,
  getInteractionListUrl,
  getGlobalInteractionListUrl,
  getGlobalInteractionExportUrl,
} from '../urls/interactions-url';
import { buildQueryString } from '../../../admin/service';

export const exportInteractions = async (
  params: InteractionListURLParams
): Promise<void> => {
  try {
    const filename = 'project_interactions.xlsx';
    const response =
      await interactionServiceApi.post<ExportInteractionResponse>(
        getInteractionExportUrl(),
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
export const exportAccountInteractions = async (
  params: InteractionListURLParams
): Promise<void> => {
  try {
    const filename = 'account_interactions.xlsx';
    const response =
      await interactionServiceApi.post<ExportInteractionResponse>(
        '/api/interactions/accountInterctions/export',
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
export const exportInteractionsHistory = async (
  params: InteractionListURLParams
): Promise<void> => {
  try {
    const filename = 'interaction_history.xlsx';
    const response =
      await interactionServiceApi.post<ExportInteractionResponse>(
        getInteractionHistoryExportUrl(),
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

export const useExportInteractions = () => {
  return useMutation<void, Error, InteractionListURLParams>({
    mutationFn: (body) => exportInteractions(body),
  });
};

const getInteractionDetailsURL = (
  accountId: string,
  interactionId: string,
  projectFiscalRid: string
) => {
  return `/api/interactions/detail/${accountId}/${interactionId}?project_fiscal_rid=${projectFiscalRid}`;
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
    enabled:
      !!params.account_rid &&
      params.fiscal_year !== undefined &&
      params.fiscal_year !== null &&
      !!shouldFetchList,
  });
};

export const fetchAccountInteractionList = async (
  params: Record<string, unknown>
): Promise<{ interactions: InteractionList[]; count: number }> => {
  const { data } =
    await interactionServiceApi.get<AccountInteractionListResponse>(
      `/api/interactions/accountInterctions/list?${buildQueryString(params)}`
    );
  return {
    interactions: data.data.accountInteractions,
    count: data.data.totalCount,
  };
};

export const useAccountInteractionList = (
  params: Record<string, unknown>,
  shouldFetchList: boolean,
  refreshInteractions?: number
): UseQueryResult<
  { interactions: InteractionList[]; count: number },
  Error
> => {
  return useQuery<{ interactions: InteractionList[]; count: number }, Error>({
    queryKey: ['account-interaction-list', params, refreshInteractions],
    queryFn: () => fetchAccountInteractionList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.account_rid && !!shouldFetchList,
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
    queryFn: () => fetchGlobalInteractionList(params), // Fixed: Use fetchGlobalInteractionList instead of fetchInteractionList
    retry: 0,
    gcTime: 0,
    enabled: !!params.isGlobal,
  });
};

export const fetchGlobalInteractionList = async (
  params: InteractionListURLParams
): Promise<{ interactions: InteractionList[]; count: number }> => {
  const globalPayload = {
    page: params.page,
    limit: params.limit,
    sort: params.sort,
    sort_by: params.sort_by,
    filters: params.filters || {},
    globalFilters: params.globalFilters || {},
    fiscal_year: params.fiscal_year || 0,
  };

  const { data } = await interactionServiceApi.post<InteractionListResponse>(
    getGlobalInteractionListUrl(),
    globalPayload
  );
  return {
    interactions: data.data.interactions,
    count: data.data.totalCount,
  };
};

export const useGlobalInteractionList = (
  params: InteractionListURLParams,
  refreshInteractions?: number
): UseQueryResult<
  { interactions: InteractionList[]; count: number },
  Error
> => {
  return useQuery<{ interactions: InteractionList[]; count: number }, Error>({
    queryKey: ['global-interaction-list', params, refreshInteractions],
    queryFn: () => fetchGlobalInteractionList(params),
    retry: 0,
    gcTime: 0,
    enabled: params.fiscal_year !== undefined && params.fiscal_year !== null,
  });
};

const fetchInteractionDetails = async (
  accountId: string,
  interactionId: string,
  projectFiscalRid: string
): Promise<InteractionDetails> => {
  const response = await interactionServiceApi.get<InteractionDetailsResponse>(
    getInteractionDetailsURL(accountId, interactionId, projectFiscalRid)
  );

  return response.data.data.interactionDetails;
};

export const useInteractionDetails = (
  accountId?: string,
  interactionId?: string,
  projectFiscalRid?: string
): UseQueryResult<InteractionDetails | undefined, Error> => {
  return useQuery<InteractionDetails | undefined, Error>({
    queryKey: [
      'interaction-details',
      accountId,
      interactionId,
      projectFiscalRid,
    ],
    queryFn: () =>
      fetchInteractionDetails(accountId!, interactionId!, projectFiscalRid!),
    retry: 0,
    gcTime: 0,
    enabled: !!interactionId && !!accountId && !!projectFiscalRid,
  });
};

const fetchAccountInteractionDetails = async (
  accountId: string,
  interactionId: string
): Promise<InteractionDetails> => {
  const response = await interactionServiceApi.get<InteractionDetailsResponse>(
    `/api/interactions/detail/${accountId}/${interactionId}?type=account`
  );

  return response.data.data.interactionDetails;
};

export const useAccountInteractionDetails = (
  accountId?: string,
  interactionId?: string
): UseQueryResult<InteractionDetails | undefined, Error> => {
  return useQuery<InteractionDetails | undefined, Error>({
    queryKey: ['interaction-details', accountId, interactionId],
    queryFn: () => fetchAccountInteractionDetails(accountId!, interactionId!),
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

// Send interaction
export const accountSendInteraction = async (
  body: AccountSendInteractionPayload
): Promise<CommonApiResponse> => {
  try {
    const { data } = await interactionServiceApi.post<CommonApiResponse>(
      '/api/interactions/accountInterctions/send',
      body
    );
    return data;
  } catch (error) {
    console.error('Error sending interaction:', error);
    throw error;
  }
};
export const useAccountSendInteraction = () => {
  return useMutation<CommonApiResponse, Error, AccountSendInteractionPayload>({
    mutationFn: (body) => accountSendInteraction(body),
  });
};

export const exportGlobalInteractions = async (
  params: InteractionListURLParams
): Promise<void> => {
  try {
    const filename = 'global_interactions.xlsx';
    console.log('params', params);
    const response =
      await interactionServiceApi.post<ExportInteractionResponse>(
        getGlobalInteractionExportUrl(),
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
