import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  TechnicalSummaryDetails,
  TechnicalSummaryDetailsResponse,
  TechnicalSummaryExportListParams,
  TechnicalSummaryList,
  TechnicalSummaryListResponse,
  TechnicalSummaryListURLParams,
  TechnicalSummaryRefinePromptRequest,
  TechnicalSummaryTextUpdateRequest,
  TechnicalSummaryTextUpdateResponse,
} from '../../types';
import {
  getTechnicalSummaryDetailsURL,
  getTechnicalSummaryExportListURL,
  getTechnicalSummaryListURL,
} from '../urls';
import { interactionServiceApi } from '../../../api/api';

export const fetchTechnicalSummaryList = async (
  params: TechnicalSummaryListURLParams
): Promise<{ techSummaryInfo: TechnicalSummaryList[]; count: number }> => {
  const { data } =
    await interactionServiceApi.get<TechnicalSummaryListResponse>(
      getTechnicalSummaryListURL(params)
    );
  return {
    techSummaryInfo: data.data.techSummaryInfo,
    count: data.data.count,
  };
};

export const useTechnicalSummaryList = (
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
  project_fiscal_rid: string,
  case_rid?: string
): Promise<TechnicalSummaryDetails> => {
  const response =
    await interactionServiceApi.get<TechnicalSummaryDetailsResponse>(
      getTechnicalSummaryDetailsURL({
        tech_summary_rid,
        account_rid,
        project_fiscal_rid,
        case_rid,
      })
    );
  return response.data.data;
};

export const useTechnicalSummaryDetails = (
  tech_summary_rid: string,
  account_rid: string,
  project_fiscal_rid: string,
  case_rid?: string
): UseQueryResult<TechnicalSummaryDetails | undefined, Error> => {
  return useQuery<TechnicalSummaryDetails | undefined, Error>({
    queryKey: [
      'technical-summary-details',
      tech_summary_rid,
      account_rid,
      project_fiscal_rid,
      case_rid,
    ],
    queryFn: () =>
      fetchTechnicalSummaryDetails(
        tech_summary_rid,
        account_rid,
        project_fiscal_rid,
        case_rid
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
      await interactionServiceApi.post<TechnicalSummaryTextUpdateResponse>(
        '/api/interactions/refineSummary/save',
        body
      );
    return data;
  } catch (error) {
    console.error('Error updating technical summary text:', error);
    throw error;
  }
};
export const updateRefinePrompt = async (
  body: TechnicalSummaryRefinePromptRequest
): Promise<TechnicalSummaryTextUpdateResponse> => {
  try {
    const { data } =
      await interactionServiceApi.post<TechnicalSummaryTextUpdateResponse>(
        '/api/interactions/refineSummary',
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
export const useUpdateRefinePrompt = () => {
  return useMutation<
    TechnicalSummaryTextUpdateResponse,
    Error,
    TechnicalSummaryRefinePromptRequest
  >({
    mutationFn: (body) => updateRefinePrompt(body),
  });
};

// Export Technical Summary
export const exportTechnicalSummary = async (
  params: TechnicalSummaryExportListParams
) => {
  try {
    const response = await interactionServiceApi.get(
      getTechnicalSummaryExportListURL(params)
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
