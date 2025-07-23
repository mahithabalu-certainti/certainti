/* eslint-disable @typescript-eslint/no-explicit-any */

import { ProjectResourcesListParams } from '../../types/project-task';

export const baseUrl = import.meta.env.VITE_RESOURCE_URL;
export const getProjectTaskUrl = (accountRid: string, projectRid: string) =>
  `/api/project_tasks/list?accountRid=${accountRid}&projectRid=${projectRid}`;

const returnURL = (baseUrl: string, params: Record<string, any>): string => {
  const { page, limit, sortBy, sortOrder, filters, fiscalYear } = params;
  const searchParams = new URLSearchParams();

  if (page !== undefined) searchParams.set('page', String(page));
  if (limit !== undefined) searchParams.set('limit', String(limit));
  if (sortBy) searchParams.set('sortBy', sortBy);
  if (sortOrder) searchParams.set('sortOrder', sortOrder);
  if (fiscalYear) searchParams.set('fiscalYear', fiscalYear);

  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  return `${baseUrl}&${searchParams.toString()}`;
};
export const ProjectTaskURL = ({
  page,
  limit,
  sortBy,
  sortOrder,
  filters,
  fiscalYear,
  accountRid,
  projectRid,
}: ProjectResourcesListParams): string => {
  const base = getProjectTaskUrl(accountRid ?? '', projectRid ?? '');
  return returnURL(base, {
    page,
    limit,
    sortBy,
    sortOrder,
    filters,
    fiscalYear,
  });
};

export const DetailURL = (taskId: string, accountRid: string) => {
  console.log('detail page-url', accountRid, taskId);
  // return '';
  return `${baseUrl}/api/project_tasks/detail?accountRid=${accountRid}&taskRid=${taskId}`;
};
