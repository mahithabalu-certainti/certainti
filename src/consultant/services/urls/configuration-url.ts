import {
  ConfigAssignGroupsListParms,
  ConfigAssignUserListParms,
} from '../../types';

export const getConfigAssignUsersListURL = (
  accountId: string,
  {
    sortBy,
    sortOrder,
    filters,
    entity_type,
    page,
    limit,
  }: ConfigAssignUserListParms,
  project_rid?: string
) => {
  const baseUrl = `/api/user_group/account/${accountId}/users`;
  const searchParams = new URLSearchParams();

  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  searchParams.set('sortBy', sortBy as string);
  searchParams.set('sortOrder', sortOrder as string);

  // Only add filters if the object has properties
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }

  if (entity_type !== undefined) {
    searchParams.set('entity_type', entity_type);
  }

  if (project_rid !== undefined) {
    searchParams.set('project_rid', project_rid);
  }

  return `${baseUrl}?${searchParams.toString()}`;
};

export const getConfigAssignGroupsListURL = (
  accountId: string,
  project_rid: string,
  {
    sortBy,
    sortOrder,
    filters,
    entity_type,
    page,
    limit,
  }: ConfigAssignGroupsListParms
) => {
  const baseUrl = `/api/user_group/account/${accountId}/groups`;
  const searchParams = new URLSearchParams();

  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  searchParams.set('sortBy', sortBy as string);
  searchParams.set('sortOrder', sortOrder as string);

  // Only add filters if the object has properties
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }

  if (entity_type !== undefined) {
    searchParams.set('entity_type', entity_type);
  }

  if (project_rid !== undefined) {
    searchParams.set('project_rid', project_rid);
  }

  return `${baseUrl}?${searchParams.toString()}`;
};
