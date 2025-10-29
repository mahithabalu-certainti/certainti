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
import { interactionServiceApi } from '../../../api/api';
import { mockAssignProjects } from '../../pages/case/case-details/case-assign-projects/select-project/mockdata';

export const fetchAssigneprojectList = async (
  params: AssignProjectListURLParams
): Promise<{ interactions: AssignProject[]; count: number }> => {
  const { data } = await interactionServiceApi.post<assignProjectsListResponse>(
    getAssignProjectsListUrl(),
    params
  );
  return {
    interactions: mockAssignProjects,
    count: data.data.totalCount,
  };
};

export const useAssingeProjectsList = (
  params: AssignProjectListURLParams
): UseQueryResult<{ interactions: AssignProject[]; count: number }, Error> => {
  return useQuery<{ interactions: AssignProject[]; count: number }, Error>({
    queryKey: ['assign-project-list', params],
    queryFn: () => fetchAssigneprojectList(params),
    retry: 0,
    gcTime: 0,
    // enabled: !!params.account_rid && params.reminder_specific_list,
  });
};

// select project api

export const fetchSelectprojectList = async (
  params: AssignProjectListURLParams
): Promise<{ interactions: AssignProject[]; count: number }> => {
  const { data } = await interactionServiceApi.post<assignProjectsListResponse>(
    getSelectProjectsListUrl(),
    params
  );
  return {
    interactions: mockAssignProjects,
    count: data.data.totalCount,
  };
};

export const useSelectProjectsList = (
  params: AssignProjectListURLParams
): UseQueryResult<{ interactions: AssignProject[]; count: number }, Error> => {
  return useQuery<{ interactions: AssignProject[]; count: number }, Error>({
    queryKey: ['select-project-list', params],
    queryFn: () => fetchSelectprojectList(params),
    retry: 0,
    gcTime: 0,
    // enabled: !!params.account_rid && params.reminder_specific_list,
  });
};
