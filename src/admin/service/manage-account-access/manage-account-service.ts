import { userServiceApi } from '../../../api/api';
import {
  AccountAccessApiResponse,
  AccountAccessDetail,
  AccountProjectApiResponse,
  ManageAccountGroupListApiResponse,
  ManageAccountProjectListApiResponse,
  ManageAccountUserListApiResponse,
  ManageUserListParms,
} from '../../types/manage-account';
import { useQuery } from '@tanstack/react-query';
import {
  geManageAccountAccessUrl,
  geManageProjectAccessUrl,
  getManageGroupListUrl,
  getManageUserListUrl,
  getProjectListManageAccessUrl,
} from '../urls';
import { useMutation } from '@tanstack/react-query';

export const fetchManageuserList = async (
  params: ManageUserListParms,
  accountId: string
) => {
  if (!accountId) {
    throw new Error('User ID is missing from URL');
  }

  const queryParams = {
    sortBy: params.sortBy || 'createdAt',
    sortOrder: params.sortOrder || 'DESC',
    entity_type: params.entity_type || 'Account',
    ...(params.filters && { filters: params.filters }),
    ...(params.searchTerm && { search: params.searchTerm }),
  };

  const url = getManageUserListUrl(accountId, queryParams);
  const response =
    await userServiceApi.get<ManageAccountUserListApiResponse>(url);
  return response.data;
};

export const fetchManageGroupList = async (
  params: ManageUserListParms,
  accountId: string
) => {
  if (!accountId) throw new Error('User ID missing from URL');

  const queryParams = {
    sortBy: params.sortBy || 'createdAt',
    sortOrder: params.sortOrder || 'DESC',
    entity_type: params.entity_type || 'Account',
    ...(params.filters && { filters: params.filters }),
    ...(params.searchTerm && { search: params.searchTerm }),
  };

  const url = getManageGroupListUrl(accountId, queryParams);
  const response =
    await userServiceApi.get<ManageAccountGroupListApiResponse>(url);
  return response.data;
};
export const fetchManageProjectAccessList = async (
  accountId: string,
  entityId: string,
  params: ManageUserListParms
) => {
  const url = getProjectListManageAccessUrl(accountId, entityId, params);
  const response =
    await userServiceApi.get<ManageAccountProjectListApiResponse>(url);
  return response.data;
};

export const useManageAccountAccessUserList = (
  params: ManageUserListParms,
  accountId: string,
  refreshProfileTrigger?: number
) => {
  return useQuery<ManageAccountUserListApiResponse, Error>({
    queryKey: ['manageAccountUser', params, refreshProfileTrigger],
    queryFn: () => fetchManageuserList(params, accountId),
    staleTime: 0, // No cache
    gcTime: 0, // Immediately remove from cache
    retry: 0,
  });
};
export const useManageAccountAccessGroupList = (
  params: ManageUserListParms,
  accountId: string,
  refreshProfileTrigger?: number
) => {
  return useQuery<ManageAccountGroupListApiResponse, Error>({
    queryKey: ['manageAccountGroup', params, refreshProfileTrigger],
    queryFn: () => fetchManageGroupList(params, accountId),
    staleTime: 0,
    gcTime: 0,
    retry: 0,
  });
};
export const useManageProjectAccessList = (
  accountId: string,
  entityId: string,
  params: ManageUserListParms,
  refreshProfileTrigger?: number
) => {
  return useQuery<ManageAccountProjectListApiResponse, Error>({
    queryKey: [
      'manageProjectAccessList',
      accountId,
      entityId,
      params,
      refreshProfileTrigger,
    ],
    queryFn: () => fetchManageProjectAccessList(accountId, entityId, params),
    staleTime: 0,
    gcTime: 0,
    retry: 0,
  });
};

export const useUpdateAccountAccesseDetails = () => {
  return useMutation<
    AccountAccessApiResponse, // Response type
    Error, // Error type
    Partial<AccountAccessDetail> // Variable (input) type
  >({
    mutationFn: (body) => updateAccountAccesseDetails(body),
  });
};

export const updateAccountAccesseDetails = async (
  body: Partial<AccountAccessDetail>
): Promise<AccountAccessApiResponse> => {
  try {
    const { data } = await userServiceApi.post<AccountAccessApiResponse>(
      geManageAccountAccessUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};
export const useUpdateProjectAccesseDetails = () => {
  return useMutation<
    AccountProjectApiResponse,
    Error,
    Partial<AccountProjectApiResponse>
  >({
    mutationFn: (body: Partial<AccountProjectApiResponse>) =>
      updateProjectAccesseDetails(
        body as unknown as Partial<AccountAccessDetail>
      ),
  });
};

export const updateProjectAccesseDetails = async (
  body: Partial<AccountAccessDetail>
): Promise<AccountProjectApiResponse> => {
  try {
    const { data } = await userServiceApi.post<AccountProjectApiResponse>(
      geManageProjectAccessUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};
