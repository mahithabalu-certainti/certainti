import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  // NotesListResponse,
  NotesListURLParams,
  NotesList,
  NoteDetails,
  // NotesFormDataPayload,
  // NoteDetailsResponse,
} from '../../types/notes';
// import { NotesListURL } from '../urls/notes-url';
// import { resourceServiceApi } from '../../../api/api';
import {
  NoteDetailsMockResponse,
  NotesListMockResponse,
} from '../../../admin/mockdata/notes-mock-data';
import { createNoteUrl, updateNoteUrl } from '../urls/notes-url';
import { useApiMutation } from '../../../api/mutation';

export const fetchNotesList = async (
  params: NotesListURLParams
): Promise<{ notes: NotesList[]; count: number }> => {
  console.log('Notes params', params);
  // const response = await resourceServiceApi.get<NotesListResponse>(
  //   NotesListURL(params)
  // );
  // return {
  //   notes: response.data.data.notes,
  //   count: response.data.data.totalCount,
  // };
  await new Promise((resolve) => setTimeout(resolve, 3000));

  return {
    notes: NotesListMockResponse.data.notes,
    count: NotesListMockResponse.data.totalCount,
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
      !!params.noteLevel &&
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
    queryFn: () => fetchNotesList(params),
    retry: 0,
    gcTime: 0,
  });
};

const fetchNoteDetails = async (
  entityId: string,
  noteId: string
): Promise<NoteDetails> => {
  // const response = await resourceServiceApi.get<NoteDetailsResponse>(
  //   `/api/notes/detail/${entityId}/${noteId}`
  // );

  // return response.data.data.noteDetails;
  console.log('details-params', entityId, noteId);
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return NoteDetailsMockResponse.data.noteDetails;
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
  return useApiMutation<unknown, FormData>(createNoteUrl(), 'post');
};

export const useUpdateNote = () => {
  return useApiMutation<unknown, FormData>(updateNoteUrl(), 'put');
};

// export const useCreateNote = async (payload: NotesFormDataPayload) => {
//   const formData = new FormData();
//   formData.append('attachment', payload.attachment);
//   formData.append('entity_level', payload.entity_level);
//   formData.append('entity_id', payload.entity_id);
//   formData.append('title', payload.title);
//   formData.append('note_owner', payload.note_owner);
//   formData.append('note_description', payload.note_description);

//   const response = await resourceServiceApi.post(createNoteUrl(), formData, {
//     headers: {
//       'Content-Type': 'multipart/form-data',
//     },
//   });
//   return response;
// };

// type ExportType = 'attachments' | 'all_attachments';
// export const exportAttachmentsData = async (
//   type: ExportType,
//   params: AttachmentsListExportParams
// ) => {
//   let url = '';
//   let filename = '';

//   switch (type) {
//     case 'attachments':
//       url = AttachmentExportListURL(params);
//       filename = `${params.attachmentLevel}_attachments_records.xlsx`;
//       break;
//     case 'all_attachments':
//       url = AttachmentExportListURL(params);
//       filename = 'all_attachments_records.xlsx';
//       break;
//     default:
//       console.error('Invalid export type');
//       return;
//   }

//   try {
//     const response = await resourceServiceApi.get(url);
//     const base64Data = response.data?.data;

//     if (!base64Data) {
//       console.error('No base64 data found in the response.');
//       return;
//     }

//     const binary = atob(base64Data);
//     const bytes = new Uint8Array(binary.length);
//     for (let i = 0; i < binary.length; i++) {
//       bytes[i] = binary.charCodeAt(i);
//     }

//     const blob = new Blob([bytes], {
//       type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//     });

//     const link = document.createElement('a');
//     link.href = URL.createObjectURL(blob);
//     link.download = filename;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   } catch (error) {
//     console.error('Export failed:', error);
//   }
// };
