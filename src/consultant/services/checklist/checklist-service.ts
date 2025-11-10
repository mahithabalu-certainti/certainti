import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  ChecklistListURLParams,
  ChecklistList,
  ChecklistDetails,
  ChecklistListExportParams,
  ChecklistFormPayload,
  ChecklistStatusResponse,
} from '../../types/checklist';
import { caseServiceApi } from '../../../api/api';
import {
  ChecklistExportListURL,
  getCreateChecklistUrl,
  getUpdateChecklistUrl,
} from '../urls/checklist-url';
import { CommonApiResponse } from '../../../common-service';
import {
  ChecklistTemplateList,
  ChecklistTemplateListParams,
  ChecklistTemplateDetails,
} from '../../../admin/types';
import {
  ChecklistDetailsMockData,
  ChecklistListMockData,
} from '../../mockdata/checklist-mock';

// -------------------- LIST FETCHING --------------------

export const fetchChecklistList = async (
  params: ChecklistListURLParams
): Promise<{ checklists: ChecklistList[]; count: number }> => {
  // const response = await caseServiceApi.get<ChecklistListResponse>(
  //   ChecklistListURL(params)
  // );
  // return {
  //   checklists: response.data.data.checklists,
  //   count: response.data.data.totalCount,
  // };
  console.log('Checklist List params:', params);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return {
    checklists: ChecklistListMockData.data.checklists,
    count: ChecklistListMockData.data.totalCount,
  };
};

export const useChecklistList = (
  params: ChecklistListURLParams,
  shouldFetchList: boolean,
  refreshChecklist?: number
): UseQueryResult<{ checklists: ChecklistList[]; count: number }, Error> => {
  return useQuery<{ checklists: ChecklistList[]; count: number }, Error>({
    queryKey: ['checklistList', params, refreshChecklist],
    queryFn: () => fetchChecklistList(params),
    retry: 0,
    gcTime: 0,
    enabled:
      !!shouldFetchList &&
      !!params.attachmentLevel &&
      !!params.accountRid &&
      !!params.entityId,
  });
};

export const useAllChecklistList = (
  params: ChecklistListURLParams,
  refreshTrigger?: number
): UseQueryResult<{ checklists: ChecklistList[]; count: number }, Error> => {
  return useQuery<{ checklists: ChecklistList[]; count: number }, Error>({
    queryKey: ['allChecklistList', params, refreshTrigger],
    queryFn: () => fetchChecklistList(params),
    retry: 0,
    gcTime: 0,
  });
};

// -------------------- DETAILS FETCHING --------------------

const fetchChecklistDetails = async (
  accountId: string,
  checklistId: string
): Promise<ChecklistDetails> => {
  // const response = await caseServiceApi.get<ChecklistDetailsResponse>(
  //   `/api/cases/checklist/detail/${checklistId}?account_rid=${accountId}`
  // );

  // return response.data.data.checklistDetails;
  console.log('check;list-details', accountId, checklistId);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return ChecklistDetailsMockData.data.checklistDetails;
};

export const useChecklistDetails = (
  accountId?: string,
  checklistId?: string,
  isEnable?: boolean
): UseQueryResult<ChecklistDetails | undefined, Error> => {
  return useQuery<ChecklistDetails | undefined, Error>({
    queryKey: ['checklist-details', accountId, checklistId, isEnable],
    queryFn: () => fetchChecklistDetails(accountId!, checklistId!),
    retry: 0,
    gcTime: 0,
    enabled: !!checklistId && !!accountId && isEnable,
  });
};

// -------------------- CREATE / UPDATE --------------------

export const createChecklist = async (
  body: Partial<ChecklistFormPayload>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await caseServiceApi.post<CommonApiResponse>(
      getCreateChecklistUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error creating checklist:', error);
    throw error;
  }
};

export const useCreateChecklist = () => {
  return useMutation<CommonApiResponse, Error, Partial<ChecklistFormPayload>>({
    mutationFn: (body) => createChecklist({ ...body }),
  });
};

