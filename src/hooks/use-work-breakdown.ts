import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  getKanbanBoardData,
  KanbanBoardData,
  fetchTaskActivities,
  TaskActivity,
} from '../consultant/services/work-breakdown/work-breakdown-service';

export const useGetWorkBreakdownList = (
  accountId: string,
  caseId: string
): UseQueryResult<KanbanBoardData, Error> => {
  return useQuery<KanbanBoardData, Error>({
    queryKey: ['kanbanBoardData', accountId, caseId],
    queryFn: () => getKanbanBoardData(accountId, caseId),
    enabled: !!accountId && !!caseId,
    retry: false,
  });
};

export const useGetTaskActivities = (
  accountId: string,
  caseId: string,
  taskId: string,
  enabled: boolean = true
): UseQueryResult<TaskActivity[], Error> => {
  return useQuery<TaskActivity[], Error>({
    queryKey: ['taskActivities', accountId, caseId, taskId],
    queryFn: () => fetchTaskActivities(accountId, caseId, taskId),
    enabled: enabled && !!accountId && !!caseId && !!taskId,
    retry: 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
