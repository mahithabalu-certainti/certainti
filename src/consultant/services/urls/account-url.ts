import { AccountListURLParams, GlobalAccountListParams } from '../../types';

export const AccountListUrl = '/accounts';
export const AccountCreateUrl = '/api/accounts/new';
export const AccountEditUrl = '/accounts/:id/edit';
export const AccountDeleteUrl = '/accounts/:id/delete';
export const AccountUpdateUrl = '/api/accounts/update';
export const ParentAccountUrl = '/api/accounts/global';
export const IndustryUrl = '/api/accounts/industry';
export const CurrencyUrl = '/api/accounts/currency';
export const ColorCodeUrl = '/api/accounts/colors?status=Active';
export const ClassificationUrl = '/api/project/projectclassification';

export const AccountListURL = ({
  page,
  limit,
  sortBy,
  sortOrder,
  filters,
  globalFilters,
  fiscalYear,
  search,
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
  if (search) searchParams.set('search', search);

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

export const CityUrl = (stateId: string) =>
  `/api/accounts/cities?stateIds=["${stateId}"]`;

export const uploadUrl = () => `/importService/api/upload-csv`;

export const attachmentUploadUrl = () => `/api/attachments/upload-csv`;

export const attachmentListUrl = (accountId: string) =>
  `/api/attachments/list/${accountId}`;

export const getAccountExportUrl = ({
  sortBy,
  sortOrder,
  filters,
  globalFilters,
  fiscalYear,
  search,
}: AccountListURLParams): string => {
  const baseUrl = '/api/accounts/export';
  const searchParams = new URLSearchParams();

  if (sortBy !== undefined) searchParams.set('sortBy', sortBy);
  if (sortOrder !== undefined) searchParams.set('sortOrder', sortOrder);
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (globalFilters !== undefined) {
    searchParams.set('globalFilters', JSON.stringify(globalFilters));
  }
  if (fiscalYear) searchParams.set('fiscalYear', fiscalYear);
  if (search) {
    searchParams.set('search', search);
  }
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

export const getKeyContactRolesUrl = (entityType: string): string => {
  return `/api/accounts/keycontactroles?entity_type=${entityType}`;
};

export const GloablAcconuntsListURL = ({
  fiscalYear,
  globalFilters,
}: GlobalAccountListParams) => {
  const baseUrl = '/api/accounts/list/global';
  const searchParams = new URLSearchParams();

  if (fiscalYear) searchParams.set('fiscalYear', fiscalYear.toString());
  if (globalFilters !== undefined) {
    searchParams.set('globalFilters', JSON.stringify(globalFilters));
  }

  return `${baseUrl}?${searchParams.toString()}`;
};
