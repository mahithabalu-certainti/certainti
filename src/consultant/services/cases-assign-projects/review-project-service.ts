import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  AssignProject,
  AssignProjectListURLParams,
  assignProjectsListResponse,
} from '../../types/assign-projects';
import { interactionServiceApi } from '../../../api/api';
import { getReviewProjectsListUrl } from '../urls/review-projects-url';

export const fetchReviewprojectList = async (
  params: AssignProjectListURLParams
): Promise<{ projects: AssignProject[]; count: number }> => {
  const { data } = await interactionServiceApi.post<assignProjectsListResponse>(
    getReviewProjectsListUrl(),
    params
  );
  return {
    projects: data.data.projects,
    count: data.data.total_result,
  };
};

export const useAssingeProjectsList = (
  params: AssignProjectListURLParams
): UseQueryResult<{ projects: AssignProject[]; count: number }, Error> => {
  return useQuery<{ projects: AssignProject[]; count: number }, Error>({
    queryKey: ['review-project-list', params],
    queryFn: () => fetchReviewprojectList(params),
    retry: 0,
    gcTime: 0,
    // enabled: !!params.account_rid && params.reminder_specific_list,
  });
};
