import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import { caseServiceApi } from '../../../api/api';
import {
  RDCreditPreviewResponse,
  RDCreditStatusResponse,
  RDCreditInitiatePayload,
  RDCreditInitiateResponse,
  SignOffFinancialHighlightsPayload,
  UserPreferencePayload,
  RDFormResponse,
} from '../../types';
import {
  getFinancialHighlightsURL,
  getRDCreditPreviewURL,
  getRDCreditStatusURL,
  getRDCreditInitiateURL,
  getSignOffFinancialHighlightsURL,
  getUserPreferenceURL,
  getRDFormMapperURL,
  getRDFormMapperPreviewURL,
} from '../urls/dossier-url';

// 1. GET Preview - Fetch RD credit calculation results
export const fetchRDCreditPreview = async (
  accountRid: string,
  caseRid: string,
  stateRid?: string,
  type?: string
): Promise<RDCreditPreviewResponse> => {
  const url = getRDCreditPreviewURL(accountRid, caseRid, stateRid ?? '', type ?? '');
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
    { accountrid: string; caseId: string; stateRid?: string, type?: string }
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
  const url = getSignOffFinancialHighlightsURL();
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

export const fetchRDFormMapperPreview = async (
  accountRid: string,
  caseRid: string,
  stateRid?: string,
  isFederal?: boolean
): Promise<RDFormResponse> => {
  const url = getRDFormMapperPreviewURL(
    accountRid,
    caseRid,
    stateRid ?? '',
    isFederal
  );
  const response = await caseServiceApi.get(url);
  return response.data;
};

export const useRDFormMapperPreviewMutation = () => {
  return useMutation<
    RDFormResponse,
    Error,
    { accountrid: string; caseId: string; stateRid: string; isFederal: boolean }
  >({
    mutationFn: ({ accountrid, caseId, stateRid, isFederal }) =>
      fetchRDFormMapperPreview(accountrid, caseId, stateRid, isFederal),
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
    mutationFn: (payload: UserPreferencePayload) =>
      getUserPreference(payload),
  });
};