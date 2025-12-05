import { ProjectTasksListType } from './project-tasks';

export interface CaseProjectTaskListURLParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters: Record<string, any>;
  search: string;
  case_rid: string;
  accountRid: string;
  fiscalYear?: number;
}

export type CaseProjectTaskList = ProjectTasksListType;

export interface CaseProjectTaskListResponse {
  data: {
    tasks: CaseProjectTaskList[];
    count: number;
    totalCount: number;
  };
}
