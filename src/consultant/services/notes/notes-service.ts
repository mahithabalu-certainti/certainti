import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQuery,
  UseQueryResult,
} from '@tanstack/react-query';
import {
  NotesListResponse,
  NotesListURLParams,
  NotesList,
  NoteDetails,
  NotesListExportParams,
  NoteDetailsResponse,
} from '../../types/notes';
import { resourceServiceApi } from '../../../api/api';
import {
  createNoteUrl,
  NoteExportListURL,
  NotesListURL,
  updateNoteUrl,
} from '../urls/notes-url';

const useApiMutationSericve = <T, V = void>(
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

export const fetchNotesList = async (
  params: NotesListURLParams
): Promise<{ notes: NotesList[]; count: number }> => {
  const response = await resourceServiceApi.get<NotesListResponse>(
    NotesListURL(params)
  );
  return {
    notes: response.data.data.notes,
    count: response.data.data.totalCount,
  };
};

export const fetchAllNotesList = async (
  params: NotesListURLParams
): Promise<{ notes: NotesList[]; count: number }> => {
  const response = await resourceServiceApi.post<NotesListResponse>(
    'api/notes/list/summary',
    {
      page: params.page,
      limit: params.limit,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      fiscalYear: params.fiscalYear,
      filters: params.filters,
      globalFilters: params.globalFilters,
      search: params.search,
    }
  );
  return {
    notes: response.data.data.notes,
    count: response.data.data.totalCount,
  };
};

export const useNotesList = (
  params: NotesListURLParams,
  shouldFetchList: boolean,
  refreshNotes?: number
): UseQueryResult<{ notes: NotesList[]; count: number }, Error> => {
  return useQuery<{ notes: NotesList[]; count: number }, Error>({
    queryKey: ['notesList', params, refreshNotes],
    queryFn: () => fetchNotesList(params),
    retry: 0,
    gcTime: 0,
    enabled:
      !!shouldFetchList &&
      !!params.attachmentLevel &&
      !!params.accountRid &&
      !!params.entityId,
  });
};

export const useAllNotesList = (
  params: NotesListURLParams,
  refreshTrigger?: number
): UseQueryResult<{ notes: NotesList[]; count: number }, Error> => {
  return useQuery<{ notes: NotesList[]; count: number }, Error>({
    queryKey: ['allNotesList', params, refreshTrigger],
    queryFn: () => fetchAllNotesList(params),
    retry: 0,
    gcTime: 0,
  });
};

const fetchNoteDetails = async (
  entityId: string,
  noteId: string
): Promise<NoteDetails> => {
  const response = await resourceServiceApi.get<NoteDetailsResponse>(
    `/api/notes/list/details?account_rid=${entityId}&rid=${noteId}`
  );

  return response.data.data;
};

export const useNoteDetails = (
  entityId?: string,
  noteId?: string,
  isEnable?: boolean
): UseQueryResult<NoteDetails | undefined, Error> => {
  return useQuery<NoteDetails | undefined, Error>({
    queryKey: ['note-details', entityId, noteId, isEnable],
    queryFn: () => fetchNoteDetails(entityId!, noteId!),
    retry: 0,
    gcTime: 0,
    enabled: !!noteId && !!entityId && isEnable,
  });
};

export const useCreateNote = () => {
  return useApiMutationSericve<unknown, FormData>(createNoteUrl(), 'post');
};

export const useUpdateNote = () => {
  return useApiMutationSericve<unknown, FormData>(updateNoteUrl(), 'put');
};

type ExportType = 'notes' | 'all_notes';
export const ExportNotesList = async (
  type: ExportType,
  params: NotesListExportParams
) => {
  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { isGlobal, ...restParams } = params;
  const isGlobalNotes = type === 'all_notes' || isGlobal;

  const filename = isGlobalNotes
    ? 'all_notes_records.xlsx'
    : `${params.attachmentLevel}_notes_records.xlsx`;

  try {
    let response;

    if (isGlobalNotes) {
      // Use POST API for global export
      const url = `/api/notes/list/summaryExport`;
      const body = {
        ...restParams,
        timezone: systemTimezone,
      };
      response = await resourceServiceApi.post(url, body);
    } else {
      // Use GET API for normal export
      const url = NoteExportListURL({ ...params, timezone: systemTimezone });
      response = await resourceServiceApi.get(url);
    }

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
