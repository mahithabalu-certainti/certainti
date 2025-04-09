import { UserListParams } from '../types/manage-user';
import { buildQueryString } from './helpers';

const ORGANIZATION = import.meta.env.VITE_ORGANIZATION;

export const getUserListUrl = (params: UserListParams = {}): string => {
  const defaultParams: UserListParams = {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'ASC',
    ...params,
  };

  const queryParams = {
    organization: ORGANIZATION,
    ...defaultParams,
  };

  return `/api/user/list?${buildQueryString(queryParams)}`;
};

export const getUserDetailUrl = (userId: string): string => {
  return `/api/user/list/${userId}?organization=${ORGANIZATION}`;
};

// Example usage

export const USER_DETAIL_URL = getUserDetailUrl(
  '84268de1-936a-43c3-b98c-a48858c8bb42'
);
