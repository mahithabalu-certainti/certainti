import { CaseProjectTaskListURLParams } from '../../types/case-project-task';

export const getCaseProjectTasksUrl = (): string => `/api/caseProjectTask/list`;

const returnURL = (
  baseURL: string,
  params: CaseProjectTaskListURLParams
): string => {
  const {
    page,
    limit,
    sortBy,
    sortOrder,
    filters,
    fiscalYear,
    search,
    accountRid,
    case_rid,
  } = params;

  const searchParams = new URLSearchParams();

  if (accountRid) searchParams.set('accountRid', accountRid);
  if (case_rid) searchParams.set('caseRid', case_rid);

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

export const CaseProjectTasksURL = ({
  page,
  limit,
  sortBy,
  sortOrder,
  filters,
  fiscalYear,
  case_rid,
  search,
  accountRid,
}: CaseProjectTaskListURLParams): string => {
  const base = getCaseProjectTasksUrl();

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
