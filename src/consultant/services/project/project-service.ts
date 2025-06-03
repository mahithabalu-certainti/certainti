import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import {
  ProjectList,
  ProjectListParams,
  ProjectListResponse,
} from '../../types/project';
import { resourceServiceApi } from '../../../api/api';
import { ProjectExportListURL, ProjectListURL } from '../urls';

export const fetchProjects = async (
  params: ProjectListParams
): Promise<{ projects: ProjectList[]; count: number }> => {
  const response = await resourceServiceApi.get<ProjectListResponse>(
    ProjectListURL(params)
  );

  return {
    projects: response.data.data.projects,
    count: response.data.data.count,
  };
};

export const useAccountProjects = (
  params: ProjectListParams,
  projectOverviewIsEnable?: boolean
): UseQueryResult<{ projects: ProjectList[]; count: number }, Error> => {
  return useQuery<{ projects: ProjectList[]; count: number }, Error>({
    queryKey: ['accountProjects', params],
    queryFn: () => fetchProjects(params),
    retry: 0,
    enabled: projectOverviewIsEnable,
  });
};

export const useAllProjects = (
  params: ProjectListParams,
  options?: UseQueryOptions<{ projects: ProjectList[]; count: number }, Error>
): UseQueryResult<{ projects: ProjectList[]; count: number }, Error> => {
  return useQuery<{ projects: ProjectList[]; count: number }, Error>({
    queryKey: ['allProjects', params],
    queryFn: () => fetchProjects(params),
    retry: 0,
    ...options,
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
