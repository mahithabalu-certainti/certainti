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
  RDFormRevokePayload,
  RDFormRevokeResponse,
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
  getRdFormRevokeURL,
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
  caseRid: string,
  timezone: string
): Promise<RDCreditStatusResponse> => {
  const url = getDossierInitiateURL();
  const response = await caseServiceApi.post(url, {
    account_rid: accountRid,
    case_rid: caseRid,
    timezone: timezone,
  });
  return response.data;
};

export const useDossierInitiate = () => {
  return useMutation<
    RDCreditStatusResponse,
    Error,
    { account_rid: string; case_rid: string; timezone: string }
  >({
    mutationFn: ({ account_rid, case_rid, timezone }) =>
      fetchDossierInitiate(account_rid, case_rid, timezone),
  });
};
export const ExportDossierPackage = async (
  accountRid: string,
  caseRid: string,
  downloaded_list: string[],
  dossier_version?: string
): Promise<DossierPackageResponse> => {
  try {
    const url = getDossierSheetStatusURL();

    const payload: Record<string, unknown> = {
      case_rid: caseRid,
      account_rid: accountRid,
      downloaded_list,
    };

    // Include dossier_version only when provided (version-control row download)
    if (dossier_version !== undefined && dossier_version !== '') {
      payload.dossier_version = dossier_version;
    }

    const response = await caseServiceApi.post<DossierPackageResponse>(
      url,
      payload
    );

    const status = response.data;

    const base64Data = status?.data?.base64;

    const filename = `${status?.data?.document_name ?? 'dossier-sheet'}.zip`;

    if (base64Data) {
      // Decode base64 and create a Blob
      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/zip' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    return status;
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
};

export const useDownloadDossierSheet = () => {
  return useMutation<
    DossierPackageResponse | undefined,
    Error,
    {
      accountRid: string;
      caseRid: string;
      downloaded_list: string[];
      dossier_version?: string;
    }
  >({
    mutationFn: ({ accountRid, caseRid, downloaded_list, dossier_version }) =>
      ExportDossierPackage(
        accountRid,
        caseRid,
        downloaded_list,
        dossier_version
      ),
  });
};

export const rdformRevoke = async (
  payload: RDFormRevokePayload
): Promise<RDFormRevokeResponse> => {
  const url = getRdFormRevokeURL();
  const response = await caseServiceApi.post(url, payload);
  return response.data;
};
export const useRdFormRevoke = () => {
  return useMutation<RDFormRevokeResponse, Error, RDFormRevokePayload>({
    mutationFn: (payload: RDFormRevokePayload) => rdformRevoke(payload),
  });
};
