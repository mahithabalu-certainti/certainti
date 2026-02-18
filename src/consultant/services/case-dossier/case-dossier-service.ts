import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  ResourceSummaryItem,
  ResourceSummaryListURLParams,
  DossierSummary,
  ClosingRemarksItems,
  ClosingRemarksResponse,
  RDFormResponse,
  ClosingRemarksParams,
  ComputedDataResponse,
  ComputedDataPayload,
  CaseClosePayload,
} from '../../types';
import {
  ResourceSummaryMockData,
  DossierSummaryMockData,
} from '../../mockdata/dossier';
import { caseServiceApi } from '../../../api/api';
import {
  getClosingRemarksListURL,
  getRDFormMapperPreviewURL,
} from '../urls/dossier-url';

// Resource Summary
export const fetchResourceSummaryList = async (
  params?: ResourceSummaryListURLParams
): Promise<{ resourceSummary: ResourceSummaryItem[]; count: number }> => {
  // const response = await caseServiceApi.get<ResourceSummaryListResponse>(
  //   ResourceSummaryListURL(params)
  // );

  // Mock usage
  console.log('resource-summary-list-params', params);
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return {
    resourceSummary: ResourceSummaryMockData.data.resourceSummary,
    count: ResourceSummaryMockData.data.count,
  };
};

export const useResourceSummaryList = (
  params: ResourceSummaryListURLParams,
  refreshList?: number
): UseQueryResult<
  { resourceSummary: ResourceSummaryItem[]; count: number },
  Error
> => {
  return useQuery<
    { resourceSummary: ResourceSummaryItem[]; count: number },
    Error
  >({
    queryKey: ['resource-summary-list', params, refreshList],
    queryFn: () => fetchResourceSummaryList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.accountRid && !!params.caseRid,
  });
};

// Dossier Summary
export const fetchDossierSummary = async (
  accountRid: string,
  caseRid: string
): Promise<DossierSummary> => {
  // const response = await caseServiceApi.get<DossierSummaryResponse>(
  //   `/api/dossier/summary?account_rid=${accountRid}&case_rid=${caseRid}`
  // );

  // Mock usage
  console.log('dossier-summary-params', { accountRid, caseRid });
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return DossierSummaryMockData.data.dossierSummary;
};

export const useDossierSummary = (
  accountRid: string,
  caseRid: string
): UseQueryResult<DossierSummary, Error> => {
  return useQuery<DossierSummary, Error>({
    queryKey: ['dossier-summary', accountRid, caseRid],
    queryFn: () => fetchDossierSummary(accountRid, caseRid),
    retry: 0,
    gcTime: 0,
    enabled: !!accountRid && !!caseRid,
  });
};

