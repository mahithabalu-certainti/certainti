/* eslint-disable @typescript-eslint/no-explicit-any */
import { ProjectResourcesListParams } from '../../types/project-resources';
import { baseUrl } from './resource-cost-skill-urls';

// export const baseUrl = import.meta.env.VITE_RESOURCE_URL;

export const getProjectResourcesUrl = (
  accountNumber: string,
  projectid: string
) => `/api/project_resources/list/${accountNumber}/${projectid}`;

const returnURL = (baseURL: string, params: Record<string, any>): string => {
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

  return `${baseURL}?${searchParams.toString()}`;
};
export const ProjectResourcesURL = ({
  page,
  limit,
  sortBy,
  sortOrder,
  filters,
  accountNumber,
  fiscalYear,
  projectid,
}: ProjectResourcesListParams): string => {
  const base = getProjectResourcesUrl(accountNumber ?? '', projectid ?? '');
  return returnURL(base, {
    page,
    limit,
    sortBy,
    sortOrder,
    filters,
    fiscalYear,
  });
};

export const DetailURL = (account_Id: string, resourceId: string) => {
  return `${baseUrl}/api/project_resources/detail/${account_Id}/${resourceId}`;
};
