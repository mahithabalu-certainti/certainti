import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';

import { CommonApiResponse } from '../../../common-service';
import { caseServiceApi } from '../../../api/api';
import { updateCaseJurisdictionPayload } from '../../types';
export interface CaseTeamMember {
  rid?: string;
  user_id: string;
  user_name: string;
  user_role: string;
  start_date: string;
  end_date: string;
  is_primary?: boolean;
  status?: string;
  status_rid?: string;
  case_rid?: string;
  account_rid?: string;
  role_rid?: string;
  user_rid?: string;
  effective_startdate?: string;
  effective_enddate?: string;
  created_by?: string;
  modified_by?: string;
  created_datetime?: string;
  modified_datetime?: string;
  assigned_task_count?: number;
}

export interface CaseTeamResponse {
  team_members: CaseTeamMember[];
  case_rid: string;
  created_by?: string;
  created_on?: string;
  updated_by?: string;
  updated_on?: string;
}

export interface CaseTeamListResponse extends CommonApiResponse {
  data: {
    caseTeamMembers: CaseTeamMember[];
  };
}

export interface CaseConfigDetailsResponse {
  case_rid: string;
  account_rid: string;
  created_by: string;
  created_datetime: string;
  is_federal_level: boolean;
  is_state_level: boolean;
  modified_by?: string;
  modified_datetime?: string;
  rid: string;
  states: string[];
}
export interface CaseConfigDetailsResponse extends CommonApiResponse {
  data: {
    states(states: unknown): unknown;
    is_state_level: boolean;
    is_federal_level: boolean;
    data: CaseConfigDetailsResponse[];
  };
}

export interface CaseTeamUpdatePayload {
  case_rid: string;
  account_rid: string;
  team_members: CaseTeamMemberPayload[];
}

export interface CaseTeamMemberPayload {
  case_team_rid?: string;
  user_rid: string;
  role_rid: string;
  effective_from: string;
  effective_to: string;
  is_primary?: boolean;
  status_rid?: string;
  action_type: 'add' | 'edit' | 'delete';
}
export interface RoleOption {
  rid: string;
  role_name: string;
  role_description?: string;
  status?: string;
}

export interface RoleOptionsResponse extends CommonApiResponse {
  data: {
    caseRoles: RoleOption[];
  };
}
export interface UserOption {
  rid: string;
  name: string;
  email: string;
  status?: string;
  profile_url?: string | null;
  phone_number?: string | null;
}

export interface UserOptionsResponse extends CommonApiResponse {
  data: {
    users: UserOption[];
  };
}

export interface TagOption {
  rid: string;
  tag_name: string;
  tag_description?: string;
  status?: string;
}

export interface TagOptionsResponse extends CommonApiResponse {
  data: TagOption[];
}

export interface CollaboratorOption {
  assigned_to: string;
  assigned_to_name: string;
}

export interface CollaboratorOptionsResponse extends CommonApiResponse {
  data: CollaboratorOption[];
}

export interface CollaboratorListPayload {
  case_rid: string;
  account_rid: string;
  rid?: string;
}

export interface TagListPayload {
  task_rid?: string;
  account_rid: string;
  case_rid?: string;
  action?: 'create' | 'update';
}

export interface CaseTeamMemberDropdown {
  rid: string;
  user_rid: string;
  user_name: string;
  role_rid: string;
  effective_startdate: string;
  effective_enddate: string;
  is_primary: boolean;
  status_rid: string;
  profile_url?: string | null;
}

export interface CaseTeamMembersDropdownResponse extends CommonApiResponse {
  data: {
    caseTeamMembers: CaseTeamMemberDropdown[];
  };
}

const fetchCaseTeamMembersDropdown = async (
  accountId: string,
  caseId: string
): Promise<CaseTeamMemberDropdown[]> => {
  try {
    let url = `/api/cases/caseTeam/list?account_rid=${accountId}&is_dropdown_list=true`;
    if (caseId) {
      url += `&case_rid=${caseId}`;
    }
    const response =
      await caseServiceApi.get<CaseTeamMembersDropdownResponse>(url);

    if (response.data?.data?.caseTeamMembers) {
      return response.data.data.caseTeamMembers;
    }
    return [];
  } catch (error) {
    console.error('Error fetching case team members dropdown:', error);
    return [];
  }
};

