import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';

import { CommonApiResponse } from '../../../common-service';

// Types for Case Team API
export interface CaseTeamMember {
  rid?: string;
  user_id: string;
  user_name: string;
  user_role: string;
}

export interface CaseTeamResponse {
  team_members: CaseTeamMember[];
  case_rid: string;
  created_by: string;
  created_on: string;
  updated_by: string;
  updated_on: string;
}

export interface CaseTeamListResponse extends CommonApiResponse {
  data: {
    caseTeam: CaseTeamResponse;
  };
}

export interface CaseTeamUpdatePayload {
  case_rid: string;
  team_members: Omit<CaseTeamMember, 'rid'>[];
}

// Types for Role Options API
export interface RoleOption {
  rid: string;
  role_name: string;
  role_description?: string;
  status: string;
}

export interface RoleOptionsResponse extends CommonApiResponse {
  data: {
    roles: RoleOption[];
  };
}

// Types for User Options API
export interface UserOption {
  rid: string;
  user_name: string;
  email: string;
  status: string;
}

export interface UserOptionsResponse extends CommonApiResponse {
  data: {
    users: UserOption[];
  };
}

// Mock data for development/testing
export const mockCaseTeamData: CaseTeamResponse = {
  case_rid: 'case_123',
  team_members: [
    {
      rid: 'member_1',
      user_id: 'MEM_001',
      user_name: 'John',
      user_role: 'Project Manager',
    },
    {
      rid: 'member_2',
      user_id: 'MEM_002',
      user_name: 'Jane',
      user_role: 'Developer',
    },
    {
      rid: 'member_3',
      user_id: 'MEM_003',
      user_name: 'Mike',
      user_role: 'Designer',
    },
  ],
  created_by: 'admin',
  created_on: '2024-01-10T00:00:00Z',
  updated_by: 'admin',
  updated_on: '2024-01-15T00:00:00Z',
};

// Mock data for role options
export const mockRoleOptionsData: RoleOption[] = [
  {
    rid: 'role_1',
    role_name: 'Project Manager',
    role_description: 'Manages project execution and team coordination',
    status: 'Active',
  },
  {
    rid: 'role_2',
    role_name: 'Developer',
    role_description: 'Develops and maintains software applications',
    status: 'Active',
  },
  {
    rid: 'role_3',
    role_name: 'Designer',
    role_description: 'Creates UI/UX designs and user interfaces',
    status: 'Active',
  },
  {
    rid: 'role_4',
    role_name: 'Analyst',
    role_description: 'Analyzes requirements and business processes',
    status: 'Active',
  },
  {
    rid: 'role_5',
    role_name: 'QA Engineer',
    role_description: 'Ensures quality through testing and validation',
    status: 'Active',
  },
  {
    rid: 'role_6',
    role_name: 'DevOps Engineer',
    role_description: 'Manages deployment and infrastructure',
    status: 'Active',
  },
];

// Mock data for user options
export const mockUserOptionsData: UserOption[] = [
  {
    rid: 'user_1',
    user_name: 'John',
    email: 'john@company.com',
    status: 'Active',
  },
  {
    rid: 'user_2',
    user_name: 'Jane',
    email: 'jane@company.com',
    status: 'Active',
  },
  {
    rid: 'user_3',
    user_name: 'Mike',
    email: 'mike@company.com',
    status: 'Active',
  },
  {
    rid: 'user_4',
    user_name: 'Sarah',
    email: 'sarah@company.com',
    status: 'Active',
  },
  {
    rid: 'user_5',
    user_name: 'David',
    email: 'david@company.com',
    status: 'Active',
  },
  {
    rid: 'user_6',
    user_name: 'Emily',
    email: 'emily@company.com',
    status: 'Active',
  },
  {
    rid: 'user_7',
    user_name: 'Chris',
    email: 'chris@company.com',
    status: 'Active',
  },
  {
    rid: 'user_8',
    user_name: 'Lisa',
    email: 'lisa@company.com',
    status: 'Active',
  },
];

// Fetch case team data - returns mock data without API call
const fetchCaseTeam = async (caseId: string): Promise<CaseTeamResponse> => {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Return mock data with case ID
    return {
      ...mockCaseTeamData,
      case_rid: caseId,
    };
  } catch (error) {
    console.error('Error fetching case team:', error);
    return mockCaseTeamData;
  }
};

// Fetch role options - returns mock data without API call
const fetchRoleOptions = async (): Promise<RoleOption[]> => {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Return mock data
    return mockRoleOptionsData.filter((role) => role.status === 'Active');
  } catch (error) {
    console.error('Error fetching role options:', error);
    return mockRoleOptionsData;
  }
};

// Fetch user options - returns mock data without API call
const fetchUserOptions = async (): Promise<UserOption[]> => {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Return mock data
    return mockUserOptionsData.filter((user) => user.status === 'Active');
  } catch (error) {
    console.error('Error fetching user options:', error);
    return mockUserOptionsData;
  }
};

// Custom hook to get case team data
export const useGetCaseTeam = (
  caseId?: string
): UseQueryResult<CaseTeamResponse | undefined, Error> => {
  return useQuery<CaseTeamResponse | undefined, Error>({
    queryKey: ['case-team', caseId],
    queryFn: () => fetchCaseTeam(caseId!),
    retry: 0,
    gcTime: 0,
    enabled: !!caseId,
  });
};

// Custom hook to get role options
export const useGetRoleOptions = (
  enabled: boolean = true
): UseQueryResult<RoleOption[] | undefined, Error> => {
  return useQuery<RoleOption[] | undefined, Error>({
    queryKey: ['case-team-role-options'],
    queryFn: () => fetchRoleOptions(),
    retry: 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    enabled,
  });
};

// Custom hook to get user options
export const useGetUserOptions = (
  enabled: boolean = true
): UseQueryResult<UserOption[] | undefined, Error> => {
  return useQuery<UserOption[] | undefined, Error>({
    queryKey: ['case-team-user-options'],
    queryFn: () => fetchUserOptions(),
    retry: 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    enabled,
  });
};

// Update case team - simulates API call without hitting endpoint
const updateCaseTeam = async (
  body: CaseTeamUpdatePayload
): Promise<CommonApiResponse> => {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Log the payload for debugging
    console.log('Case team update payload:', body);

    // Return successful response matching CommonApiResponse type
    return {
      statusCode: 200,
      statusCodeValue: 'OK',
      statusMessage: 'Case team updated successfully',
    };
  } catch (error) {
    console.error('Error updating case team:', error);
    throw error;
  }
};

// Custom hook to update case team
export const useUpdateCaseTeam = () => {
  return useMutation<CommonApiResponse, Error, CaseTeamUpdatePayload>({
    mutationFn: (body) => updateCaseTeam(body),
  });
};
