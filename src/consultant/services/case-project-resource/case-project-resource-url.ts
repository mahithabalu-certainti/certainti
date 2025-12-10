import { CaseProjectResourceListURLParams } from '../../types/case-project-resource';

const returnURL = (
  baseURL: string,
  params: CaseProjectResourceListURLParams
): string => {
  const { page, limit, sortBy, sortOrder, filters, fiscalYear, search } =
    params;

  const searchParams = new URLSearchParams();

  if (page !== undefined) searchParams.set('page', String(page));
  if (limit !== undefined) searchParams.set('limit', String(limit));
  if (sortBy) searchParams.set('sortBy', sortBy);
  if (sortOrder) searchParams.set('sortOrder', sortOrder);
  if (fiscalYear) searchParams.set('fiscalYear', String(fiscalYear));
  if (search) searchParams.set('search', search);
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }

  return `${baseURL}?${searchParams.toString()}`;
};

export const getCaseProjectResourcesUrl = (case_rid: string) =>
  `/api/cases/${case_rid}/project_resources`;

export const CaseProjectResourcesURL = ({
  page,
  limit,
  sortBy,
  sortOrder,
  filters,
  fiscalYear,
  case_rid,
  search,
  accountRid,
}: CaseProjectResourceListURLParams): string => {
  const base = getCaseProjectResourcesUrl(case_rid);
  return returnURL(base, {
    page,
    limit,
    sortBy,
    sortOrder,
    filters,
    fiscalYear,
    search,
    case_rid,
    accountRid,
  });
};
