import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import { caseServiceApi } from '../../../api/api';
import {
  CaseDetails,
  CaseFilingTypeResponse,
  CaseFormPayload,
  CaseList,
  CaseListParams,
  ExportCaseListResponse,
} from '../../types/cases';
import { CommonApiResponse } from '../../../common-service';
// import { CaseDetailsResponse } from '../../types';
import {
  CaseDetailsMockData,
  CaseListMockData,
} from '../../mockdata/case-mockdata';

// List
export const getCaseListUrl = (): string => '/api/cases/list';

export const fetchCaseList = async (
  params: CaseListParams
): Promise<{ cases: CaseList[]; count: number }> => {
  // Actual API call (uncomment when ready)
  // const { data } = await caseServiceApi.post<CaseListResponse>(
  //   getCaseListUrl(),
  //   params
  // );
  // return {
  //   cases: data.data.cases,
  //   count: data.data.totalCount,
  // };

  console.log('case-list-params', params);
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Mock data fallback
  return {
    cases: CaseListMockData.data.caseInfo,
    count: CaseListMockData.data.count,
  };
};

export const useCaseList = (
  params: CaseListParams,
  refresh?: number
): UseQueryResult<{ cases: CaseList[]; count: number }, Error> => {
  return useQuery<{ cases: CaseList[]; count: number }, Error>({
    queryKey: ['case-list', params, refresh],
    queryFn: () => fetchCaseList(params),
    retry: 0,
    gcTime: 0,
  });
};

// Details
export const getCaseDetailsUrl = (caseId: string): string => {
  return `/api/cases/detail/${caseId}`;
};

export const fetchCaseDetails = async (
  caseId: string
): Promise<CaseDetails> => {
  // Actual API call
  // const response = await caseServiceApi.get<CaseDetailsResponse>(
  //   getCaseDetailsUrl(caseId)
  // );
  // return response.data.data.caseDetails;

  console.log('case-details-params', caseId);
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Mock return (replace with actual API data above)
  return CaseDetailsMockData.data.caseDetails;
};

export const useCaseDetails = (
  caseId: string
): UseQueryResult<CaseDetails | undefined, Error> => {
  return useQuery<CaseDetails | undefined, Error>({
    queryKey: ['case-details', caseId],
    queryFn: () => fetchCaseDetails(caseId),
    retry: 0,
    gcTime: 0,
    enabled: !!caseId,
  });
};

// Create & Edit Case
export const getCreateCaseUrl = (): string => {
  return `/api/cases/new`;
};

export const createCase = async (
  body: Partial<CaseFormPayload>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await caseServiceApi.post<CommonApiResponse>(
      getCreateCaseUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error creating case:', error);
    throw error;
  }
};

export const useCreateCase = () => {
  return useMutation<CommonApiResponse, Error, Partial<CaseFormPayload>>({
    mutationFn: (body) => createCase({ ...body }),
  });
};

export const getUpdateCaseUrl = (): string => {
  return `/api/cases/update`;
};

export const updateCaseDetails = async (
  body: Partial<CaseFormPayload>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await caseServiceApi.put<CommonApiResponse>(
      getUpdateCaseUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error updating case details:', error);
    throw error;
  }
};

export const useUpdateCaseDetails = () => {
  return useMutation<CommonApiResponse, Error, Partial<CaseFormPayload>>({
    mutationFn: (body) => updateCaseDetails({ ...body }),
  });
};

// Export
export const getCaseExportUrl = (): string => '/api/cases/export';

export const exportCaseList = async (params: CaseListParams): Promise<void> => {
  try {
    const filename = `cases_list.xlsx`;

    const response = await caseServiceApi.post<ExportCaseListResponse>(
      getCaseExportUrl(),
      params
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
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Export failed:', error);
  }
};

// Case filling type
export const getCaseFilingTypeUrl = (): string => '/api/cases/caseFilingType';

export const fetchCaseFilingTypes =
  async (): Promise<CaseFilingTypeResponse> => {
    try {
      const { data } = await caseServiceApi.get<CaseFilingTypeResponse>(
        getCaseFilingTypeUrl()
      );
      return data;
    } catch (error) {
      console.error('Error fetching case filing types:', error);
      throw error;
    }
  };

export const useGetCaseFilingTypes = () => {
  return useQuery<CaseFilingTypeResponse, Error>({
    queryKey: ['case-filing-types'],
    queryFn: fetchCaseFilingTypes,
    retry: 0,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};
