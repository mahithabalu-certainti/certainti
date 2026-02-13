import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import { caseServiceApi } from '../../../api/api';
import {
  RDCreditPreviewResponse,
  RDCreditStatusResponse,
  RDCreditInitiatePayload,
  RDCreditInitiateResponse,
  SignOffFinancialHighlightsPayload,
  UserPreferencePayload,
  DossierPackageResponse,
} from '../../types';
import {
  getFinancialHighlightsURL,
  getRDCreditPreviewURL,
  getRDCreditStatusURL,
  getRDCreditInitiateURL,
  getSignOffFinancialHighlightsURL,
  getUserPreferenceURL,
  getRDFormMapperURL,
  getDossierInitiateURL,
  getDossierSheetStatusURL,
} from '../urls/dossier-url';

// 1. GET Preview - Fetch RD credit calculation results
export const fetchRDCreditPreview = async (
  accountRid: string,
  caseRid: string,
  stateRid?: string,
  type?: string
): Promise<RDCreditPreviewResponse> => {
  const url = getRDCreditPreviewURL(
    accountRid,
    caseRid,
    stateRid ?? '',
    type ?? ''
  );
  const response = await caseServiceApi.get(url);
  return response.data;
};

export const useRDCreditPreview = (
  accountRid: string,
  caseRid: string,
  stateRid: string,
  enabled: boolean = true
): UseQueryResult<RDCreditPreviewResponse, Error> => {
  return useQuery<RDCreditPreviewResponse, Error>({
    queryKey: ['rdCreditPreview', accountRid, caseRid, stateRid],
    queryFn: () => fetchRDCreditPreview(accountRid, caseRid, stateRid),
    retry: 0,
    gcTime: 0,
    enabled: !!accountRid && !!caseRid && !!stateRid && enabled,
  });
};

export const useRDCreditPreviewMutation = () => {
  return useMutation<
    RDCreditPreviewResponse,
    Error,
    { accountrid: string; caseId: string; stateRid?: string; type?: string }
  >({
    mutationFn: ({ accountrid, caseId, stateRid, type }) =>
      fetchRDCreditPreview(accountrid, caseId, stateRid, type),
  });
};

// 2. GET Status - Fetch RD credit status
export const fetchRDCreditStatus = async (
  accountRid: string,
  caseRid: string
): Promise<RDCreditStatusResponse> => {
  const url = getRDCreditStatusURL(accountRid, caseRid);
  const response = await caseServiceApi.get(url);
  return response.data;
};

export const useRDCreditStatus = (
  accountRid: string,
  caseRid: string,
  enabled: boolean = true
): UseQueryResult<RDCreditStatusResponse, Error> => {
  return useQuery<RDCreditStatusResponse, Error>({
    queryKey: ['rdCreditStatus', accountRid, caseRid],
    queryFn: () => fetchRDCreditStatus(accountRid, caseRid),
    retry: 0,
    gcTime: 0,
    enabled: !!accountRid && !!caseRid && enabled,
  });
};

// 3. POST Initiate - Initiate RD credit calculation process
export const initiateRDCreditProcess = async (
  payload: RDCreditInitiatePayload
): Promise<RDCreditInitiateResponse> => {
  const url = getRDCreditInitiateURL();
  const response = await caseServiceApi.post(url, payload);
  return response.data;
};

export const useInitiateRDCreditProcess = () => {
  return useMutation<RDCreditInitiateResponse, Error, RDCreditInitiatePayload>({
    mutationFn: (payload: RDCreditInitiatePayload) =>
      initiateRDCreditProcess(payload),
  });
};

export const financialHighlights = async (
  payload: RDCreditInitiatePayload
): Promise<RDCreditInitiateResponse> => {
  const url = getFinancialHighlightsURL();
  const response = await caseServiceApi.post(url, payload);
  return response.data;
};

export const useFinancialHighlights = () => {
  return useMutation<RDCreditInitiateResponse, Error, RDCreditInitiatePayload>({
    mutationFn: (payload: RDCreditInitiatePayload) =>
      financialHighlights(payload),
  });
};

export const signOffFinancialHighlights = async (
  payload: SignOffFinancialHighlightsPayload
): Promise<RDCreditInitiateResponse> => {
  const url = getSignOffFinancialHighlightsURL(payload.isRdform);
  const formData = new FormData();
  formData.append('case_rid', payload.case_rid);
  formData.append('account_rid', payload.account_rid);
  formData.append('sign_off', String(payload.sign_off));
  if (payload.file) {
    formData.append('file', payload.file);
  }
  formData.append('comments', payload.comments);

  const response = await caseServiceApi.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const useSignOffFinancialHighlights = () => {
  return useMutation({
    mutationFn: (payload: SignOffFinancialHighlightsPayload) =>
      signOffFinancialHighlights(payload),
  });
};

export const rdFormMapper = async (
  payload: RDCreditInitiatePayload
): Promise<RDCreditInitiateResponse> => {
  const url = getRDFormMapperURL();
  const response = await caseServiceApi.post(url, payload);
  return response.data;
};

export const useRDFormMapper = () => {
  return useMutation<RDCreditInitiateResponse, Error, RDCreditInitiatePayload>({
    mutationFn: (payload: RDCreditInitiatePayload) => rdFormMapper(payload),
  });
};

// 3. POST Initiate - Initiate RD credit calculation process
export const getUserPreference = async (
  payload: UserPreferencePayload
): Promise<RDCreditInitiateResponse> => {
  const url = getUserPreferenceURL();
  const response = await caseServiceApi.put(url, payload);
  return response.data;
};

export const useUserPreference = () => {
  return useMutation<RDCreditInitiateResponse, Error, UserPreferencePayload>({
    mutationFn: (payload: UserPreferencePayload) => getUserPreference(payload),
  });
};


export const fetchDossierInitiate = async (
  accountRid: string,
  caseRid: string
): Promise<RDCreditStatusResponse> => {
  const url = getDossierInitiateURL();
  const response = await caseServiceApi.post(url, {
    account_rid: accountRid,
    case_rid: caseRid,
  });
  return response.data;
};

export const useDossierInitiate = () => {
  return useMutation<
    RDCreditStatusResponse,
    Error,
    { account_rid: string; case_rid: string }
  >({
    mutationFn: ({ account_rid, case_rid }) =>
      fetchDossierInitiate(account_rid, case_rid),
  });
};
export const ExportDossierPackage = async (
  accountRid: string,
  caseRid: string
): Promise<DossierPackageResponse | undefined> => {
  try {
    const url = getDossierSheetStatusURL(accountRid, caseRid);
    const response = await caseServiceApi.get<DossierPackageResponse>(url);
    const status = response.data;
    const downloadUrl = status?.data?.browse_url;

    if (!downloadUrl) {
      console.error('No download URL available');
      return status;
    }

    const filename = `${status.data.document_name}${status.data.extension}` || 'dossier-sheet.zip';
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    // link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return status;
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
};

export const fetchDossierSheetStatus = async (
  accountRid: string,
  caseRid: string
): Promise<DossierPackageResponse> => {
  const url = getDossierSheetStatusURL(accountRid, caseRid);
  const response = await caseServiceApi.get<DossierPackageResponse>(url);
  return response.data;
};

export const useDossierSheetStatus = () => {
  return useMutation<
    DossierPackageResponse | undefined,
    Error,
    { accountRid: string; caseRid: string }
  >({
    mutationFn: ({ accountRid, caseRid }) =>
      ExportDossierPackage(accountRid, caseRid),
  });
};