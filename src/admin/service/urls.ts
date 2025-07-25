import { UserListParams } from '../types/manage-user';
import { buildQueryString } from './helpers';

const ORGANIZATION = import.meta.env.VITE_ORGANIZATION;

export const getUserListUrl = (params: UserListParams = {}): string => {
  const defaultParams: UserListParams = {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    ...params,
  };

  const queryParams = {
    organization: ORGANIZATION,
    ...defaultParams,
  };

  return `/api/user/list?${buildQueryString(queryParams)}`;
};

export const getProfileListUrl = (params: UserListParams = {}): string => {
  const defaultParams: UserListParams = {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    ...params,
  };

  const queryParams = {
    ...defaultParams,
  };

  return `/api/user/profiles?${buildQueryString(queryParams)}`;
};

export const getUserGroupListUrl = (params: UserListParams = {}): string => {
  const defaultParams: UserListParams = {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    ...params,
  };

  const queryParams = {
    ...defaultParams,
  };
  return `/api/user_group/list?${buildQueryString(queryParams)}`;
};

export const getUserExportUrl = (params: UserListParams = {}): string => {
  const queryParams: Record<string, unknown> = {
    organization: ORGANIZATION,
    sortBy: params.sortBy || 'createdAt',
    sortOrder: params.sortOrder || 'DESC',
    filters: params.filters,
    timezone: params.timezone,
  };

  return `/api/user/export?${buildQueryString(queryParams)}`;
};

export const getProfileExportUrl = (profileId: string) => {
  return `/api/user/${profileId}/profile/export`;
};

export const getUserDetailUrl = (userId: string): string => {
  return `/api/user/list/${userId}?organization=${ORGANIZATION}`;
};

// Example usage

export const USER_DETAIL_URL = getUserDetailUrl(
  '84268de1-936a-43c3-b98c-a48858c8bb42'
);
