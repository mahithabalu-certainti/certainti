import { useQuery, UseQueryResult } from '@tanstack/react-query';
// import { caseServiceApi } from '../../../api/api';
import {
  CaseProjectResourceListResponse,
  CaseProjectResourceListURLParams,
} from '../../types/case-project-resource';
import { caseServiceApi } from '../../../api/api';
import {
  ExportCaseListResponse,
  ProjectResourcesListParams,
} from '../../types';
import { ProjectResourceDetailApiResponse } from '../../types/project-task';

export const getCaseProjectResourcesUrl = (
  accountId: string,
  caseId: string
): string => `/api/caseProjectResource/list/${accountId}/${caseId}`;

const returnURL = (
  baseURL: string,
  params: CaseProjectResourceListURLParams
): string => {
  const { page, limit, sortBy, sortOrder, filters, fiscalYear, search, type } =
    params;

  const searchParams = new URLSearchParams();

  if (page !== undefined) searchParams.set('page', String(page));
  if (limit !== undefined) searchParams.set('limit', String(limit));
  if (sortBy) searchParams.set('sortBy', sortBy);
  if (sortOrder) searchParams.set('sortOrder', sortOrder);
  if (search) searchParams.set('search', search);
  if (fiscalYear !== undefined)
    searchParams.set('fiscalYear', String(fiscalYear));
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (type !== undefined) searchParams.set('type', type);
  return `${baseURL}?${searchParams.toString()}`;
};

export const CaseProjectResourcesURL = ({
  page,
  limit,
  sortBy,
  sortOrder,
  filters,
  case_rid,
  fiscalYear,
  search,
  accountRid,
  type,
}: CaseProjectResourceListURLParams): string => {
  const base = getCaseProjectResourcesUrl(accountRid ?? '', case_rid ?? '');

  return returnURL(base, {
    page,
    limit,
    sortBy,
    sortOrder,
    filters,
    fiscalYear,
    search,
    case_rid,
    accountRid,
    type,
  });
};

export const fetchCaseProjectResourceList = async (
  params: CaseProjectResourceListURLParams
): Promise<CaseProjectResourceListResponse> => {
  console.log(params);
  // return mockCaseProjectResourceList;
  const response = await caseServiceApi.get<CaseProjectResourceListResponse>(
    CaseProjectResourcesURL(params)
  );
  return response.data;
};

export const useCaseProjectResourceList = (
  params: CaseProjectResourceListURLParams,
  refreshAttachments?: number
): UseQueryResult<CaseProjectResourceListResponse, Error> => {
  return useQuery<CaseProjectResourceListResponse, Error>({
    queryKey: ['caseProjectResourceList', params, refreshAttachments],
    queryFn: () => fetchCaseProjectResourceList(params),
    retry: 0,
    gcTime: 0,
    enabled: true,
  });
};

export const getCasePorjectResourceExportListURL = (
  { sortBy, sortOrder, filters, search, type }: ProjectResourcesListParams,
  accountRid?: string,
  caseRid?: string
): string => {
  const baseUrl = `/api/caseProjectResource/export/${accountRid}/${caseRid}`;

  const searchParams = new URLSearchParams();

  // Add accountRid and caseRid as query parameters
  // if (accountRid) searchParams.set('accountRid', accountRid);
  // if (caseRid) searchParams.set('caseRid', caseRid);

  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (sortBy) searchParams.set('sortBy', sortBy);
  if (sortOrder) searchParams.set('sortOrder', sortOrder);
  if (search) {
    searchParams.set('search', search);
  }
  if (type !== undefined) {
    searchParams.set('type', type);
  }
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

export const ExportCaseProjectResourceList = async (
  params: ProjectResourcesListParams,
  accountId?: string,
  caseId?: string,
  fileName?: string
): Promise<void> => {
  try {
    const filename = fileName || `cases_projects_resource_list.xlsx`;

    const response = await caseServiceApi.get<ExportCaseListResponse>(
      getCasePorjectResourceExportListURL({ ...params }, accountId, caseId)
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

export const ResourceDetailURL = (accountRid: string, taskId: string) => {
  return `/api/caseProjectResource/detail/${accountRid}/${taskId}`;
};

export const fetchCaseProjectResourceDetails = async (
  accountRid?: string,
  resourceId?: string
): Promise<ProjectResourceDetailApiResponse> => {
  const response = await caseServiceApi.get<ProjectResourceDetailApiResponse>(
    ResourceDetailURL(accountRid ?? '', resourceId ?? '')
  );
  return response.data;
};

export const useCaseProjectResourceDetail = (
  accountRid?: string,
  resourceId?: string
) => {
  return useQuery<ProjectResourceDetailApiResponse, Error>({
    queryKey: ['project-resource-detail', resourceId, accountRid],
    queryFn: async () => {
      return fetchCaseProjectResourceDetails(accountRid, resourceId);
    },
    retry: 0,
    gcTime: 0,
    enabled: !!resourceId && !!accountRid,
  });
};