const fetchCaseTeam = async (
  caseId: string,
  accountId: string
): Promise<CaseTeamResponse> => {
  try {
    const response = await caseServiceApi.get<CaseTeamListResponse>(
      `/api/cases/caseTeam/list?account_rid=${accountId}&case_rid=${caseId}`
    );

    if (response.data?.data?.caseTeamMembers) {
      return {
        team_members: response.data.data.caseTeamMembers,
        case_rid: caseId,
        created_by: '',
        created_on: '',
        updated_by: '',
        updated_on: '',
      };
    }

    return {
      team_members: [],
      case_rid: caseId,
      created_by: '',
      created_on: '',
      updated_by: '',
      updated_on: '',
    };
  } catch (error) {
    console.error('Error fetching case team:', error);
    return {
      team_members: [],
      case_rid: caseId,
      created_by: '',
      created_on: '',
      updated_by: '',
      updated_on: '',
    };
  }
};

const fetchRoleOptions = async (): Promise<RoleOption[]> => {
  try {
    const response = await caseServiceApi.get<RoleOptionsResponse>(
      '/api/cases/caseTeamRoles'
    );

    if (response.data?.data?.caseRoles) {
      return response.data.data.caseRoles;
    }
    return [];
  } catch (error) {
    console.error('Error fetching role options:', error);
    return [];
  }
};

const fetchUserOptions = async (
  accountId: string,
  scope?: string
): Promise<UserOption[]> => {
  try {
    let url = `/api/cases/caseTeam/users/${accountId}`;
    if (scope) {
      url += `?user_access_scope=${scope}`;
    }
    const response = await caseServiceApi.get<UserOptionsResponse>(url);

    if (response.data?.data?.users) {
      const uniqueUsers = Array.from(
        new Map(
          response.data.data.users.map((user: UserOption) => [user.rid, user])
        ).values()
      );
      const validUsers = uniqueUsers.filter(
        (user: UserOption) => user.rid && user.name
      );

      if (validUsers.length === 0) {
        console.warn(
          'No valid users returned from API. All users have missing rid or name.',
          response.data.data.users
        );
      }

      return validUsers;
    }
    return [];
  } catch (error) {
    console.error('Error fetching user options:', error);
    return [];
  }
};

const fetchTagOptions = async (
  payload: TagListPayload
): Promise<TagOption[]> => {
  try {
    const response = await caseServiceApi.post<TagOptionsResponse>(
      '/api/cases/tag/list',
      payload
    );

    if (response.data?.data) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching tag options:', error);
    return [];
  }
};

const fetchCollaboratorOptions = async (
  payload: CollaboratorListPayload
): Promise<CollaboratorOption[]> => {
  try {
    const response = await caseServiceApi.post<CollaboratorOptionsResponse>(
      '/api/cases/task/collaborator/list',
      payload
    );

    // Handle the actual API response format which returns data array directly
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching collaborator options:', error);
    return [];
  }
};

export const useGetCaseTeam = (
  caseId?: string,
  accountId?: string
): UseQueryResult<CaseTeamResponse | undefined, Error> => {
  return useQuery<CaseTeamResponse | undefined, Error>({
    queryKey: ['case-team', caseId, accountId],
    queryFn: () => fetchCaseTeam(caseId!, accountId!),
    retry: 0,
    gcTime: 0,
    enabled: !!caseId && !!accountId,
  });
};

export const useGetRoleOptions = (
  enabled: boolean = true
): UseQueryResult<RoleOption[] | undefined, Error> => {
  return useQuery<RoleOption[] | undefined, Error>({
    queryKey: ['case-team-role-options'],
    queryFn: () => fetchRoleOptions(),
    retry: 0,
    enabled,
  });
};

