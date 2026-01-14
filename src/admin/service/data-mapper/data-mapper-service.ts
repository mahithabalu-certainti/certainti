import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import { caseServiceApi } from '../../../api/api';
import {
  DataMapperCreateResponse,
  DataMapperDetails,
  DataMapperListParams,
  DataMapperListItem,
  DataMapperExportListParams,
  MappingDetailsData,
  DataMapperConfigPayload,
  DataMapperConfigResponse,
  ObjectItem,
} from '../../types/data-mapper';
import {
  DataMapperConfigMockData,
  DataMapperDetailsMockData,
  DataMapperListMockData,
  MappingDetailsMockData,
  ObjectsListMockData,
} from '../../mockdata/data-mapper';

const useApiMutationService = <T, V = void>(
  endpoint: string,
  method: 'post' | 'put' | 'patch' | 'delete' = 'post'
) => {
  return useMutation<T, Error, V>({
    mutationFn: async (data: V) => {
      const isFormData = data instanceof FormData;

      const response = await caseServiceApi.request<T>({
        url: endpoint,
        method,
        data,
        headers: isFormData
          ? { 'Content-Type': 'multipart/form-data' }
          : { 'Content-Type': 'application/json' },
      });

      return response.data;
    },
  });
};

// Create Data Mapper
export const useCreateDataMapper = () => {
  return useApiMutationService<DataMapperCreateResponse, FormData>(
    '/api/dataMapper/create',
    'post'
  );
};

// Update Data Mapper
export const useUpdateDataMapper = () => {
  return useApiMutationService<DataMapperCreateResponse, FormData>(
    '/api/dataMapper/update',
    'put'
  );
};

//----- Data Mapper Details --------
export const fetchDataMapperDetails = async (
  formId: string
): Promise<DataMapperDetails> => {
  // const response = await caseServiceApi.get<DataMapperDetailsResponse>(
  //   `/api/dataMapper/detail/${formId}`
  // );

  // return response.data.data;

  console.log('data-mapper-details', formId);
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return DataMapperDetailsMockData.data;
};

export const useDataMapperDetails = (
  formId?: string,
  isEnabled?: boolean
): UseQueryResult<DataMapperDetails | undefined, Error> => {
  return useQuery<DataMapperDetails | undefined, Error>({
    queryKey: ['data-mapper-details', formId],
    queryFn: () => fetchDataMapperDetails(formId!),
    retry: 0,
    gcTime: 0,
    enabled: !!formId && isEnabled,
  });
};

// --------- Data Mapper List ----------
const fetchDataMapperList = async (
  params: DataMapperListParams
): Promise<{ items: DataMapperListItem[]; count: number }> => {
  // const response = await caseServiceApi.post<DataMapperListResponse>(
  //   '/api/dataMapper/list',
  //   params
  // );
  // return {
  //   items: response.data.data.items,
  //   count: response.data.data.totalCount,
  // };

  console.log('data-mapper-list', params);
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return {
    items: DataMapperListMockData.data.items,
    count: DataMapperListMockData.data.totalCount,
  };
};

export const useDataMapperList = (
  params: DataMapperListParams,
  refreshTrigger?: number
): UseQueryResult<{ items: DataMapperListItem[]; count: number }, Error> => {
  return useQuery<{ items: DataMapperListItem[]; count: number }, Error>({
    queryKey: ['data-mapper-list', params, refreshTrigger],
    queryFn: () => fetchDataMapperList(params),
    retry: 0,
    gcTime: 0,
  });
};

// ----- Export Data Mapper List --------
export const ExportDataMapperList = async (
  params: DataMapperExportListParams
) => {
  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  try {
    const url = `/api/dataMapper/export`;
    const body = {
      ...params,
      timezone: systemTimezone,
    };
    const response = await caseServiceApi.post(url, body);

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
    link.download = 'data_mapper_records.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Export failed:', error);
  }
};

//----- Mapping Details --------
export const fetchMappingDetails = async (
  rid: string
): Promise<MappingDetailsData> => {
  // const response = await caseServiceApi.get<MappingDetailsResponse>(
  //   `/api/dataMapper/mappingDetail/${rid}`
  // );
  // return response.data.data;

  console.log('mapping-details', rid);
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return MappingDetailsMockData.data;
};

export const useMappingDetails = (
  rid?: string,
  isEnabled?: boolean
): UseQueryResult<MappingDetailsData | undefined, Error> => {
  return useQuery<MappingDetailsData | undefined, Error>({
    queryKey: ['mapping-details', rid],
    queryFn: () => fetchMappingDetails(rid!),
    retry: 0,
    gcTime: 0,
    enabled: !!rid && isEnabled,
  });
};

//----- Object List --------
export const fetchObjectsList = async (
  country_rid: string,
  state_rid: string
): Promise<ObjectItem[]> => {
  // const response = await caseServiceApi.get<ObjectsListResponse>(
  //   `/api/dataMapper/objectsList?country_rid=${country_rid}&state_rid=${state_rid}`
  // );
  // return response.data.data;

  console.log('objects-list', country_rid, state_rid);
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return ObjectsListMockData.data;
};

export const useObjectsList = (
  country_rid: string,
  state_rid: string
): UseQueryResult<ObjectItem[], Error> => {
  return useQuery<ObjectItem[], Error>({
    queryKey: ['mapper-objects-list', country_rid, state_rid],
    queryFn: () => fetchObjectsList(country_rid, state_rid),
    retry: 0,
    gcTime: 0,
    enabled: !!country_rid && !!state_rid,
  });
};

//----- Data Mapper Config --------
export const updateDataMapperConfig = async (
  body: DataMapperConfigPayload
): Promise<DataMapperConfigResponse> => {
  // const response = await caseServiceApi.post<DataMapperConfigResponse>(
  //   `/api/dataMapper/updateMapping`,
  //   body
  // );
  // return response.data.data;

  console.log('data-mapper-config', body);
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return DataMapperConfigMockData;
};

export const useUpdateDataMapperConfig = () => {
  return useMutation<DataMapperConfigResponse, Error, DataMapperConfigPayload>({
    mutationFn: (body) => updateDataMapperConfig(body),
  });
};
