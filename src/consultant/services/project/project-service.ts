import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  GetProjectTypeApiResponse,
  // ProjectList,
  ProjectListParams,
  // ProjectListResponse,
} from '../../types/project';
import { accountServiceApi, resourceServiceApi } from '../../../api/api';
import { ProjectExportListURL, ProjectListURL } from '../urls';
import {
  ProjectAccordionResponse,
  Project,
} from '../../../components/table/types';

export const fetchProjects = async (
  params: ProjectListParams
): Promise<{ projects: Project[]; count: number }> => {
  const response = await resourceServiceApi.get<ProjectAccordionResponse>(
    ProjectListURL(params)
  );

  return {
    projects: response.data.data.projects,
    count: response.data.data.count ?? response.data.data.totalCount ?? 0,
  };
};

export const useAccountProjects = (
  params: ProjectListParams,
  projectOverviewIsEnable?: boolean,
  refreshProjectsTrigger?: number
): UseQueryResult<{ projects: Project[]; count: number }, Error> => {
  return useQuery<{ projects: Project[]; count: number }, Error>({
    queryKey: ['accountProjects', params, refreshProjectsTrigger],
    queryFn: () => fetchProjects(params),
    retry: 0,
    enabled: projectOverviewIsEnable,
  });
};
export const useAllProjects = (
  params: ProjectListParams,
  refreshProjectsTrigger?: number
): UseQueryResult<{ projects: Project[]; count: number }, Error> => {
  return useQuery<{ projects: Project[]; count: number }, Error>({
    queryKey: ['allProjects', params, refreshProjectsTrigger],
    queryFn: () => fetchProjects(params),
    retry: 0,
    enabled: !!refreshProjectsTrigger,
  });
};

type ExportType = 'project' | 'projectall';
export const exportProjectData = async (
  type: ExportType,
  params: ProjectListParams = {}
) => {
  let url = '';
  let filename = '';

  switch (type) {
    case 'project':
      url = ProjectExportListURL(params);
      filename = 'project_records.xlsx';
      break;
    case 'projectall':
      url = ProjectExportListURL(params);
      filename = 'allProject_records.xlsx';
      break;
    default:
      console.error('Invalid export type');
      return;
  }

  try {
    const response = await resourceServiceApi.get(url);
    const base64Data = response.data?.data;

    if (!base64Data) {
      console.error('No base64 data found in the response.');
      return;
    }

    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Export failed:', error);
  }
};

export const getProjectTypeUrl = (): string => {
  return `/api/accounts/projectType`;
};

export const fetchProjectType =
  async (): Promise<GetProjectTypeApiResponse> => {
    try {
      const { data } =
        await accountServiceApi.get<GetProjectTypeApiResponse>(
          getProjectTypeUrl()
        );
      return data;
    } catch (error) {
      console.error('Error fetching project types:', error);
      throw error;
    }
  };

export const useGetProjectType = () => {
  return useQuery<GetProjectTypeApiResponse, Error>({
    queryKey: ['getProjectType'],
    queryFn: () => fetchProjectType(),
    retry: 0,
    staleTime: Infinity, // Cache data forever until manually invalidated
    gcTime: Infinity, // Never delete from cache
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
};
