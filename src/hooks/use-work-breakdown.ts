import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  getKanbanBoardData,
  KanbanBoardData,
} from '../consultant/services/work-breakdown/work-breakdown-service';

export const useGetWorkBreakdownList = (
  accountId: string,
  caseId: string
): UseQueryResult<KanbanBoardData, Error> => {
  return useQuery<KanbanBoardData, Error>({
    queryKey: ['kanbanBoardData', accountId, caseId],
    queryFn: () => getKanbanBoardData(accountId, caseId),
    enabled: !!accountId && !!caseId, // Only run the query if both accountId AND caseId are available
    retry: false,
  });
};
