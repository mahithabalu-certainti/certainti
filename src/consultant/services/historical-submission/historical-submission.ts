import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import { caseServiceApi } from '../../../api/api';
import {
  HistoricalSubmissionPayload,
  HistoricalSubmissionResponse,
  HistorySubmission,
} from '../../types/history-submission';
import { CommonApiResponse } from '../../../common-service';

const fetchChecklistDetails = async (
  accountId: string
): Promise<HistorySubmission[]> => {
  const response = await caseServiceApi.get<HistoricalSubmissionResponse>(
    `api/historicalSubmission/list/?account_rid=${accountId}`
  );

  return response.data.data.historicalSubmissions;
};

export const useGetHistoricalSubmission = (
  accountId?: string
): UseQueryResult<HistorySubmission[] | undefined, Error> => {
  return useQuery<HistorySubmission[] | undefined, Error>({
    queryKey: ['history-submission', accountId],
    queryFn: () => {
      if (!accountId) {
        return Promise.resolve(undefined);
      }
      return fetchChecklistDetails(accountId);
    },
    retry: 0,
    gcTime: 0,
    enabled: !!accountId,
  });
};

const updateHistory = async (
  body: HistoricalSubmissionPayload
): Promise<CommonApiResponse> => {
  try {
    const response = await caseServiceApi.post<CommonApiResponse>(
      '/api/historicalSubmission/add',
      body
    );

    return response.data;
  } catch (error) {
    console.error('Error updating case team:', error);
    throw error;
  }
};
export const useUpdateHistorySubmission = () => {
  return useMutation<CommonApiResponse, Error, HistoricalSubmissionPayload>({
    mutationFn: (body) => updateHistory(body),
  });
};
