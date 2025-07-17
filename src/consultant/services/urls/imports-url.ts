import { ImportsListURLParams } from '../../types/imports';

export const ImportListURL = ({
  page,
  limit,
  sortBy,
  sortOrder,
  filters,
  fiscalYear,
  accountId,
}: ImportsListURLParams): string => {
  const baseUrl = `/api/imports/list/${accountId}`;
  const searchParams = new URLSearchParams();

  if (page !== undefined) searchParams.set('page', page.toString());
  if (limit !== undefined) searchParams.set('limit', limit.toString());
  if (fiscalYear) searchParams.set('fiscalYear', fiscalYear.toString());
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (sortBy !== undefined) searchParams.set('sortBy', sortBy);
  if (sortOrder !== undefined) searchParams.set('sortOrder', sortOrder);
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};
