import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  ProjectDocumentItem,
  ProjectDocumentsListURLParams,
  ResourceSummaryItem,
  ResourceSummaryListURLParams,
  ProjectSummaryItem,
  ProjectSummaryListURLParams,
  QualifiedProjectItem,
  QualifiedProjectsListURLParams,
  DossierSummary,
  RDFormResponse,
} from '../../types';
import {
  ProjectDocumentListMockData,
  ResourceSummaryMockData,
  ProjectSummaryMockData,
  QualifiedProjectsMockData,
  DossierSummaryMockData,
  mockRDFormResponse,
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

// Qualified Projects
export const fetchQualifiedProjectsList = async (
  params?: QualifiedProjectsListURLParams
): Promise<{ qualifiedProjects: QualifiedProjectItem[]; count: number }> => {
  // const response = await caseServiceApi.get<QualifiedProjectListResponse>(
  //   QualifiedProjectsListURL(params)
  // );

  // Mock usage
  console.log('qualified-projects-list-params', params);
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return {
    qualifiedProjects: QualifiedProjectsMockData.data.qualifiedProjects,
    count: QualifiedProjectsMockData.data.count,
  };
};

export const useQualifiedProjectsList = (
  params: QualifiedProjectsListURLParams,
  refreshList?: number
): UseQueryResult<
  { qualifiedProjects: QualifiedProjectItem[]; count: number },
  Error
> => {
  return useQuery<
    { qualifiedProjects: QualifiedProjectItem[]; count: number },
    Error
  >({
    queryKey: ['qualified-projects-list', params, refreshList],
    queryFn: () => fetchQualifiedProjectsList(params),
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


// RD Form
const fetchRDFormData = async (
  accountId: string,
  countryId: string,
  regionId?: string
): Promise<RDFormResponse> => {
  // let url = `/api/rd-form?account_rid=${accountId}&country_rid=${countryId}`;

  // // Add region parameter if provided
  // if (regionId) {
  //   url += `&state_rid=${regionId}`;
  // }

  // const response = await caseServiceApi.get<RDFormResponse>(url);
  // return response.data;
  console.log(accountId, countryId, regionId);
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return mockRDFormResponse;
};

export const useGetRDFormData = (
  accountId: string,
  countryId: string,
  regionId?: string,
  enabled?: boolean
): UseQueryResult<RDFormResponse | undefined, Error> => {
  return useQuery<RDFormResponse | undefined, Error>({
    queryKey: ['rd-credit-forms', accountId, countryId, regionId],
    queryFn: () => fetchRDFormData(accountId, countryId, regionId),
    retry: 0,
    gcTime: 0,
    enabled: enabled && !!accountId && !!countryId,
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
