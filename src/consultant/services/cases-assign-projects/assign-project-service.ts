import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  getAssignProjectsListUrl,
  getSelectProjectsListUrl,
} from '../urls/assign-projects-url';
import {
  AssignProject,
  AssignProjectListURLParams,
  assignProjectsListResponse,
} from '../../types/assign-projects';
import { caseServiceApi } from '../../../api/api';

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

export const useAssingeProjectsList = (
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
