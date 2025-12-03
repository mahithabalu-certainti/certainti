import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import { caseServiceApi } from '../../../api/api';
import {
  HistoricalSubmissionPayload,
  HistorySubmissionFormResponse,
  HistoricalSubmissionResponse,
  HistorySubmission,
} from '../../types/history-submission';

const fetchChecklistDetails = async (
  accountId: string,
  countryId: string,
  regionId?: string
): Promise<HistorySubmission[]> => {
  let url = `api/historicalSubmission/list?account_rid=${accountId}&country_rid=${countryId}`;

  // Add region parameter if provided
  if (regionId) {
    url += `&state_rid=${regionId}`;
  }

  const response = await caseServiceApi.get<HistoricalSubmissionResponse>(url);
  return response.data.data.historicalSubmissions;
};

export const useGetHistoricalSubmission = (
  accountId?: string,
  countryId?: string,
  regionId?: string
): UseQueryResult<HistorySubmission[] | undefined, Error> => {
  return useQuery<HistorySubmission[] | undefined, Error>({
    queryKey: ['history-submission', accountId, countryId, regionId],
    queryFn: () => {
      if (!accountId || !countryId) {
        return Promise.resolve(undefined);
      }
      return fetchChecklistDetails(accountId, countryId, regionId);
    },
    retry: 0,
    gcTime: 0,
    enabled: !!accountId && !!countryId,
  });
};

const updateHistory = async (
  body: HistoricalSubmissionPayload
): Promise<HistorySubmissionFormResponse> => {
  try {
    const response = await caseServiceApi.post<HistorySubmissionFormResponse>(
      '/api/historicalSubmission/add',
      body
    );

    return response.data;
  } catch (error) {
    console.error('Error updating historical submission:', error);
    throw error;
  }
};
export const useUpdateHistorySubmission = () => {
  return useMutation<
    HistorySubmissionFormResponse,
    Error,
    HistoricalSubmissionPayload
  >({
    mutationFn: (body) => updateHistory(body),
  });
};
