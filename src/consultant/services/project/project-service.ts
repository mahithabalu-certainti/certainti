import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import {
  ProjectList,
  ProjectListParams,
  ProjectListResponse,
} from '../../types/project';
import { resourceServiceApi } from '../../../api/api';
import { ProjectListURL } from '../urls';

export const fetchProjects = async (
  params: ProjectListParams
): Promise<{ projects: ProjectList[]; count: number }> => {
  const response = await resourceServiceApi.get<ProjectListResponse>(
    ProjectListURL(params)
  );

  return {
    projects: response.data.data.projects,
    count: response.data.data.projects.length,
  };
};

export const useAccountProjects = (
  params: ProjectListParams,
  options?: UseQueryOptions<{ projects: ProjectList[]; count: number }, Error>
): UseQueryResult<{ projects: ProjectList[]; count: number }, Error> => {
  return useQuery<{ projects: ProjectList[]; count: number }, Error>({
    queryKey: ['accountProjects', params],
    queryFn: () => fetchProjects(params),
    retry: 0,
    ...options,
  });
};

export const useAllProjects = (
  params: ProjectListParams,
  options?: UseQueryOptions<{ projects: ProjectList[]; count: number }, Error>
): UseQueryResult<{ projects: ProjectList[]; count: number }, Error> => {
  return useQuery<{ projects: ProjectList[]; count: number }, Error>({
    queryKey: ['allProjects', params],
    queryFn: () => fetchProjects(params),
    retry: 0,
    ...options,
  });
};
