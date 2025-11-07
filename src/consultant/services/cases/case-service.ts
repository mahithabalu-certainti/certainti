import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import { caseServiceApi } from '../../../api/api';
import {
  CaseAssignedExportParams,
  CaseDetails,
  CaseDetailsResponse,
  CaseExportResponse,
  CaseFilingTypeResponse,
  CaseFormPayload,
  CaseGlobalList,
  CaseGlobalListResponse,
  CaseList,
  CaseListExportParams,
  CaseListParams,
  CaseListResponse,
  CaseStatusResponse,
  ExportCaseListResponse,
} from '../../types/cases';
import { CommonApiResponse } from '../../../common-service';
import { getCaseExportListURL, getCaseListURL } from '../urls';

// List
export const fetchCaseList = async (
  params: CaseListParams,
  accountId?: string
): Promise<{ cases: CaseList[]; count: number }> => {
  const { data } = await caseServiceApi.get<CaseListResponse>(
    getCaseListURL(params, accountId)
  );
  return {
    cases: data.data.caseInfo,
    count: data.data.count,
  };
};

export const useCaseList = (
  params: CaseListParams,
  accountId?: string,
  refresh?: number
): UseQueryResult<{ cases: CaseList[]; count: number }, Error> => {
  return useQuery<{ cases: CaseList[]; count: number }, Error>({
    queryKey: ['case-list', params, accountId, refresh],
    queryFn: () => fetchCaseList(params, accountId),
    retry: 0,
    gcTime: 0,
    enabled: !!accountId,
  });
};

// Global cases list
export const fetchGlobalCaseList = async (
  params: CaseListParams
): Promise<{ cases: CaseGlobalList[]; count: number }> => {
  const { data } = await caseServiceApi.get<CaseGlobalListResponse>(
    getCaseListURL(params)
  );
  return {
    cases: data.data.caseInfo,
    count: data.data.count,
  };
};
export const useCaseGlobalList = (
  params: CaseListParams,
  refresh?: number
): UseQueryResult<{ cases: CaseGlobalList[]; count: number }, Error> => {
  return useQuery<{ cases: CaseGlobalList[]; count: number }, Error>({
    queryKey: ['case-global-list', params, refresh],
    queryFn: () => fetchGlobalCaseList(params),
    retry: 0,
    gcTime: 0,
    enabled: true,
  });
};

// Details
export const getCaseDetailsUrl = (
  caseId: string,
  accountId: string
): string => {
  return `/api/cases/details/${accountId}/${caseId}`;
};

export const fetchCaseDetails = async (
  caseId: string,
  accountId: string
): Promise<CaseDetails> => {
  // Actual API call
  const response = await caseServiceApi.get<CaseDetailsResponse>(
    getCaseDetailsUrl(caseId, accountId)
  );
  return response.data.data;
};

export const useCaseDetails = (
  caseId: string,
  accountId: string
): UseQueryResult<CaseDetails | undefined, Error> => {
  return useQuery<CaseDetails | undefined, Error>({
    queryKey: ['case-details', caseId, accountId],
    queryFn: () => fetchCaseDetails(caseId, accountId),
    retry: 0,
    gcTime: 0,
    enabled: !!caseId && !!accountId,
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
export const ExportCaseList = async (
  params: CaseListExportParams,
  accountId?: string
): Promise<void> => {
  try {
    const filename = `cases_list.xlsx`;

    const response = await caseServiceApi.get<ExportCaseListResponse>(
      getCaseExportListURL(params, accountId)
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
// Export

export const getCasesProjectExportUrl = () =>
  '/api/cases/assignedProjects/export';

export const ExportAssignedList = async (
  params: CaseAssignedExportParams
): Promise<void> => {
  try {
    const filename = `case-projects.xlsx`;
    const response = await caseServiceApi.post<CaseExportResponse>(
      getCasesProjectExportUrl(),
      params
    );
    console.log('response', response);
    const base64Data = response.data?.data;

    if (!base64Data) {
      console.error('No base64 data found in the response.');
      return;
    }
    if (typeof base64Data !== 'string' || !base64Data) {
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

// Case Status
export const getCaseStatusUrl = (): string => '/api/cases/caseStatus';

export const fetchCaseStatuses = async (): Promise<CaseStatusResponse> => {
  try {
    const { data } =
      await caseServiceApi.get<CaseStatusResponse>(getCaseStatusUrl());
    return data;
  } catch (error) {
    console.error('Error fetching case statuses:', error);
    throw error;
  }
};

export const useGetCaseStatuses = () => {
  return useQuery<CaseStatusResponse, Error>({
    queryKey: ['case-statuses'],
    queryFn: fetchCaseStatuses,
    retry: 0,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};
