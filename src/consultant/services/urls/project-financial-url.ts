import {
  ProjectFinancialResourceExportParams,
  ProjectFinancialResourceListParams,
} from '../../types';

export const ProjectFinancialResourceCostURL = ({
  page,
  sortBy,
  sortOrder,
  filters,
  limit,
  fiscalYear,
  accountNumber,
  projectRid,
  accountRid,
  search,
}: ProjectFinancialResourceListParams) => {
  const baseUrl = `/api/resource_cost/financialHighlights/list/${projectRid ? 'project' : 'account'}`;
  const searchParams = new URLSearchParams();

  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  searchParams.set('sortBy', sortBy as string);
  searchParams.set('sortOrder', sortOrder as string);

  if (fiscalYear) searchParams.set('fiscalYear', fiscalYear.toString());
  if (accountNumber !== undefined) {
    searchParams.set('accountNumber', accountNumber);
  }
  if (accountRid !== undefined) {
    searchParams.set('accountRid', accountRid);
  }
  if (projectRid !== undefined) {
    searchParams.set('projectRid', projectRid);
  }

  // Only add filters if the object has properties
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }

  if (search) {
    searchParams.set('search', search);
  }

  return `${baseUrl}?${searchParams.toString()}`;
};

export const ProjectFinancialResourceCostExportURL = ({
  sortBy,
  sortOrder,
  filters,
  fiscalYear,
  accountNumber,
  projectRid,
  accountRid,
  search,
}: ProjectFinancialResourceExportParams): string => {
  const baseUrl = `/api/resource_cost/financialHighlights/export/${projectRid ? 'project' : 'account'}`;
  const searchParams = new URLSearchParams();

  if (sortBy !== undefined) searchParams.set('sortBy', sortBy);
  if (sortOrder !== undefined) searchParams.set('sortOrder', sortOrder);
  if (fiscalYear) searchParams.set('fiscalYear', fiscalYear.toString());
  if (accountNumber !== undefined) {
    searchParams.set('accountNumber', accountNumber);
  }
  if (accountRid !== undefined) {
    searchParams.set('accountRid', accountRid);
  }
  if (projectRid !== undefined) {
    searchParams.set('projectRid', projectRid);
  }

  // Only add filters if the object has properties
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }

  if (search) {
    searchParams.set('search', search);
  }

  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};