export const updateChecklistDetails = async (
  body: Partial<ChecklistFormPayload>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await caseServiceApi.post<CommonApiResponse>(
      getUpdateChecklistUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error updating checklist details:', error);
    throw error;
  }
};

export const useUpdateChecklistDetails = () => {
  return useMutation<CommonApiResponse, Error, Partial<ChecklistFormPayload>>({
    mutationFn: (body) => updateChecklistDetails(body),
  });
};

// -------------------- CHECKLIST TEMPLATES --------------------

// List checklist templates for consultant
export const getConsultantChecklistTemplateListUrl = (
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

export const fetchConsultantChecklistTemplateList = async (
  params: ChecklistTemplateListParams
): Promise<{ checklistTemplates: ChecklistTemplateList[]; count: number }> => {
  const { data } = await caseServiceApi.get(
    getConsultantChecklistTemplateListUrl(params)
  );
  return {
    checklistTemplates: data.data.checklist,
    count: data.data.count,
  };
};

export const useConsultantChecklistTemplateList = (
  params: ChecklistTemplateListParams,
  isEnabled: boolean,
  refresh?: number
): UseQueryResult<
  { checklistTemplates: ChecklistTemplateList[]; count: number },
  Error
> => {
  return useQuery<
    { checklistTemplates: ChecklistTemplateList[]; count: number },
    Error
  >({
    queryKey: ['consultant-checklist-template-list', params, refresh],
    queryFn: () => fetchConsultantChecklistTemplateList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!isEnabled,
  });
};

// Details for consultant checklist template
export const getConsultantChecklistTemplateDetailsURL = (
  templateId: string
) => {
  return `/api/caseManagement/adminChecklist/detail/${templateId}`;
};

export const fetchConsultantChecklistTemplateDetails = async (
  templateId: string
): Promise<ChecklistTemplateDetails> => {
  const response = await caseServiceApi.get(
    getConsultantChecklistTemplateDetailsURL(templateId)
  );
  return response.data.data.checklistDetails;
};

export const useConsultantChecklistTemplateDetails = (
  templateId: string
): UseQueryResult<ChecklistTemplateDetails | undefined, Error> => {
  return useQuery({
    queryKey: ['consultant-checklist-template-details', templateId],
    queryFn: () => fetchConsultantChecklistTemplateDetails(templateId),
    enabled: !!templateId,
    retry: 0,
    gcTime: 0,
  });
};

// -------------------- EXPORT --------------------

type ExportType = 'checklist' | 'all_checklists';

export const ExportChecklistList = async (
  type: ExportType,
  params: ChecklistListExportParams
) => {
  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isGlobalChecklist = type === 'all_checklists';
  const url = ChecklistExportListURL({ ...params, timezone: systemTimezone });
  const filename = isGlobalChecklist
    ? 'all_checklist_records.xlsx'
    : `${params.attachmentLevel}_checklist_records.xlsx`;

  try {
    const response = await caseServiceApi.get(url);
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

// -------------------- CHECKLIST STATUS --------------------

export const getChecklistStatusUrl = (): string => {
  return `/api/cases/checkListStatus`;
};

export const fetchChecklistStatus =
  async (): Promise<ChecklistStatusResponse> => {
    try {
      const { data } = await caseServiceApi.get<ChecklistStatusResponse>(
        getChecklistStatusUrl()
      );
      return data;
    } catch (error) {
      console.error('Error fetching checklist status list:', error);
      throw error;
    }
  };

export const useGetChecklistStatus = () => {
  return useQuery<ChecklistStatusResponse, Error>({
    queryKey: ['get-checklist-status'],
    queryFn: () => fetchChecklistStatus(),
    retry: 0,
    staleTime: Infinity, // Cache data forever until manually invalidated
    gcTime: Infinity, // Never delete from cache
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
};
