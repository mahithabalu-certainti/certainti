import { ProjectResourcesListType } from './project-resources';

export interface CaseProjectResourceListURLParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters: Record<string, any>;
  search: string;
  case_rid: string;
  accountRid: string;
  fiscalYear: number;
}

export type CaseProjectResourceList = ProjectResourcesListType;

export interface CaseProjectResourceListResponse {
  data: {
    projectResources: CaseProjectResourceList[];
    count: number;
    totalCount: number;
  };
}
