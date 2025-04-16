import { AccountListURLParams } from '../../types';

export const AccountListUrl = '/accounts';
export const AccountCreateUrl = '/api/accounts/new';
export const AccountEditUrl = '/accounts/:id/edit';
export const AccountDeleteUrl = '/accounts/:id/delete';
export const AccountUpdateUrl = '/api/accounts/update';
export const ParentAccountUrl = '/api/accounts/global';
export const CurrencyUrl = '/api/accounts/currency';

export const AccountListURL = ({
  page,
  limit,
  sortBy,
  sortOrder,
  filters,
  globalFilters,
  fiscalYear,
}: AccountListURLParams): string => {
  const baseUrl = '/api/accounts/list';
  const searchParams = new URLSearchParams();

  if (page !== undefined) searchParams.set('page', page.toString());
  if (limit !== undefined) searchParams.set('limit', limit.toString());
  if (sortBy !== undefined) searchParams.set('sortBy', sortBy);
  if (sortOrder !== undefined) searchParams.set('sortOrder', sortOrder);
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (globalFilters !== undefined) {
    searchParams.set('globalFilters', JSON.stringify(globalFilters));
  }
  if (fiscalYear) searchParams.set('fiscalYear', fiscalYear);

  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

export const AccountDetailUrl = (accountId: string) =>
  `/api/accounts/list/${accountId}`;

export const StateUrl = (countryId: string) =>
  `/api/accounts/states/${countryId}`;

export const CityUrl = (stateId: string) => `/api/accounts/cities/${stateId}`;
