/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  ProjectResourcesListParams,
  ProjectTaskListExportParams,
} from '../../types/project-task';

export const baseUrl = import.meta.env.VITE_RESOURCE_URL;
export const getProjectTaskUrl = (accountRid: string, projectRid: string) =>
  `/api/project_tasks/list?accountRid=${accountRid}&projectRid=${projectRid}`;

const returnURL = (baseUrl: string, params: Record<string, any>): string => {
  const { page, limit, sortBy, sortOrder, filters, search } = params;
  const searchParams = new URLSearchParams();

  if (page !== undefined) searchParams.set('page', String(page));
  if (limit !== undefined) searchParams.set('limit', String(limit));
  if (sortBy) searchParams.set('sortBy', sortBy);
  if (sortOrder) searchParams.set('sortOrder', sortOrder);

  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }

  if (search) searchParams.set('search', search);
  return `${baseUrl}&${searchParams.toString()}`;
};
export const ProjectTaskURL = ({
  page,
  limit,
  sortBy,
  sortOrder,
  filters,
  accountRid,
  projectRid,
  search,
}: ProjectResourcesListParams): string => {
  const base = getProjectTaskUrl(accountRid ?? '', projectRid ?? '');
  return returnURL(base, {
    page,
    limit,
    sortBy,
    sortOrder,
    filters,
    search,
  });
};

export const DetailURL = (taskId: string, accountRid: string) => {
  return `${baseUrl}/api/project_tasks/detail?accountRid=${accountRid}&taskRid=${taskId}`;
};

export const getProjectTaskExportURL = ({
  sortBy,
  sortOrder,
  filters,
  projectRid,
  accountRid,
}: ProjectTaskListExportParams): string => {
  const baseUrl = 'api/project_tasks/list/export';
  const searchParams = new URLSearchParams();
  if (accountRid !== undefined) {
    searchParams.set('accountRid', accountRid.toString());
  }
  if (projectRid !== undefined) {
    searchParams.set('projectRid', projectRid.toString());
  }
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (sortBy !== undefined) searchParams.set('sortBy', sortBy);
  if (sortOrder !== undefined) searchParams.set('sortOrder', sortOrder);

  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};
