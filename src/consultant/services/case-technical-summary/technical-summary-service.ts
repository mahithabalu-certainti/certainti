import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  TechnicalSummaryDetails,
  TechnicalSummaryDetailsResponse,
  TechnicalSummaryExportListParams,
  TechnicalSummaryList,
  TechnicalSummaryListResponse,
  TechnicalSummaryListURLParams,
  TechnicalSummaryTextUpdateRequest,
  TechnicalSummaryTextUpdateResponse,
} from '../../types';
import { getTechnicalSummaryDetailsURL } from '../urls';
import { interactionServiceApi } from '../../../api/api';

export const getCasesTechnicalSummaryListURL = ({
  page,
  limit,
  sortOrder,
  sortBy,
  account_rid,
  case_rid,
  filters,
  type,
}: TechnicalSummaryListURLParams): string => {
  const baseUrl = '/api/interactions/technicalSummary/list';
  const searchParams = new URLSearchParams();

  if (account_rid !== undefined) {
    searchParams.set('account_rid', account_rid.toString());
  }
  if (case_rid !== undefined) {
    searchParams.set('case_rid', case_rid.toString());
  }

  if (page !== undefined) searchParams.set('page', page.toString());
  if (limit !== undefined) searchParams.set('limit', limit.toString());
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (type !== undefined) searchParams.set('summaryType', type);
  if (sortBy !== undefined) searchParams.set('sortBy', sortBy);
  if (sortOrder !== undefined) searchParams.set('sortOrder', sortOrder);
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

export const getCaseTechnicalSummaryExportListURL = ({
  // page,
  // limit,
  sortOrder,
  sortBy,
  account_rid,
  case_rid,
  filters,
  summaryType,
}: TechnicalSummaryExportListParams): string => {
  const baseUrl = '/api/interactions/technicalSummary/export';
  const searchParams = new URLSearchParams();

  if (account_rid !== undefined) {
    searchParams.set('account_rid', account_rid.toString());
  }
  if (case_rid !== undefined) {
    searchParams.set('case_rid', case_rid.toString());
  }

  // if (page !== undefined) searchParams.set('page', page.toString());
  // if (limit !== undefined) searchParams.set('limit', limit.toString());
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (sortBy !== undefined) searchParams.set('sortBy', sortBy);
  if (sortOrder !== undefined) searchParams.set('sortOrder', sortOrder);
  if (summaryType !== undefined) searchParams.set('summaryType', summaryType);

  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

export const fetchTechnicalSummaryList = async (
  params: TechnicalSummaryListURLParams
): Promise<{ techSummaryInfo: TechnicalSummaryList[]; count: number }> => {
  const { data } =
    await interactionServiceApi.get<TechnicalSummaryListResponse>(
      getCasesTechnicalSummaryListURL(params)
    );
  return {
    techSummaryInfo: data.data.techSummaryInfo,
    count: data.data.count,
  };
};

export const useCasesTechnicalSummaryList = (
  params: TechnicalSummaryListURLParams,
  refreshTrigger?: number,
  enabled?: boolean
): UseQueryResult<
  { techSummaryInfo: TechnicalSummaryList[]; count: number },
  Error
> => {
  return useQuery<
    { techSummaryInfo: TechnicalSummaryList[]; count: number },
    Error
  >({
    queryKey: ['technical-summary-list', params, refreshTrigger],
    queryFn: () => fetchTechnicalSummaryList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.account_rid && !!enabled,
  });
};

const fetchTechnicalSummaryDetails = async (
  tech_summary_rid: string,
  account_rid: string,
  project_fiscal_rid: string
): Promise<TechnicalSummaryDetails> => {
  const response =
    await interactionServiceApi.get<TechnicalSummaryDetailsResponse>(
      getTechnicalSummaryDetailsURL({
        tech_summary_rid,
        account_rid,
        project_fiscal_rid,
      })
    );
  return response.data.data;
};

export const useTechnicalSummaryDetails = (
  tech_summary_rid: string,
  account_rid: string,
  project_fiscal_rid: string
): UseQueryResult<TechnicalSummaryDetails | undefined, Error> => {
  return useQuery<TechnicalSummaryDetails | undefined, Error>({
    queryKey: [
      'technical-summary-details',
      tech_summary_rid,
      account_rid,
      project_fiscal_rid,
    ],
    queryFn: () =>
      fetchTechnicalSummaryDetails(
        tech_summary_rid,
        account_rid,
        project_fiscal_rid
      ),
    retry: 0,
    gcTime: 0,
    enabled: !!tech_summary_rid && !!account_rid && !!project_fiscal_rid,
  });
};

// Edit Technical Summary text
export const updateTechnicalSummaryText = async (
  body: TechnicalSummaryTextUpdateRequest
): Promise<TechnicalSummaryTextUpdateResponse> => {
  try {
    const { data } =
      await interactionServiceApi.put<TechnicalSummaryTextUpdateResponse>(
        '/api/interactions/technicalSummary/update',
        body
      );
    return data;
  } catch (error) {
    console.error('Error updating technical summary text:', error);
    throw error;
  }
};

export const useUpdateTechnicalSummaryText = () => {
  return useMutation<
    TechnicalSummaryTextUpdateResponse,
    Error,
    TechnicalSummaryTextUpdateRequest
  >({
    mutationFn: (body) => updateTechnicalSummaryText(body),
  });
};

// Export Technical Summary
export const exportCasesTechnicalSummary = async (
  params: TechnicalSummaryExportListParams
) => {
  try {
    const response = await interactionServiceApi.get(
      getCaseTechnicalSummaryExportListURL(params)
    );
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
    link.download = 'technical_summary.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Export failed:', error);
  }
};
