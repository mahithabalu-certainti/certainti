import { CaseListExportParams, CaseListParams } from '../../types';

export const getCaseListURL = (
  {
    page,
    sortBy,
    sortOrder,
    filters,
    limit,
    fiscalYear,
    globalFilters,
    isGlobal,
    search,
  }: CaseListParams,
  accountId?: string
): string => {
  const baseUrl = `/api/cases/list${isGlobal ? `/caseSummary` : ''}`;
  const searchParams = new URLSearchParams();

  if (accountId) searchParams.set('account_rid', accountId);
  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  if (sortBy) searchParams.set('sortBy', sortBy);
  if (sortOrder) searchParams.set('sortOrder', sortOrder);
  if (fiscalYear !== undefined && fiscalYear !== null) {
    searchParams.set('fiscal_year', fiscalYear.toString());
  }

  // Only add filters if present
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }

  if (globalFilters !== undefined) {
    searchParams.set('globalFilters', JSON.stringify(globalFilters));
  }

  if (search) {
    searchParams.set('search', search);
  }

  return `${baseUrl}?${searchParams.toString()}`;
};

export const getCaseExportListURL = (
  {
    sortBy,
    sortOrder,
    filters,
    fiscalYear,
    globalFilters,
    timezone,
    isGlobal,
    search,
  }: CaseListExportParams,
  accountId?: string
): string => {
  const baseUrl = isGlobal
    ? `/api/cases/export/caseSummary`
    : `/api/cases/export`;

  const searchParams = new URLSearchParams();
  if (accountId) searchParams.set('account_rid', accountId);
  if (fiscalYear !== undefined && fiscalYear !== null) {
    searchParams.set('fiscal_year', fiscalYear.toString());
  }
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (sortBy) searchParams.set('sortBy', sortBy);
  if (sortOrder) searchParams.set('sortOrder', sortOrder);
  if (globalFilters !== undefined) {
    searchParams.set('globalFilters', JSON.stringify(globalFilters));
  }
  if (search) {
    searchParams.set('search', search);
  }
  if (timezone) searchParams.set('timezone', timezone);

  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};
