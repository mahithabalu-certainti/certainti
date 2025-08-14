import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { api, resourceServiceApi } from '../../../api/api';
import { UploadImportPayload } from '../../../common-service';
import {
  FailureType,
  ImportDetailsResponse,
  ImportEntityType,
  ImportListResponse,
  ImportsDetails,
  ImportsList,
  ImportsListURLParams,
} from '../../types/imports';
import { uploadUrl } from '../urls';
import {
  TimesheetDetails,
  TimesheetDetailsResponse,
  TimeSheetList,
  TImesheetListResponse,
  TimeSheetListURLParams,
} from '../../types';

const getImportDetailsURL = (accountId: string, fileId: string) => {
  return `/api/import/list/${accountId}/${fileId}`;
};

const getImportFailureURL = (
  accountId: string,
  fileId: string,
  failureType: FailureType,
  entityType: string
) => {
  return `/api/import/export/${failureType}/${accountId}/${fileId}/${entityType}`;
};

export const uploadImportFile = async (payload: UploadImportPayload) => {
  const response = await api.post(uploadUrl(), payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response;
};

export const fetchImportList = async (
  params: ImportsListURLParams
): Promise<{ imports: ImportsList[]; count: number }> => {
  const response = await resourceServiceApi.post<ImportListResponse>(
    '/api/import/list',
    params
  );
  return {
    imports: response.data.data.imports,
    count: response.data.data.total_count || response.data.data.count || 0,
  };
};

export const useImportListList = (
  params: ImportsListURLParams,
  shouldFetchList: boolean,
  refreshImports?: number
): UseQueryResult<{ imports: ImportsList[]; count: number }, Error> => {
  return useQuery<{ imports: ImportsList[]; count: number }, Error>({
    queryKey: ['importList', params, refreshImports],
    queryFn: () => fetchImportList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.account_rid && !!shouldFetchList,
  });
};

export const fetchTimeSheetList = async (
  params: TimeSheetListURLParams
): Promise<{ imports: TimeSheetList[]; count: number }> => {
  const response = await resourceServiceApi.post<TImesheetListResponse>(
    '/api/timesheet/list',
    params
  );
  return {
    imports: response.data.data.imports,
    count: response.data.data.total_count || response.data.data.count || 0,
  };
};

export const useTimesheetList = (
  params: TimeSheetListURLParams,
  shouldFetchList: boolean,
  refreshImports?: number
): UseQueryResult<{ imports: TimeSheetList[]; count: number }, Error> => {
  return useQuery<{ imports: TimeSheetList[]; count: number }, Error>({
    queryKey: ['timesheetList', params, refreshImports],
    queryFn: () => fetchTimeSheetList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.account_rid && !!shouldFetchList,
  });
};

const fetchImportDetails = async (
  accountId: string,
  fileId: string
): Promise<ImportsDetails> => {
  const response = await resourceServiceApi.get<ImportDetailsResponse>(
    getImportDetailsURL(accountId, fileId)
  );
  return response.data.data.imports;
};

export const useImportDetails = (
  accountId?: string,
  fileId?: string
): UseQueryResult<ImportsDetails | undefined, Error> => {
  return useQuery<ImportsDetails | undefined, Error>({
    queryKey: ['importDetails', accountId, fileId],
    queryFn: () => fetchImportDetails(accountId!, fileId!),
    enabled: !!fileId && !!accountId,
    retry: 0,
    gcTime: 0,
  });
};

const fetchTimesheetDetails = async (
  accountId: string,
  fileId: string
): Promise<TimesheetDetails> => {
  const response = await resourceServiceApi.get<TimesheetDetailsResponse>(
    `/api/timesheet/list/${accountId}/${fileId}`
  );
  return response.data.data.imports;
};

export const useTimesheetDetails = (
  accountId?: string,
  fileId?: string
): UseQueryResult<TimesheetDetails | undefined, Error> => {
  return useQuery<TimesheetDetails | undefined, Error>({
    queryKey: ['timesheetDetails', accountId, fileId],
    queryFn: () => fetchTimesheetDetails(accountId!, fileId!),
    enabled: !!fileId && !!accountId,
    retry: 0,
    gcTime: 0,
  });
};

export const exportImportsData = async (params: ImportsListURLParams) => {
  try {
    const response = await resourceServiceApi.post(
      '/api/import/list/export',
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
    link.download = 'all_imports_records.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Export failed:', error);
  }
};

export const exportTimesheetData = async (params: TimeSheetListURLParams) => {
  try {
    const response = await resourceServiceApi.post(
      '/api/timesheet/list/export',
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
    link.download = 'all_timesheet_records.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Export failed:', error);
  }
};

export const downloadBase64File = async (
  url: string,
  filename: string = 'export.xlsx'
) => {
  try {
    const response = await resourceServiceApi.get(url);
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

export const downloadImportFailureData = async (
  accountId: string,
  fileId: string,
  failureType: FailureType,
  entityType: ImportEntityType
) => {
  const url = getImportFailureURL(accountId, fileId, failureType, entityType);
  await downloadBase64File(url, `${failureType}_failures.xlsx`);
};

const getTimesheetFailureURL = (
  accountId: string,
  fileId: string,
  failureType: FailureType,
  entityType: string
) => {
  return `/api/timesheet/export/${failureType}/${accountId}/${fileId}/${entityType}`;
};

export const downloadTimesheetFailureData = async (
  accountId: string,
  fileId: string,
  failureType: FailureType,
  entityType: ImportEntityType
) => {
  const url = getTimesheetFailureURL(accountId, fileId, failureType, entityType);
  await downloadBase64File(url, `${failureType}_failures.xlsx`);
};
