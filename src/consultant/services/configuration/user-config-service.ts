import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import { userServiceApi } from '../../../api/api';
import {
  getConfigAssignGroupsListURL,
  getConfigAssignUsersListURL,
} from '../urls';
import {
  AssignUserAccess,
  AssignUserAccessApiResponse,
  ConfigAssignGroupsList,
  ConfigAssignGroupsListApiResponse,
  ConfigAssignGroupsListParms,
  ConfigAssignUserList,
  ConfigAssignUserListApiResponse,
  ConfigAssignUserListParms,
} from '../../types';

// Mutation
export const getConfigAssignUserAccessURL = (entity_type: string): string => {
  return `/api/user_group/assign-access-to-${entity_type}`;
};

export const fetchConfigAssignUsersList = async (
  accountId: string,
  params: ConfigAssignUserListParms,
  project_rid?: string
): Promise<{ users: ConfigAssignUserList[]; count: number }> => {
  const response = await userServiceApi.get<ConfigAssignUserListApiResponse>(
    getConfigAssignUsersListURL(accountId, params, project_rid)
  );
  return {
    users: response.data.data.users,
    count: response.data.data.count,
  };
};

export const useConfigAssignUsersList = (
  accountId: string,
  params: ConfigAssignUserListParms,
  refreshTrigger?: number,
  project_rid?: string
): UseQueryResult<{ users: ConfigAssignUserList[]; count: number }, Error> => {
  return useQuery<{ users: ConfigAssignUserList[]; count: number }, Error>({
    queryKey: ['configAssignUsers', params, refreshTrigger],
    queryFn: () => fetchConfigAssignUsersList(accountId, params, project_rid),
    staleTime: 0,
    gcTime: 0,
    retry: 0,
    enabled: !!accountId,
  });
};

// Mutation
export const useUpdateConfigAssignUserAccess = (entity_type: string) => {
  return useMutation<
    AssignUserAccessApiResponse,
    Error,
    Partial<AssignUserAccess>
  >({
    mutationFn: (body) => updateConfigAssignUserAccess(body, entity_type),
  });
};

export const updateConfigAssignUserAccess = async (
  body: Partial<AssignUserAccess>,
  entity_type: string
): Promise<AssignUserAccessApiResponse> => {
  try {
    const { data } = await userServiceApi.post<AssignUserAccessApiResponse>(
      getConfigAssignUserAccessURL(entity_type),
      body
    );
    return data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

export const fetchConfigAssignGroupsList = async (
  accountId: string,
  params: ConfigAssignGroupsListParms,
  project_rid?: string
): Promise<{ groups: ConfigAssignGroupsList[]; count: number }> => {
  const response = await userServiceApi.get<ConfigAssignGroupsListApiResponse>(
    getConfigAssignGroupsListURL(accountId, params, project_rid)
  );
  return {
    groups: response.data.data.groups,
    count: response.data.data.count,
  };
};

export const useConfigAssignGroupsList = (
  accountId: string,
  params: ConfigAssignGroupsListParms,
  refreshTrigger?: number,
  project_rid?: string
): UseQueryResult<
  { groups: ConfigAssignGroupsList[]; count: number },
  Error
> => {
  return useQuery<{ groups: ConfigAssignGroupsList[]; count: number }, Error>({
    queryKey: ['configAssignGroups', params, refreshTrigger],
    queryFn: () => fetchConfigAssignGroupsList(accountId, params, project_rid),
    staleTime: 0,
    gcTime: 0,
    retry: 0,
    enabled: !!accountId && !!params.entity_type,
  });
};
