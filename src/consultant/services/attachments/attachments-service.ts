import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { resourceServiceApi } from '../../../api/api';
import { AttachmentListURL } from '../urls/attachment-url';
import { attachmentUploadUrl } from '../urls';
import {
  AttachmentList,
  AttachmentListResponse,
  AttachmentsListURLParams,
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