export const useGetUserOptions = (
  accountId?: string,
  enabled: boolean = true,
  scope?: string
): UseQueryResult<UserOption[] | undefined, Error> => {
  return useQuery<UserOption[] | undefined, Error>({
    queryKey: ['case-team-user-options', accountId, scope],
    queryFn: () => fetchUserOptions(accountId!, scope),
    retry: 0,
    gcTime: 0,
    enabled: enabled && !!accountId,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
};

export const useGetTagOptions = (
  payload?: TagListPayload,
  enabled: boolean = true
): UseQueryResult<TagOption[] | undefined, Error> => {
  return useQuery<TagOption[] | undefined, Error>({
    queryKey: [
      'case-tag-options',
      payload?.task_rid,
      payload?.account_rid,
      payload?.case_rid,
      payload?.action,
    ],
    queryFn: () => fetchTagOptions(payload!),
    retry: 0,
    enabled: enabled && !!payload?.account_rid,
  });
};

export const useGetCollaboratorOptions = (
  payload?: CollaboratorListPayload,
  enabled: boolean = true
): UseQueryResult<CollaboratorOption[] | undefined, Error> => {
  return useQuery<CollaboratorOption[] | undefined, Error>({
    queryKey: [
      'case-collaborator-options',
      payload?.case_rid,
      payload?.account_rid,
      payload?.rid,
    ],
    queryFn: () => fetchCollaboratorOptions(payload!),
    retry: 0,
    enabled: enabled && !!payload?.case_rid && !!payload?.account_rid,
  });
};

export const useGetCaseTeamMembersDropdown = (
  accountId?: string,
  caseId?: string,
  enabled: boolean = true
): UseQueryResult<CaseTeamMemberDropdown[] | undefined, Error> => {
  return useQuery<CaseTeamMemberDropdown[] | undefined, Error>({
    queryKey: ['case-team-members-dropdown', accountId, caseId],
    queryFn: () => fetchCaseTeamMembersDropdown(accountId!, caseId!),
    retry: 0,
    staleTime: 0, // Always fetch fresh data since users change often
    gcTime: 0,
    enabled: enabled && !!accountId,
  });
};

const updateCaseTeam = async (
  body: CaseTeamUpdatePayload
): Promise<CommonApiResponse> => {
  try {
    const response = await caseServiceApi.post<CommonApiResponse>(
      '/api/cases/createCaseTeam',
      body
    );

    return response.data;
  } catch (error) {
    console.error('Error updating case team:', error);
    throw error;
  }
};
export const useUpdateCaseTeam = () => {
  return useMutation<CommonApiResponse, Error, CaseTeamUpdatePayload>({
    mutationFn: (body) => updateCaseTeam(body),
  });
};

export const caseConfigDetailUrl = (
  accountId: string,
  level: string,
  caseId?: string
) =>
  `/api/jurisdictions/details/?accountRid=${accountId}&level=${level}${caseId ? `&caseRid=${caseId}` : ''}`;

export const fetchConfigFields = async (
  accountId: string,
  level: string,
  caseId?: string
): Promise<CaseConfigDetailsResponse> => {
  const { data } = await caseServiceApi.get<CaseConfigDetailsResponse>(
    caseConfigDetailUrl(accountId, level, caseId)
  );
  return data;
};

export const useFetchCasesConfigFields = (
  accountId: string,
  level: string,
  caseId?: string
) => {
  return useQuery<CaseConfigDetailsResponse, Error>({
    queryKey: ['configFields', accountId, level, caseId],
    queryFn: () => fetchConfigFields(accountId, level, caseId),
    enabled: !!accountId, // Only fetch if accountId exists
    staleTime: 0, // No cache
    gcTime: 0, // Immediately remove from cache
    retry: 0,
  });
};
export const getCaseConfigUrl = (): string => {
  return `/api/jurisdictions/add`;
};

export const updateCaseJurisdictionConfig = async (
  body: Partial<updateCaseJurisdictionPayload>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await caseServiceApi.post<CommonApiResponse>(
      getCaseConfigUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error updating case details:', error);
    throw error;
  }
};

export const useUpdateJurisdictionConfig = () => {
  return useMutation<
    CommonApiResponse,
    Error,
    Partial<updateCaseJurisdictionPayload>
  >({
    mutationFn: (body) => updateCaseJurisdictionConfig({ ...body }),
  });
};
export interface DeleteTagPayload {
  task_rid: string;
  account_rid: string;
  case_rid?: string;
  tag_rid: string[];
  task_type?: string;
}

export const deleteTag = async (
  payload: DeleteTagPayload
): Promise<CommonApiResponse> => {
  try {
    const response = await caseServiceApi.post<CommonApiResponse>(
      '/api/cases/tag/delete',
      payload
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting tag:', error);
    throw error;
  }
};

export const useDeleteTag = () => {
  return useMutation<CommonApiResponse, Error, DeleteTagPayload>({
    mutationFn: (payload) => deleteTag(payload),
  });
};