export const downloadPdfFromBase64 = (
  base64Data: string,
  filename: string = 'rd-form.pdf'
): void => {
  try {
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

// closing remarks list
export const fetchClosingRemarksList = async (
  params: ClosingRemarksParams
): Promise<{ closingRemarks: ClosingRemarksItems[]; count: number }> => {
  const response = await caseServiceApi.post<ClosingRemarksResponse>(
    getClosingRemarksListURL(),
    params
  );
  return {
    closingRemarks: response.data.data.closing_remarks,
    count: response.data.data.closing_remarks.length,
  };
};

export const useClosingRemarksList = (
  params: ClosingRemarksParams,
  refreshList?: number
): UseQueryResult<
  { closingRemarks: ClosingRemarksItems[]; count: number },
  Error
> => {
  return useQuery<
    { closingRemarks: ClosingRemarksItems[]; count: number },
    Error
  >({
    queryKey: ['closing-remarks-list', params, refreshList],
    queryFn: () => fetchClosingRemarksList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.case_rid && !!params.account_rid,
  });
};

// RD Form Mapper Generate
export const fetchRDFormMapperGenerate = async (
  accountRid: string,
  caseRid: string,
  fiscalYear?: number
): Promise<{
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
}> => {
  const response = await caseServiceApi.post(
    `/api/rdFormMapper/generate`,
    { account_rid: accountRid, case_rid: caseRid, fiscal_year: fiscalYear } // moved to payload
  );
  return response.data;
};

export const useRDFormMapperGenerate = (
  accountRid: string,
  caseRid: string,
  fiscalYear?: number,
  enabled: boolean = true
): UseQueryResult<
  { statusCode: number; statusCodeValue: string; statusMessage: string },
  Error
> => {
  return useQuery<
    { statusCode: number; statusCodeValue: string; statusMessage: string },
    Error
  >({
    queryKey: ['rd-form-mapper-generate', accountRid, caseRid, fiscalYear],
    queryFn: () => fetchRDFormMapperGenerate(accountRid, caseRid, fiscalYear),
    retry: 0,
    gcTime: 0,
    enabled: !!accountRid && !!caseRid && !!fiscalYear && enabled,
  });
};

export const useRDFormMapperGenerateMutation = () => {
  return useMutation<
    { statusCode: number; statusCodeValue: string; statusMessage: string },
    Error,
    { accountRid: string; caseRid: string; fiscalYear?: number }
  >({
    mutationFn: ({ accountRid, caseRid, fiscalYear }) =>
      fetchRDFormMapperGenerate(accountRid, caseRid, fiscalYear),
  });
};

export const fetchRDFormMapperPreview = async (
  accountRid: string,
  caseRid: string,
  countryRid: string,
  isFederal: boolean,
  stateRid?: string
): Promise<RDFormResponse> => {
  const url = getRDFormMapperPreviewURL(
    accountRid,
    caseRid,
    countryRid,
    isFederal,
    stateRid
  );
  const response = await caseServiceApi.get(url);
  return response.data;
};

export const useRDFormMapperPreview = (
  accountRid: string,
  caseRid: string,
  countryRid: string,
  isFederal: boolean,
  stateRid?: string,
  enabled: boolean = true
): UseQueryResult<RDFormResponse, Error> => {
  return useQuery<RDFormResponse, Error>({
    queryKey: [
      'rd-form-mapper-preview',
      accountRid,
      caseRid,
      countryRid,
      isFederal,
      stateRid,
    ],
    queryFn: () =>
      fetchRDFormMapperPreview(
        accountRid,
        caseRid,
        countryRid,
        isFederal,
        stateRid
      ),
    retry: 0,
    gcTime: 0,
    enabled:
      !!accountRid &&
      !!caseRid &&
      !!countryRid &&
      (isFederal || !!stateRid) &&
      enabled,
  });
};

export const useRDFormMapperPreviewMutation = () => {
  return useMutation<
    RDFormResponse,
    Error,
    {
      accountRid: string;
      caseRid: string;
      countryRid: string;
      isFederal: boolean;
      stateRid?: string;
    }
  >({
    mutationFn: ({ accountRid, caseRid, countryRid, isFederal, stateRid }) =>
      fetchRDFormMapperPreview(
        accountRid,
        caseRid,
        countryRid,
        isFederal,
        stateRid
      ),
  });
};

// ComputedData

export const fetchComputedData = async (
  payload: ComputedDataPayload
): Promise<ComputedDataResponse> => {
  const response = await caseServiceApi.post<ComputedDataResponse>(
    '/api/cases/computedValues',
    payload
  );

  return response.data;
};

export const useComputedData = (
  payload: ComputedDataPayload,
  enabled: boolean
): UseQueryResult<ComputedDataResponse, Error> => {
  return useQuery<ComputedDataResponse, Error>({
    queryKey: ['computed-data', payload],
    queryFn: () => fetchComputedData(payload),
    retry: 0,
    gcTime: 0,
    enabled:
      enabled &&
      !!payload.account_rid &&
      !!payload.case_rid &&
      !!payload.country_rid &&
      !!payload.country_code,
  });
};

// ─── Case Close ───────────────────────────────────────────────────────────────

export const fetchCaseClose = async (
  payload: CaseClosePayload
): Promise<{ data: unknown }> => {
  const formData = new FormData();

  formData.append('case_rid', payload.case_rid);
  formData.append('account_rid', payload.account_rid);
  formData.append('country_credits', JSON.stringify(payload.country_credits));
  formData.append('state_credits', JSON.stringify(payload.state_credits));

  if (payload.comments !== undefined) {
    formData.append('comments', payload.comments);
  }

  if (payload.fiscal_year !== undefined) {
    formData.append('fiscal_year', String(payload.fiscal_year));
  }

  if (payload.files && payload.files.length > 0) {
    payload.files.forEach((file) => {
      formData.append('files', file);
    });
  }

  const response = await caseServiceApi.post('/api/cases/close', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
};

export const useCaseCloseMutation = () => {
  return useMutation<{ data: unknown }, Error, CaseClosePayload>({
    mutationFn: (payload) => fetchCaseClose(payload),
  });
};
