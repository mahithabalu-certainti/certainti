import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';

import {
  InteractionDetailsHistoryResponse,
  InteractionListURLParams,
  InteractionQuestionResUpdateRequest,
  InteractionQuestionResUpdateResponse,
  ResponseInteractionList,
  ResponseInteractionListResponse,
  ResponseListURLParams,
  UploadInteractionAttachmentRequest,
  UploadInteractionAttachmentResponse,
} from '../../types';
// import { mockResponse } from '../../pages/project/project-details/interactions/response-history/mockresponse';
import { interactionServiceApi } from '../../../api/api';
import {
  getInteractionResponseHistoryDetailsURL,
  getInteractionResponseHistroyListUrl,
} from '../urls';

export const fetchInteractionList = async (
  params: InteractionListURLParams
): Promise<{ interactions: ResponseInteractionList[]; count: number }> => {
  // console.log('interaction-params', params);
  // await new Promise((resolve) => setTimeout(resolve, 3000));
  const { data } =
    await interactionServiceApi.post<ResponseInteractionListResponse>(
      getInteractionResponseHistroyListUrl(),
      params
    );

  return {
    interactions: data.data.response_history,
    count: data.data.totalCount,
  };
};
export const useInteractionResponseHistoryList = (
  params: InteractionListURLParams
  // shouldFetchList: boolean,
  // refreshInteractions?: number
): UseQueryResult<
  { interactions: ResponseInteractionList[]; count: number },
  Error
> => {
  return useQuery<
    { interactions: ResponseInteractionList[]; count: number },
    Error
  >({
    queryKey: ['interaction-list', params],
    queryFn: () => fetchInteractionList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.account_rid && !!params.fiscal_year,
  });
};

const fetchResponseInteractionDetails = async (
  params: ResponseListURLParams
): Promise<InteractionDetailsHistoryResponse> => {
  const response =
    await interactionServiceApi.post<InteractionDetailsHistoryResponse>(
      getInteractionResponseHistoryDetailsURL(),
      params
    );
  return response.data;
};

export const useResponseInteractionDetails = (
  params: ResponseListURLParams
): UseQueryResult<InteractionDetailsHistoryResponse | undefined, Error> => {
  return useQuery<InteractionDetailsHistoryResponse | undefined, Error>({
    queryKey: ['response-interaction-details', params],
    queryFn: () => fetchResponseInteractionDetails(params),
    retry: 0,
    gcTime: 0,
    enabled:
      !!params.account_rid && !!params.interaction_rid && !!params.version,
  });
};

// Edit Interaction Question Response
export const updateInteractionQuestionResponse = async (
  body: InteractionQuestionResUpdateRequest
): Promise<InteractionQuestionResUpdateResponse> => {
  try {
    const { data } =
      await interactionServiceApi.put<InteractionQuestionResUpdateResponse>(
        '/api/interactions/updateResponse',
        body
      );
    return data;
  } catch (error) {
    console.error('Error updating interaction response:', error);
    throw error;
  }
};

export const useUpdateInteractionQuestionResponse = () => {
  return useMutation<
    InteractionQuestionResUpdateResponse,
    Error,
    InteractionQuestionResUpdateRequest
  >({
    mutationFn: (body) => updateInteractionQuestionResponse(body),
  });
};

// Upload Interaction Attachment

export const uploadInteractionAttachmentUrl = () =>
  `/api/interactions/uploadAttachment`;

export const uploadInteractionAttachment = async (
  body: UploadInteractionAttachmentRequest
): Promise<UploadInteractionAttachmentResponse> => {
  try {
    const formData = new FormData();
    formData.append('account_rid', body.account_rid);
    formData.append('project_rid', body.project_rid);
    formData.append('interaction_rid', body.interaction_rid);
    formData.append('file', body.file);

    const response = await interactionServiceApi.post(
      uploadInteractionAttachmentUrl(),
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error uploading attachment:', error);
    throw error;
  }
};

export const useUploadInteractionAttachment = () => {
  return useMutation<
    UploadInteractionAttachmentResponse,
    Error,
    UploadInteractionAttachmentRequest
  >({
    mutationFn: (body) => uploadInteractionAttachment(body),
  });
};
