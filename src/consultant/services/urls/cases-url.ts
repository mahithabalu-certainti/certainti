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
    search,
  }: CaseListParams,
  accountId?: string,
  caseId?: string
): string => {
  const baseUrl = `/api/cases/reviewProjects/${accountId}/${caseId}`;
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
// export const getAssignedListExportURL = ({
//   sort,
//   sort_by,
//   filter,
//   timezone,
//   page,
//   limit,
//   search,
//   case_rid,
//   account_id,
// }: CaseAssignedExportParams): string => {
//   const baseUrl = '/api/cases/assignedProjects/export';

//   const searchParams = new URLSearchParams();
//   if (account_id) searchParams.set('account_rid', account_id);
//   if (case_rid) searchParams.set('case_rid', case_rid);
//   // if (fiscalYear !== undefined && fiscalYear !== null) {
//   //   searchParams.set('fiscal_year', fiscalYear.toString());
//   // }
//   if (filter && Object.keys(filter).length > 0) {
//     searchParams.set('filters', JSON.stringify(filter));
//   }
//   if (sort_by) searchParams.set('sortBy', sort_by);
//   if (sort) searchParams.set('sortOrder', sort);
//   if (search) {
//     searchParams.set('search', search);
//   }
//   if (timezone) searchParams.set('timezone', timezone);

//   const queryString = searchParams.toString();
//   return queryString ? `${baseUrl}?${queryString}` : baseUrl;
// };
