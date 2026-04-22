/* eslint-disable @typescript-eslint/no-explicit-any */
import { ProjectFinancialResourceExportParams } from '../../types';
import { ProjectResourcesListParams } from '../../types/project-resources';
import { baseUrl } from './resource-cost-skill-urls';

// export const baseUrl = import.meta.env.VITE_RESOURCE_URL;

export const getProjectResourcesUrl = (
  accountNumber: string,
  projectid: string
) => `/api/project_resources/list/${accountNumber}/${projectid}`;

const returnURL = (baseURL: string, params: Record<string, any>): string => {
  const { page, limit, sortBy, sortOrder, filters, fiscalYear, search } =
    params;

  const searchParams = new URLSearchParams();

  if (page !== undefined) searchParams.set('page', String(page));
  if (limit !== undefined) searchParams.set('limit', String(limit));
  if (sortBy) searchParams.set('sortBy', sortBy);
  if (sortOrder) searchParams.set('sortOrder', sortOrder);
  if (fiscalYear) searchParams.set('fiscalYear', fiscalYear);
  if (search) searchParams.set('search', search);
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
  search,
}: ProjectResourcesListParams): string => {
  const base = getProjectResourcesUrl(accountNumber ?? '', projectid ?? '');
  return returnURL(base, {
    page,
    limit,
    sortBy,
    sortOrder,
    filters,
    fiscalYear,
    search,
  });
};

export const DetailURL = (account_Id: string, resourceId: string) => {
  return `${baseUrl}/api/project_resources/detail/${account_Id}/${resourceId}`;
};
export const ProjectResourceExportURL = ({
  sortBy,
  sortOrder,
  filters,
  projectRid,
  accountRid,
  search,
}: ProjectFinancialResourceExportParams): string => {
  const baseUrl = `/api/project_resources/export/${accountRid}/${projectRid}`;
  const searchParams = new URLSearchParams();

  if (sortBy !== undefined) searchParams.set('sortBy', sortBy);
  if (sortOrder !== undefined) searchParams.set('sortOrder', sortOrder);
  if (search) searchParams.set('search', search);

  // Only add filters if the object has properties
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }

  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};
