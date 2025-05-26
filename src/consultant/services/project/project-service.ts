import {
    useQuery,
    UseQueryOptions,
    UseQueryResult,
  } from "@tanstack/react-query";
  import {
    ProjectList,
    ProjectListParams,
    ProjectListResponse,
  } from "../../types/project";
  import { resourceServiceApi } from "../../../api/api";
  import { ProjectListURL } from "../urls";

  // export const mockProjectList: ProjectList[] = [
  //   {
  //     id: '4dlb90gd-88e1-2352-a90c-66c2fe07e41c',
  //     account_number: 'ACC001',
  //     account_name: 'Alpha Corp',
  //     r_number: 'PROJ-001',
  //     project_ref_id: 'REF-001-A',
  //     industry: 'Technology',
  //     project_start_date: '2024-01-15',
  //     project_end_date: '2024-06-30',
  //     project_type: 'Development',
  //     project_classification: 'Confidential',
  //     project_client_group: 'Enterprise',
  //     project_group: 'Group A',
  //     project_status:'Active',
  //   },
  //   {
  //     id: '1a834c7a-5c7b-4c92-b59a-c0bb34ea4cb2',
  //     account_number: 'ACC002',
  //     account_name: 'Beta Solutions',
  //     project_number: 'PROJ-002',
  //     project_ref_id: 'REF-002-B',
  //     industry: 'Healthcare',
  //     project_start_date: '2024-03-01',
  //     project_end_date: '2024-09-15',
  //     project_type: 'Research',
  //     project_classification: 'Internal',
  //     project_client_group: 'SMB',
  //     project_group: 'Group B',
  //     status: 'In Progress',
  //   },
  //   {
  //     id: 'c3dfd5e5-9f0c-4d1e-94a3-2b35f1c2cb2f',
  //     account_number: 'ACC003',
  //     account_name: 'Gamma Industries',
  //     project_number: 'PROJ-003',
  //     project_ref_id: 'REF-003-C',
  //     industry: 'Finance',
  //     project_start_date: '2023-11-20',
  //     project_end_date: '2024-05-20',
  //     project_type: 'Audit',
  //     project_classification: 'External',
  //     project_client_group: 'Corporate',
  //     project_group: 'Group C',
  //     status: 'Completed',
  //   },
  //   {
  //     id: 'e4a45b15-f3d0-4ac6-b949-33bb2ad85f8e',
  //     account_number: 'ACC004',
  //     account_name: 'Delta Enterprises',
  //     project_number: 'PROJ-004',
  //     project_ref_id: 'REF-004-D',
  //     industry: 'Manufacturing',
  //     project_start_date: '2024-02-10',
  //     project_end_date: '2024-08-10',
  //     project_type: 'Implementation',
  //     project_classification: 'Restricted',
  //     project_client_group: 'Enterprise',
  //     project_group: 'Group D',
  //     status: 'On Hold',
  //   },
  //   {
  //     id: 'f3d89434-05c3-4fcd-96c2-53ff91e5e251',
  //     account_number: 'ACC005',
  //     account_name: 'Epsilon Tech',
  //     project_number: 'PROJ-005',
  //     project_ref_id: 'REF-005-E',
  //     industry: 'Education',
  //     project_start_date: '2024-04-01',
  //     project_end_date: '2024-10-01',
  //     project_type: 'Migration',
  //     project_classification: 'Open',
  //     project_client_group: 'Public Sector',
  //     project_group: 'Group E',
  //     status: 'Planned',
  //   },
  // ];  
  
  export const fetchProjects = async (
    params: ProjectListParams
  ): Promise<{ projects: ProjectList[]; count: number }> => {
    const response = await resourceServiceApi.get<ProjectListResponse>(
      ProjectListURL(params)
      
    );
 
    return {
      projects: response.data.data.projects,
      count: response.data.data.projects.length,
    };
  };
  
  export const useAccountProjects = (
    params: ProjectListParams,
    options?: UseQueryOptions<{ projects: ProjectList[]; count: number }, Error>
  ): UseQueryResult<{ projects: ProjectList[]; count: number }, Error> => {
    return useQuery<{ projects: ProjectList[]; count: number }, Error>({
      queryKey: ["accountProjects", params],
      queryFn: () => fetchProjects(params),
      retry: 0,
      ...options,
    });
  };
  
  export const useAllProjects = (
    params: ProjectListParams,
    options?: UseQueryOptions<{ projects: ProjectList[]; count: number }, Error>
  ): UseQueryResult<{ projects: ProjectList[]; count: number }, Error> => {
    return useQuery<{ projects: ProjectList[]; count: number }, Error>({
      queryKey: ["allProjects", params],
      queryFn: () => fetchProjects(params),
      retry: 0,
      ...options,
    });
  };