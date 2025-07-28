import { CostListParms } from '../../types/account-financial';

export const getResourceCostListURL = (
  accountId: string,
  accountNumber: string,
  fiscalYear: string,
  { sortBy, sortOrder, filters, page, limit }: CostListParms
) => {
  const baseUrl = `/api/resource_cost/financialHighlights/list`;
  const searchParams = new URLSearchParams();

  searchParams.set('accountNumber', accountNumber);
  searchParams.set('fiscalYear', fiscalYear);
  searchParams.set('accountRid', accountId);
  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  searchParams.set('sortBy', sortBy as string);
  searchParams.set('sortOrder', sortOrder as string);

  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  return `${baseUrl}?${searchParams.toString()}`;
};

export const getProjectCostListURL = (
  accountId: string,
  fiscalYear: string,
  { sortBy, sortOrder, filters, page, limit }: CostListParms
) => {
  const baseUrl = `/api/financialHighlight/list/projectCost`;
  const searchParams = new URLSearchParams();

  searchParams.set('fiscalYear', fiscalYear);
  searchParams.set('accountRid', accountId);
  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  searchParams.set('sortBy', sortBy as string);
  searchParams.set('sortOrder', sortOrder as string);

  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  return `${baseUrl}?${searchParams.toString()}`;
};
