import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { resourceServiceApi } from '../../../api/api';
import {
  AttachmentExportListURL,
  uploadAttachmentUrl,
} from '../urls/attachment-url';
import { AttachmentListURL } from '../urls/attachment-url';
import {
  AttachmentList,
  AttachmentListResponse,
  AttachmentsListExportParams,
  AttachmentsListURLParams,
  AttachmentUploadPayload,
} from '../../types/attachment';

export const fetchAttachmentList = async (
  params: AttachmentsListURLParams
): Promise<{ attachments: AttachmentList[]; count: number }> => {
  const response = await resourceServiceApi.get<AttachmentListResponse>(
    AttachmentListURL(params)
  );
  return {
    attachments: response.data.data.attachments,
    count: response.data.data.count || response.data.data.totalCount,
  };
};

export const useAttachmentList = (
  params: AttachmentsListURLParams,
  refreshAttachments?: number
): UseQueryResult<{ attachments: AttachmentList[]; count: number }, Error> => {
  return useQuery<{ attachments: AttachmentList[]; count: number }, Error>({
    queryKey: ['attachmentList', params, refreshAttachments],
    queryFn: () => fetchAttachmentList(params),
    retry: 0,
    gcTime: 0,
    enabled:
      !!params.attachmentLevel && !!params.accountRid && !!params.entityId,
  });
};

export const fetchAllAttachmentList = async (
  params: AttachmentsListURLParams
): Promise<{ attachments: AttachmentList[]; count: number }> => {
  const payload = {
    page: params.page,
    limit: params.limit,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    fiscalYear: params.fiscalYear,
    filters: params.filters,
    globalFilters: params.globalFilters,
    search: params.search,
  };

  const response = await resourceServiceApi.post<AttachmentListResponse>(
    '/api/attachment/list/summary',
    payload
  );

  return {
    attachments: response.data.data.attachments,
    count: response.data.data.count || response.data.data.totalCount,
  };
};

export const useAllAttachmentList = (
  params: AttachmentsListURLParams,
  refreshTrigger?: number
): UseQueryResult<{ attachments: AttachmentList[]; count: number }, Error> => {
  return useQuery<{ attachments: AttachmentList[]; count: number }, Error>({
    queryKey: ['allAttachmentList', params, refreshTrigger],
    queryFn: () => fetchAllAttachmentList(params),
    retry: 0,
    gcTime: 0,
  });
};

export const attachmentFileUpload = async (
  payload: AttachmentUploadPayload
) => {
  const formData = new FormData();
  formData.append('attachment', payload.attachment);
  formData.append('account_rid', payload.account_rid);
  formData.append('attach_to', payload.attach_to);
  formData.append('attachment_level', payload.attachment_level);
  formData.append('fiscal_year', payload.fiscal_year);
  formData.append('document_category_rid', payload.document_category_rid);
  formData.append('document_type_rid', payload.document_type_rid);
  formData.append(
    'document_category_others',
    payload.document_category_others || ''
  );
  formData.append('document_type_others', payload.document_type_others || '');
  formData.append('comments', payload.comments || '');

  const response = await resourceServiceApi.post(
    uploadAttachmentUrl(),
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response;
};

type ExportType = 'attachments' | 'all_attachments';
export const exportAttachmentsData = async (
  type: ExportType,
  params: AttachmentsListExportParams,
  fileName?: string
) => {
  let url = '';
  let filename = '';

  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  switch (type) {
    case 'attachments':
      url = AttachmentExportListURL({ ...params, timezone: systemTimezone });
      filename =
        fileName || `${params.attachmentLevel}_attachments_records.xlsx`;
      break;
    case 'all_attachments':
      url = `/api/attachment/list/summaryExport`;
      filename = `all_attachments_records.xlsx`;
      break;
    default:
      console.error('Invalid export type');
      return;
  }

  try {
    let response;

    if (type === 'all_attachments') {
      // POST
      const payload = {
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        fiscalYear: params.fiscalYear,
        filters: params.filters,
        globalFilters: params.globalFilters,
        search: params.search,
        timezone: systemTimezone,
      };

      response = await resourceServiceApi.post(url, payload);
    } else {
      // GET
      response = await resourceServiceApi.get(url);
    }

    const base64Data = response.data?.data;

    if (!base64Data) {
      console.error('No base64 data found in the response.');
      return;
    }

    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

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
