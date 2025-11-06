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
} from '../../types/assign-projects';
import { caseServiceApi } from '../../../api/api';
import { CommonApiResponse } from '../../../common-service';

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
