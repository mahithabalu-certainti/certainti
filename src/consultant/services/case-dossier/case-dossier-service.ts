import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  ProjectDocumentItem,
  ProjectDocumentsListURLParams,
  ResourceSummaryItem,
  ResourceSummaryListURLParams,
  ProjectSummaryItem,
  ProjectSummaryListURLParams,
} from '../../types';
import {
  ProjectDocumentListMockData,
  ResourceSummaryMockData,
  ProjectSummaryMockData,
} from '../../mockdata/dossier';

export const fetchProjectDocumentList = async (
  params?: ProjectDocumentsListURLParams
): Promise<{ projectDocuments: ProjectDocumentItem[]; count: number }> => {
  // const response = await caseServiceApi.get<ProjectDocumentListResponse>(
  //   ProjectDocumentListURL(params)
  // );

  // Mock usage
  console.log('project-documents-list-params', params);
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return {
    projectDocuments: ProjectDocumentListMockData.data.projectDocuments,
    count: ProjectDocumentListMockData.data.count,
  };
};

export const useProjectDocumentList = (
  params: ProjectDocumentsListURLParams,
  refreshList?: number
): UseQueryResult<
  { projectDocuments: ProjectDocumentItem[]; count: number },
  Error
> => {
  return useQuery<
    { projectDocuments: ProjectDocumentItem[]; count: number },
    Error
  >({
    queryKey: ['project-document-list', params, refreshList],
    queryFn: () => fetchProjectDocumentList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.accountRid && !!params.caseRid,
  });
};

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

// Project Summary
export const fetchProjectSummaryList = async (
  params?: ProjectSummaryListURLParams
): Promise<{ projectSummary: ProjectSummaryItem[]; count: number }> => {
  // const response = await caseServiceApi.get<ProjectSummaryListResponse>(
  //   ProjectSummaryListURL(params)
  // );

  // Mock usage
  console.log('project-summary-list-params', params);
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return {
    projectSummary: ProjectSummaryMockData.data.projectSummary,
    count: ProjectSummaryMockData.data.count,
  };
};

export const useProjectSummaryList = (
  params: ProjectSummaryListURLParams,
  refreshList?: number
): UseQueryResult<
  { projectSummary: ProjectSummaryItem[]; count: number },
  Error
> => {
  return useQuery<
    { projectSummary: ProjectSummaryItem[]; count: number },
    Error
  >({
    queryKey: ['project-summary-list', params, refreshList],
    queryFn: () => fetchProjectSummaryList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.accountRid && !!params.caseRid,
  });
};
