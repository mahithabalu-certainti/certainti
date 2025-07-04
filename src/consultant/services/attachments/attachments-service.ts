import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  AttachmentList,
  AttachmentListResponse,
  AttachmentsListURLParams,
} from '../../types/attchment';
import { api } from '../../../api/api';
import { AttachmentListURL } from '../urls/attachment-url';
import { attachmentUploadUrl } from '../urls';

export const fetchResourceList = async (
  params: AttachmentsListURLParams
): Promise<{ resource: AttachmentList[]; count: number }> => {
  const response = await api.get<AttachmentListResponse>(
    AttachmentListURL(params)
  );
  return {
    resource: response.data.data.resources,
    count: response.data.data.count,
  };
};

export const useAttachmentList = (
  params: AttachmentsListURLParams,
  isResourceViewAllEnable?: boolean,
  refreshTrigger?: number
): UseQueryResult<{ resource: AttachmentList[]; count: number }, Error> => {
  return useQuery<{ resource: AttachmentList[]; count: number }, Error>({
    queryKey: ['resourceList', params, refreshTrigger],
    queryFn: () => fetchResourceList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.accountNumber && isResourceViewAllEnable,
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const uploadAttachmentFile = async (payload: any) => {
  const response = await api.post(attachmentUploadUrl(), payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response;
};
