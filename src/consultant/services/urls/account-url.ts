import { AccountListURLParams } from '../../types';

export const AccountListUrl = '/accounts';
export const AccountCreateUrl = '/api/accounts/new';
export const AccountEditUrl = '/accounts/:id/edit';
export const AccountDeleteUrl = '/accounts/:id/delete';
export const AccountUpdateUrl = '/api/accounts/update';
export const ParentAccountUrl = '/api/accounts/global';
export const CurrencyUrl = '/api/accounts/currency';
export const RegionUrl = '/api/accounts/regions';

// export const AccountListURL = ({
//   page,
//   limit,
//   sortBy,
//   sortOrder,
//   filters,
// }: AccountListURLParams): string => {
//   return `/api/accounts/?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}&filters=${JSON.stringify(filters)}`;
// };

export const AccountListURL = ({
  page,
  limit,
  sortBy,
  sortOrder,
  filters,
}: AccountListURLParams): string => {
  const baseUrl = '/api/accounts/';
  const searchParams = new URLSearchParams();

  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  searchParams.set('sortBy', sortBy);
  searchParams.set('sortOrder', sortOrder);

  // Only add filters if the object has properties
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }

  return `${baseUrl}?${searchParams.toString()}`;
};

export const AccountDetailUrl = (accountId: string) =>
  `/api/accounts/${accountId}`;
