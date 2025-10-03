import { resourceServiceApi } from '../../../api/api';
import {
  ProjectResourceCodeResponse,
  ProjectResourceTaskCodeResponse,
  ProjectResourceTaskTypeResponse,
  PRSkillSubTypeResponse,
  RoleSkillResponse,
} from '../../types/project-resources';
import { useQuery } from '@tanstack/react-query';

// Get Project Resource Code Api
export const useGetProjectResourceCode = (accountId: string) => {
  return useQuery<ProjectResourceCodeResponse, Error>({
    queryKey: ['getProjectResourceCode', accountId],
    queryFn: () => {
      if (!accountId) throw new Error('Missing accountId');
      return fetchProjectResourceCode(accountId);
    },
    enabled: !!accountId,
    retry: 0,
    gcTime: 0, // Never delete from cache
    refetchOnMount: true, // Don't refetch on component mount
    refetchOnReconnect: true, // Don't refetch on reconnect
  });
};
export const useGetProjectResourceTaskCode = (payload: {
  account_rid?: string;
  search?: string;
}) => {
  return useQuery<ProjectResourceTaskCodeResponse, Error>({
    queryKey: ['getProjectResourceCode', payload],
    queryFn: () => {
      if (!payload.account_rid) throw new Error('Missing accountId');
      return fetchProjectResourceTaskCode(payload);
    },
    // enabled: !!payload.account_rid,
    retry: 0,
    gcTime: 0, // Never delete from cache
    refetchOnMount: true, // Don't refetch on component mount
    refetchOnReconnect: true, // Don't refetch on reconnect
  });
};
export const useGetProjectResourceTaskType = (endPoint: string) => {
  return useQuery<ProjectResourceTaskTypeResponse, Error>({
    queryKey: ['getProjectResourceType', endPoint],
    queryFn: () => {
      return fetchProjectResourceTaskType(endPoint);
    },
    // enabled: !!payload.account_rid,
    retry: 0,
    gcTime: 0, // Never delete from cache
    refetchOnMount: true, // Don't refetch on component mount
    refetchOnReconnect: true, // Don't refetch on reconnect
  });
};
export const useGetAppliedProjectResourceCode = (
  accountId: string,
  projectID: string,
  resourceType: string
) => {
  return useQuery<ProjectResourceCodeResponse, Error>({
    queryKey: ['getAppliedProjectResourceCode', accountId],
    queryFn: () => {
      if (!accountId) throw new Error('Missing accountId');
      return fetchAppliedProjectResourceCode(
        accountId,
        projectID,
        resourceType
      );
    },
    enabled: !!accountId && !!projectID && !!resourceType,
    retry: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};

export const fetchProjectResourceCode = async (
  accountId: string
): Promise<ProjectResourceCodeResponse> => {
  try {
    const { data } = await resourceServiceApi.get<ProjectResourceCodeResponse>(
      getProjectResourceCodeUrl(accountId)
    );
    return data;
  } catch (error) {
    console.error('Error fetching resource type:', error);
    throw error;
  }
};
export const fetchProjectResourceTaskCode = async (payload: {
  account_rid?: string;
  search?: string;
}): Promise<ProjectResourceTaskCodeResponse> => {
  try {
    const { data } =
      await resourceServiceApi.post<ProjectResourceTaskCodeResponse>(
        getProjectResourceTaskCodeUrl(),
        payload
      );
    return data;
  } catch (error) {
    console.error('Error fetching resource type:', error);
    throw error;
  }
};
export const fetchProjectResourceTaskType = async (
  endPoint: string
): Promise<ProjectResourceTaskTypeResponse> => {
  try {
    const { data } =
      await resourceServiceApi.get<ProjectResourceTaskTypeResponse>(
        getProjectResourceTaskTypeUrl(endPoint)
      );
    return data;
  } catch (error) {
    console.error('Error fetching resource type:', error);
    throw error;
  }
};
export const fetchAppliedProjectResourceCode = async (
  accountId: string,
  projectId: string,
  resourceType: string
): Promise<ProjectResourceCodeResponse> => {
  try {
    const { data } = await resourceServiceApi.get<ProjectResourceCodeResponse>(
      getAppliedProjectResourceCodeUrl(accountId, projectId, resourceType)
    );
    return data;
  } catch (error) {
    console.error('Error fetching resource type:', error);
    throw error;
  }
};

export const getProjectResourceCodeUrl = (accountId: string): string => {
  return `/api/project_resources/resourcecodes/${accountId}`;
};
export const getProjectResourceTaskCodeUrl = (): string => {
  return `/api/project_tasks/resourcecodes/`;
};
export const getProjectResourceTaskTypeUrl = (endPoint: string): string => {
  return `/api/project_tasks/${endPoint}`;
};
export const getAppliedProjectResourceCodeUrl = (
  accountId: string,
  projectId: string,
  resourceType: string
): string => {
  return `/api/${resourceType}/assignedcodes/${accountId}/${projectId}`;
};

// Get Project Resource Skill Type Api
export const useGetProjectResourceSkillType = () => {
  return useQuery<PRSkillSubTypeResponse, Error>({
    queryKey: ['getProjectResourceSkillType'],
    queryFn: () => {
      return fetchProjectResourceSkillType();
    },
    retry: 0,
    gcTime: 0, // Never delete from cache
    refetchOnMount: true, // Don't refetch on component mount
    refetchOnReconnect: true, // Don't refetch on reconnect
  });
};

export const fetchProjectResourceSkillType =
  async (): Promise<PRSkillSubTypeResponse> => {
    try {
      const { data } = await resourceServiceApi.get<PRSkillSubTypeResponse>(
        getProjectResourceSkillTypeUrl()
      );
      return data;
    } catch (error) {
      console.error('Error fetching resource type:', error);
      throw error;
    }
  };

export const getProjectResourceSkillTypeUrl = (): string => {
  return `/api/project_resources/skillSubtype`;
};

// Get Project Resource Roll Skill Api
export const useGetProjectResourceRollSkill = () => {
  return useQuery<RoleSkillResponse, Error>({
    queryKey: ['getProjectResourceRollSkill'],
    queryFn: () => {
      return fetchProjectResourceRollSkill();
    },
    retry: 0,
    gcTime: 0, // Never delete from cache
    refetchOnMount: true, // Don't refetch on component mount
    refetchOnReconnect: true, // Don't refetch on reconnect
  });
};

export const fetchProjectResourceRollSkill =
  async (): Promise<RoleSkillResponse> => {
    try {
      const { data } = await resourceServiceApi.get<RoleSkillResponse>(
        getProjectResourceRollSkillUrl()
      );
      return data;
    } catch (error) {
      console.error('Error fetching resource type:', error);
      throw error;
    }
  };

export const getProjectResourceRollSkillUrl = (): string => {
  return `/api/project_resources/skillroles`;
};
