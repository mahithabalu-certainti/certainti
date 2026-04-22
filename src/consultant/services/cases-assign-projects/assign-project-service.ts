import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  getAssignProjectsListUrl,
  getAssignProjectsUrl,
  getRemoveProjectsUrl,
  getSelectProjectsListUrl,
} from '../urls/assign-projects-url';
import {
  AssignProject,
  AssignProjectListURLParams,
  assignProjectsListResponse,
  AssignProjectsParams,
  CasesProjectDetailResponse,
} from '../../types/assign-projects';
import { caseServiceApi } from '../../../api/api';
import { CommonApiResponse } from '../../../common-service';
import {
  ProjectFinancialResourceCostList,
  ProjectFinancialResourceCostResponse,
  ProjectFinancialResourceListParams,
  ProjectFinancialSummary,
  ProjectFinancialSummaryListParams,
  ProjectFinancialSummaryResponse,
} from '../../types';

export const fetchAssigneprojectList = async (
  params: AssignProjectListURLParams
): Promise<{ projects: AssignProject[]; count: number }> => {
  const { data } = await caseServiceApi.post<assignProjectsListResponse>(
    getAssignProjectsListUrl(),
    params
  );
  return {
    projects: data.data.projects,
    count: data.data.total_result,
  };
};

export const useAssignProjectsList = (
  params: AssignProjectListURLParams,
  refreshInteractions?: number
): UseQueryResult<{ projects: AssignProject[]; count: number }, Error> => {
  return useQuery<{ projects: AssignProject[]; count: number }, Error>({
    queryKey: ['assign-project-list', params, refreshInteractions],
    queryFn: () => fetchAssigneprojectList(params),
    retry: 0,
    gcTime: 0,
    // enabled: !!params.account_rid && params.reminder_specific_list,
  });
};

// select project api

export const fetchSelectprojectList = async (
  params: AssignProjectListURLParams
): Promise<{ projects: AssignProject[]; count: number }> => {
  const { data } = await caseServiceApi.post<assignProjectsListResponse>(
    getSelectProjectsListUrl(),
    params
  );
  return {
    projects: data.data.projects,
    count: data.data.total_result,
  };
};

export const useSelectProjectsList = (
  params: AssignProjectListURLParams,
  refreshInteractions?: number
): UseQueryResult<{ projects: AssignProject[]; count: number }, Error> => {
  return useQuery<{ projects: AssignProject[]; count: number }, Error>({
    queryKey: ['select-project-list', params, refreshInteractions],
    queryFn: () => fetchSelectprojectList(params),
    retry: 0,
    gcTime: 0,
    // enabled: !!params.account_rid && params.reminder_specific_list,
  });
};

export const assignProjectList = async (
  body: Partial<AssignProjectsParams>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await caseServiceApi.post<CommonApiResponse>(
      getAssignProjectsUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error creating case:', error);
    throw error;
  }
};

export const useAssignProjects = () => {
  return useMutation<CommonApiResponse, Error, Partial<AssignProjectsParams>>({
    mutationFn: (body) => assignProjectList({ ...body }),
  });
};
export const removeProjectList = async (
  body: Partial<AssignProjectsParams>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await caseServiceApi.post<CommonApiResponse>(
      getRemoveProjectsUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error creating case:', error);
    throw error;
  }
};

export const useRemoveProjects = () => {
  return useMutation<CommonApiResponse, Error, Partial<AssignProjectsParams>>({
    mutationFn: (body) => removeProjectList({ ...body }),
  });
};

export const CasesProjectDetailUrl = (
  accountId: string,
  caseId: string,
  projectId: string
) => {
  const params = new URLSearchParams({
    accountId,
    caseId,
    projectId,
  });
  return `/api/caseProject/details?${params.toString()}`;
};

