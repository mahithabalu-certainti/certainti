import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { api, resourceServiceApi } from '../../../api/api';
import { UploadImportPayload } from '../../../common-service';
import {
  ImportErrorRecord,
  ImportListResponse,
  ImportsList,
  ImportsListURLParams,
} from '../../types/imports';
import { uploadUrl } from '../urls';
import {
  mockErrorRecordsData,
  mockImportsData,
} from '../../pages/account-details-sidebar/sidebar-pages/imports/mock-response';

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

const fetchImportDetails = async (
  fileId: string
): Promise<ImportsList | undefined> => {
  return new Promise((resolve) => {
    const delay = Math.floor(Math.random() * 1000) + 2000;
    setTimeout(() => {
      const found = mockImportsData.data.imports.find(
        (item) => item.rid === fileId
      );
      resolve(found);
    }, delay);
  });
};

export const useImportDetails = (
  fileId?: string,
  shouldFetchDetails?: boolean
): UseQueryResult<ImportsList | undefined, Error> => {
  return useQuery<ImportsList | undefined, Error>({
    queryKey: ['importDetails', fileId],
    queryFn: () => fetchImportDetails(fileId!),
    enabled: !!fileId && !!shouldFetchDetails,
    retry: 0,
    gcTime: 0,
  });
};

type ErrorType = 'warning' | 'failed';

const simulateFetch = (
  data: ImportErrorRecord[]
): Promise<ImportErrorRecord[]> => {
  return new Promise((resolve) => {
    const delay = Math.floor(Math.random() * 1000) + 500;
    setTimeout(() => resolve(data), delay);
  });
};

const fetchImportErrors = async (
  // fileId: string,
  type: ErrorType
): Promise<ImportErrorRecord[]> => {
  if (type === 'warning')
    return simulateFetch(mockErrorRecordsData.warningRecords);
  if (type === 'failed')
    return simulateFetch(mockErrorRecordsData.failedRecords);
  return [];
};

export const useImportErrorRecords = (
  fileId?: string,
  type?: ErrorType
): UseQueryResult<ImportErrorRecord[], Error> => {
  return useQuery({
    queryKey: ['importErrorRecords', fileId, type],
    queryFn: () => fetchImportErrors(type!),
    enabled: !!fileId && !!type,
    retry: 0,
    gcTime: 0,
  });
};
