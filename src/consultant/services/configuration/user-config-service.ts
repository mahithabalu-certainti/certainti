import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import { userServiceApi } from '../../../api/api';
import { getConfigAssignUsersListURL } from '../urls';
import {
  AssignUserAccess,
  AssignUserAccessApiResponse,
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
  project_rid: string,
  params: ConfigAssignUserListParms
): Promise<{ users: ConfigAssignUserList[]; count: number }> => {
  const response = await userServiceApi.get<ConfigAssignUserListApiResponse>(
    getConfigAssignUsersListURL(accountId, project_rid, params)
  );
  return {
    users: response.data.data.users,
    count: response.data.data.count,
  };
};

export const useConfigAssignUsersList = (
  accountId: string,
  project_rid: string,
  params: ConfigAssignUserListParms,
  refreshTrigger?: number
): UseQueryResult<{ users: ConfigAssignUserList[]; count: number }, Error> => {
  return useQuery<{ users: ConfigAssignUserList[]; count: number }, Error>({
    queryKey: ['configAssignUsers', params, refreshTrigger],
    queryFn: () => fetchConfigAssignUsersList(accountId, project_rid, params),
    staleTime: 0,
    gcTime: 0,
    retry: 0,
    enabled: !!accountId && !!project_rid,
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