export const fetchCasesProjectDetail = async (
  accountId: string,
  caseId: string,
  projectId: string
): Promise<CasesProjectDetailResponse> => {
  try {
    const response = await caseServiceApi.get<CasesProjectDetailResponse>(
      CasesProjectDetailUrl(accountId, caseId, projectId)
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching project details:', error);
    throw error;
  }
};

export const useCasesProjectDetail = (
  accountId: string,
  caseId: string,
  projectId: string,

  refreshTrigger?: number
) => {
  return useQuery<CasesProjectDetailResponse, Error>({
    queryKey: ['projectDetail', projectId, accountId, caseId, refreshTrigger],
    queryFn: () => fetchCasesProjectDetail(accountId, caseId, projectId),
    enabled: !!projectId && !!accountId && !!caseId,
    gcTime: 0,
    retry: 2,
  });
};

const FinancialCaseSummaryURL = () => {
  return `/api/caseProject/projectFinancialSummary`;
};
export const fetchCasesProjectFinancialSummary = async (
  params: ProjectFinancialSummaryListParams
): Promise<ProjectFinancialSummary> => {
  const response = await caseServiceApi.post<ProjectFinancialSummaryResponse>(
    FinancialCaseSummaryURL(),
    params
  );
  return response.data.data;
};

export const useCasesListProjectFinancialSummary = (
  params: ProjectFinancialSummaryListParams,
  refreshSummary?: number
): UseQueryResult<ProjectFinancialSummary, Error> => {
  return useQuery<ProjectFinancialSummary, Error>({
    queryKey: ['projectFinancialSummary', params, refreshSummary],
    queryFn: () => fetchCasesProjectFinancialSummary(params),
    retry: 0,
    gcTime: 0,
    // enabled:
    //   !!params.account_rid &&
    //   !!params.project_fiscal_rid &&
    //   !!params.fiscal_year,
  });
};
export const ProjectCasesFinancialResourceCostURL = ({
  page,
  sortBy,
  sortOrder,
  filters,
  limit,
  fiscalYear,
  accountNumber,
  projectRid,
  accountRid,
  search,
  caseRid,
}: ProjectFinancialResourceListParams) => {
  const baseUrl = `/api/caseProject/resourceCost/details`;
  const searchParams = new URLSearchParams();

  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  searchParams.set('sortBy', sortBy as string);
  searchParams.set('sortOrder', sortOrder as string);

  if (fiscalYear) searchParams.set('fiscalYear', fiscalYear.toString());
  if (accountNumber !== undefined) {
    searchParams.set('accountNumber', accountNumber);
  }
  if (accountRid !== undefined) {
    searchParams.set('accountRid', accountRid);
  }
  if (projectRid !== undefined) {
    searchParams.set('projectRid', projectRid);
  }
  if (caseRid !== undefined) {
    searchParams.set('caseRid', caseRid);
  }
  // Only add filters if the object has properties
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }

  if (search) {
    searchParams.set('search', search);
  }

  return `${baseUrl}?${searchParams.toString()}`;
};
export const fetchCasesProjectFinancialResourceCost = async (
  params: ProjectFinancialResourceListParams
): Promise<{
  projectResourceFiscal: ProjectFinancialResourceCostList[];
  count: number;
}> => {
  const response =
    await caseServiceApi.post<ProjectFinancialResourceCostResponse>(
      ProjectCasesFinancialResourceCostURL(params)
    );
  return {
    projectResourceFiscal: response.data.data.projectResourceFiscal,
    count: response.data.data.count,
  };
};

export const useCasesProjectFinancialResourceCost = (
  params: ProjectFinancialResourceListParams,
  refresTrigger?: number
): UseQueryResult<
  {
    projectResourceFiscal: ProjectFinancialResourceCostList[];
    count: number;
  },
  Error
> => {
  return useQuery<
    {
      projectResourceFiscal: ProjectFinancialResourceCostList[];
      count: number;
    },
    Error
  >({
    queryKey: ['projectFinancialResource', params, refresTrigger],
    queryFn: () => fetchCasesProjectFinancialResourceCost(params),
    retry: 0,
    gcTime: 0,
    enabled:
      !!params.accountNumber && !!params.accountRid && !!params.fiscalYear,
  });
};
