import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { resourceServiceApi } from '../../../api/api';
import { uploadAttachmentUrl } from '../urls/attachment-url';
import { AttachmentListURL } from '../urls/attachment-url';
import {
  AttachmentList,
  AttachmentListResponse,
  AttachmentsListURLParams,
} from '../../types/attachment';
import { attachmentUploadUrl } from '../urls';

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
    queryKey: ['resourceList', params, refreshAttachments],
    queryFn: () => fetchAttachmentList(params),
    retry: 0,
    gcTime: 0,
    enabled:
      !!params.attachmentLevel && !!params.accountRid && !!params.entityId,
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const uploadAttachmentFile = async (payload: any) => {
  const response = await resourceServiceApi.post(
    attachmentUploadUrl(),
    payload,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response;
};

export const useAllAttachmentList = (
  params: AttachmentsListURLParams,
  refreshTrigger?: number
): UseQueryResult<{ attachments: AttachmentList[]; count: number }, Error> => {
  return useQuery<{ attachments: AttachmentList[]; count: number }, Error>({
    queryKey: ['resourceList', params, refreshTrigger],
    queryFn: () => fetchAttachmentList(params),
    retry: 0,
    gcTime: 0,
  });
};

export const attachmentFileUpload = async (payload: any) => {
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
