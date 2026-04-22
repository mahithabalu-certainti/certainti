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
  InteractionTemplatePayload,
  InteractionTemplateList,
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
  getInteractionListReminderUrl,
} from '../urls/interactions-url';
import {
  AssessmentSourceResponse,
  InteractionKeyContactResponse,
  InteractionKeyContacts,
  InteractionProjectKeyContacts,
} from '../../types/interactions';

export const exportInteractions = async (
  params: InteractionListURLParams
): Promise<void> => {
  try {
    const filename =
      params.flag === 'case'
        ? 'case_interaction.xlsx'
        : 'project_interactions.xlsx';
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
  params: Record<string, unknown>
): Promise<void> => {
  try {
    const filename = 'account_interactions.xlsx';
    const response =
      await interactionServiceApi.post<ExportInteractionResponse>(
        `/api/interactions/export`,
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
): Promise<{
  interactions: InteractionList[];
  count: number;
  keyContact: InteractionKeyContacts;
}> => {
  const { data } = await interactionServiceApi.post<InteractionListResponse>(
    getInteractionListUrl(),
    params
  );

  return {
    interactions: data.data.interactions,
    count: data.data.totalCount,
    keyContact: data.data.keyContact,
  };
};
export const fetchInteractionListReminder = async (
  params: InteractionListURLParams
): Promise<{ interactions: InteractionList[]; count: number }> => {
  const { data } = await interactionServiceApi.post<InteractionListResponse>(
    getInteractionListReminderUrl(),
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
  {
    interactions: InteractionList[];
    count: number;
    keyContact: InteractionKeyContacts;
  },
  Error
> => {
  return useQuery<
    {
      interactions: InteractionList[];
      count: number;
      keyContact: InteractionKeyContacts;
    },
    Error
  >({
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

const normalizeStatusName = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

const fetchProjectsCountByStatus = async (
  params: Omit<InteractionListURLParams, 'page' | 'limit'>,
  statuses: string[]
): Promise<number> => {
  const pageSize = 200;
  const maxPages = 50;
  let totalRecords = 0;
  const uniqueProjectIds = new Set<string>();
  const statusSet = new Set(
    statuses.map((status) => normalizeStatusName(status)).filter(Boolean)
  );

  for (let currentPage = 1; currentPage <= maxPages; currentPage += 1) {
    const response = await fetchInteractionList({
      ...params,
      page: currentPage,
      limit: pageSize,
    });

    const interactions = Array.isArray(response.interactions)
      ? response.interactions
      : [];
    totalRecords = Math.max(totalRecords, Number(response.count) || 0);

    interactions.forEach((interaction) => {
      const statusName = normalizeStatusName(String(interaction.status_name || ''));
      if (statusSet.size > 0 && !statusSet.has(statusName)) {
        return;
      }

      const projectId =
        interaction.project_fiscal_rid ||
        interaction.project_rid ||
        interaction.project_code ||
        '';
      if (projectId) {
        uniqueProjectIds.add(projectId);
      }
    });

    if (interactions.length === 0) {
      break;
    }

    const hasMore =
      totalRecords > 0
        ? currentPage * pageSize < totalRecords
        : interactions.length === pageSize;
    if (!hasMore) {
      break;
    }
  }

  return uniqueProjectIds.size;
};

export const useCaseSentProjectsCount = (
  params: Omit<InteractionListURLParams, 'page' | 'limit'>,
  shouldFetchCount: boolean
): UseQueryResult<number, Error> => {
  return useQuery<number, Error>({
    queryKey: ['case-sent-projects-count', params],
    queryFn: () => fetchProjectsCountByStatus(params, ['sent']),
    retry: 0,
    gcTime: 0,
    enabled:
      !!params.account_rid &&
      !!params.case_rid &&
      params.fiscal_year !== undefined &&
      params.fiscal_year !== null &&
      !!shouldFetchCount,
  });
};

export const useAccountSentProjectsCount = (
  params: Omit<InteractionListURLParams, 'page' | 'limit'>,
  shouldFetchCount: boolean
): UseQueryResult<number, Error> => {
  return useAccountProjectsCountByStatus(params, shouldFetchCount, ['sent']);
};

export const useAccountProjectsCountByStatus = (
  params: Omit<InteractionListURLParams, 'page' | 'limit'>,
  shouldFetchCount: boolean,
  statuses: string[]
): UseQueryResult<number, Error> => {
  const normalizedStatuses = statuses
    .map((status) => normalizeStatusName(status))
    .sort();

  return useQuery<number, Error>({
    queryKey: ['account-projects-count-by-status', params, normalizedStatuses],
    queryFn: () => fetchProjectsCountByStatus(params, normalizedStatuses),
    retry: 0,
    gcTime: 0,
    enabled:
      !!params.account_rid &&
      params.fiscal_year !== undefined &&
      params.fiscal_year !== null &&
      !!shouldFetchCount,
  });
};
export const useInteractionListModel = (
  params: InteractionListURLParams,
  shouldFetchList: boolean,
  refreshInteractions?: number
): UseQueryResult<
  { interactions: InteractionList[]; count: number },
  Error
> => {
  return useQuery<{ interactions: InteractionList[]; count: number }, Error>({
    queryKey: ['interaction-list', params, refreshInteractions],
    queryFn: () => fetchInteractionListReminder(params),
    retry: 0,
    gcTime: 0,
    enabled:
      !!params.account_rid &&
      params.fiscal_year !== undefined &&
      params.fiscal_year !== null &&
      !!shouldFetchList &&
      params.reminder_specific_list,
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

const getInteractionProjectListURL = (accountId: string, caseId: string) => {
  const params = new URLSearchParams({
    accountId,
    caseId,
  });
  return `/api/interactions/case/keyContact?${params.toString()}`;
};

const fetchInteractionProjectList = async (
  accountId: string,
  caseId: string
): Promise<InteractionProjectKeyContacts[] | undefined> => {
  const response =
    await interactionServiceApi.get<InteractionKeyContactResponse>(
      getInteractionProjectListURL(accountId, caseId)
    );

  return response?.data?.data?.keyContacts;
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
export const useInteractionProjectList = (
  accountId?: string,
  caseId?: string
): UseQueryResult<InteractionProjectKeyContacts[] | undefined, Error> => {
  return useQuery<InteractionProjectKeyContacts[] | undefined, Error>({
    queryKey: ['interaction-project-details', accountId, caseId],
    queryFn: () => fetchInteractionProjectList(accountId!, caseId!),
    retry: 0,
    gcTime: 0,
    enabled: !!caseId && !!accountId,
  });
};

const fetchAccountInteractionDetails = async (
  accountId: string,
  interactionId: string
): Promise<InteractionDetails> => {
  const response = await interactionServiceApi.get<InteractionDetailsResponse>(
    `/api/interactions/detail/${accountId}/${interactionId}`
  );

  return response.data.data.interactionDetails;
};

export const useAccountInteractionDetails = (
  accountId?: string,
  interactionId?: string,
  isEnable?: boolean
): UseQueryResult<InteractionDetails | undefined, Error> => {
  return useQuery<InteractionDetails | undefined, Error>({
    queryKey: [
      'accoun-interaction-details',
      accountId,
      interactionId,
      isEnable,
    ],
    queryFn: () => fetchAccountInteractionDetails(accountId!, interactionId!),
    retry: 0,
    gcTime: 0,
    enabled: !!interactionId && !!accountId && isEnable,
  });
};

const fetchInteractionTemplateDetails = async (
  interactionId: string
): Promise<InteractionDetails> => {
  const response = await interactionServiceApi.get<InteractionDetailsResponse>(
    `/api/interactionTemplates/detail/${interactionId}`
  );

  return response.data.data.interactionDetails;
};
export const useGetInteractionTemplateDetails = (
  interactionId: string
): UseQueryResult<InteractionDetails | undefined, Error> => {
  return useQuery<InteractionDetails | undefined, Error>({
    queryKey: ['interaction-template-details', interactionId],
    queryFn: () => fetchInteractionTemplateDetails(interactionId),
    retry: 0,
    gcTime: 0,
    enabled: !!interactionId,
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

export const accountCreateInteraction = async (
  body: Partial<InteractionFormPayload>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await interactionServiceApi.post<CommonApiResponse>(
      '/api/interactions/accountInterctions/create',
      body
    );
    return data;
  } catch (error) {
    console.error('Error create interaction:', error);
    throw error;
  }
};

export const useAccountCreateInteraction = () => {
  return useMutation<CommonApiResponse, Error, Partial<InteractionFormPayload>>(
    {
      mutationFn: (body) => accountCreateInteraction({ ...body }),
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

export const getInteractionTemplate = async (
  body: InteractionTemplatePayload
): Promise<{ interactions: InteractionTemplateList[]; count: number }> => {
  try {
    const { data } = await interactionServiceApi.post<{
      data: {
        interactions: InteractionTemplateList[];
        count: number;
      };
    }>('/api/interactionTemplates/list', body);
    return data.data;
  } catch (error) {
    console.error('Error updating interaction details:', error);
    throw error;
  }
};

export const useGetInteractionTemplate = () => {
  return useMutation<
    { interactions: InteractionTemplateList[]; count: number },
    Error,
    InteractionTemplatePayload
  >({
    mutationFn: (body) => getInteractionTemplate({ ...body }),
  });
};

// Interaction Status Update
export interface InteractionStatusUpdatePayload {
  rid: string;
  status_name: string;
  account_rid: string;
}

export const updateInteractionStatus = async (
  body: InteractionStatusUpdatePayload
): Promise<CommonApiResponse> => {
  try {
    const { data } = await interactionServiceApi.post<CommonApiResponse>(
      '/api/interactions/fourPartAssessment/update',
      body
    );
    return data;
  } catch (error) {
    console.error('Error updating interaction status:', error);
    throw error;
  }
};

export const useUpdateInteractionStatus = () => {
  return useMutation<CommonApiResponse, Error, InteractionStatusUpdatePayload>({
    mutationFn: (body) => updateInteractionStatus(body),
  });
};

export const fetchAssessmentSource =
  async (): Promise<AssessmentSourceResponse> => {
    try {
      const { data } =
        await interactionServiceApi.get<AssessmentSourceResponse>(
          '/api/interactions/assessmentSource'
        );
      return data;
    } catch (error) {
      console.error('Error fetching assessment source:', error);
      throw error;
    }
  };

export const useGetAssessmentSource = () => {
  return useQuery<AssessmentSourceResponse, Error>({
    queryKey: ['interaction-assessment-source'],
    queryFn: () => fetchAssessmentSource(),
    retry: 0,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};
