import { AccountListURLParams } from '../../types';

export const AccountListUrl = '/accounts';
export const AccountCreateUrl = '/api/accounts/new';
export const AccountEditUrl = '/accounts/:id/edit';
export const AccountDeleteUrl = '/accounts/:id/delete';
export const AccountUpdateUrl = '/api/accounts/update';
export const ParentAccountUrl = '/api/accounts/global';
export const IndustryUrl = '/api/accounts/industry';
export const CurrencyUrl = '/api/accounts/currency';
export const ClassificationUrl = '/api/project/projectclassification';

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

export const GlobalAccountUrl = '/api/accounts/list/global';

export const AccountDetailUrl = (accountId: string) =>
  `/api/accounts/list/${accountId}`;

export const StateUrl = (countryId: string | string[] | null) => {
  const countryID = JSON.stringify(countryId ?? []);
  return `/api/accounts/states/?countryIds=${countryID}`;
};

export const CityUrl = (stateId: string) => `/api/accounts/cities/${stateId}`;

export const uploadUrl = () => `/importService/api/upload-csv`;

export const getAccountExportUrl = ({
  sortBy,
  sortOrder,
  filters,
}: AccountListURLParams): string => {
  const baseUrl = '/api/accounts/export';
  const searchParams = new URLSearchParams();

  if (sortBy !== undefined) searchParams.set('sortBy', sortBy);
  if (sortOrder !== undefined) searchParams.set('sortOrder', sortOrder);
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }

  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

export const getKeyContactRolesUrl = (): string => {
  return `/api/accounts/keycontactroles`;
};
