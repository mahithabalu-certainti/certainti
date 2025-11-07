import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQuery,
  UseQueryResult,
} from '@tanstack/react-query';
import {
  ChecklistListURLParams,
  ChecklistList,
  ChecklistDetails,
  ChecklistListExportParams,
  ChecklistDetailsResponse,
} from '../../types/checklist';
import { resourceServiceApi } from '../../../api/api';
import {
  createChecklistUrl,
  ChecklistExportListURL,
  updateChecklistUrl,
} from '../urls/checklist-url';
import { ChecklistListMockData } from '../../mockdata/checklist-mock';

// Generic mutation service for POST/PUT/PATCH/DELETE
const useApiMutationService = <T, V = void>(
  endpoint: string,
  method: 'post' | 'put' | 'patch' | 'delete' = 'post',
  options?: UseMutationOptions<T, Error, V>
): UseMutationResult<T, Error, V> => {
  return useMutation<T, Error, V>({
    mutationFn: async (data) => {
      const isFormData = data instanceof FormData;

      const response = await resourceServiceApi.request<T>({
        url: endpoint,
        method,
        data,
        headers: isFormData
          ? { 'Content-Type': 'multipart/form-data' }
          : { 'Content-Type': 'application/json' },
      });

      return response.data;
    },
    ...options,
  });
};

// -------------------- LIST FETCHING --------------------

export const fetchChecklistList = async (
  params: ChecklistListURLParams
): Promise<{ checklists: ChecklistList[]; count: number }> => {
  //   const response = await resourceServiceApi.get<ChecklistListResponse>(
  //     ChecklistListURL(params)
  //   );
  //   return {
  //       checklists: response.data.data.checklists,
  //       count: response.data.data.totalCount,
  //     };
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
  entityId: string,
  checklistId: string
): Promise<ChecklistDetails> => {
  const response = await resourceServiceApi.get<ChecklistDetailsResponse>(
    `/api/checklist/list/details?account_rid=${entityId}&rid=${checklistId}`
  );

  return response.data.data;
};

export const useChecklistDetails = (
  entityId?: string,
  checklistId?: string,
  isEnable?: boolean
): UseQueryResult<ChecklistDetails | undefined, Error> => {
  return useQuery<ChecklistDetails | undefined, Error>({
    queryKey: ['checklist-details', entityId, checklistId, isEnable],
    queryFn: () => fetchChecklistDetails(entityId!, checklistId!),
    retry: 0,
    gcTime: 0,
    enabled: !!checklistId && !!entityId && isEnable,
  });
};

// -------------------- CREATE / UPDATE --------------------

export const useCreateChecklist = () => {
  return useApiMutationService<unknown, FormData>(createChecklistUrl(), 'post');
};

export const useUpdateChecklist = () => {
  return useApiMutationService<unknown, FormData>(updateChecklistUrl(), 'put');
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
    const response = await resourceServiceApi.get(url);
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
