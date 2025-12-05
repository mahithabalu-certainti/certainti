import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { caseServiceApi } from '../../../api/api';
import { TasksListURL, TasksExportListURL } from '../urls/tasks-url';
import {
  TaskList,
  TaskListResponse,
  TasksListExportParams,
  TasksListURLParams,
} from '../../types/task';

// TODO: Remove mock data when API is deployed
const mockTasksData: TaskList[] = [
  {
    rid: 'D001-4adedb04-04e3-4fb2-bbb4-78fa6c0bf039',
    r_number: 'ACT-0000000218',
    created_by: 'D001-1682d813-3f67-4874-b7a9-5c3b24d8c529',
    modified_by: null,
    created_datetime: '2025-12-05T08:37:21.867Z',
    modified_datetime: null,
    account_rid: 'D001-060a9a07-ce96-4c4b-8072-00fec00c9ac3',
    attach_to: 'Gamma CASE',
    attachment_level: 'case',
    task_name: 'Internal Review',
    description: '',
    fiscal_year: 2023,
    assigned_to: 'D001-ddef1245-b58c-40d6-a88e-b00dea8dbedd',
    status_rid: 'D001-e8450e3f-edcb-44fb-a22c-15d279162b11',
    priority_rid: 'D001-bfddbba3-79d6-4f90-a459-f9c2420f0973',
    effective_start_datetime: '2023-03-01T00:00:00.000Z',
    effective_end_datetime: '2023-10-25T00:00:00.000Z',
    task_rid: 'D001-a0c271f4-b75e-4a0f-98be-b2921a8df374',
    created_by_name: 'Vishnu Varshini',
    modified_by_name: null,
    status_name: null,
    priority_name: null,
    assigned_to_name: 'D001-ddef1245-b58c-40d6-a88e-b00dea8dbedd',
    account_status_rid: 'D001-5c952c6a-7f05-4e99-be04-97ea50bcf87b',
    account_status_name: 'Active',
  },
  {
    rid: 'D001-1fcbc333-7fdf-47ff-aafb-233766b78f7b',
    r_number: 'ACT-0000000195',
    created_by: 'D001-09c06141-8832-472f-9a88-74cd917a45bb',
    modified_by: null,
    created_datetime: '2025-12-01T11:11:25.172Z',
    modified_datetime: null,
    account_rid: 'D001-f5f3d900-8688-4f17-a578-8ab539f6fdb9',
    attach_to: 'Brilliant',
    attachment_level: 'account',
    task_name: 'Test123',
    description: 'Test',
    fiscal_year: 2025,
    assigned_to: 'D001-775fa634-bde0-47d7-b59b-c37a9a27bfd8',
    status_rid: 'D001-abdb8f37-77c7-467b-a476-179fc62906cc',
    priority_rid: 'D001-0af56b99-c383-4b8b-90af-e54a249247b5',
    effective_start_datetime: '2025-11-18T00:00:00.000Z',
    effective_end_datetime: '2025-11-21T00:00:00.000Z',
    task_rid: 'D001-94b5ef85-d5fe-4d92-8f43-94b8112ed381',
    created_by_name: 'Super User Certainti',
    modified_by_name: null,
    status_name: null,
    priority_name: null,
    assigned_to_name: 'D001-775fa634-bde0-47d7-b59b-c37a9a27bfd8',
    account_status_rid: 'D001-5c952c6a-7f05-4e99-be04-97ea50bcf87b',
    account_status_name: 'Active',
  },
  {
    rid: 'D001-8692adf8-d8a7-410e-a8b8-b799772797b0',
    r_number: 'ACT-0000000188',
    created_by: 'D001-09c06141-8832-472f-9a88-74cd917a45bb',
    modified_by: 'D001-caace427-6365-469d-b8e5-d6322da67d40',
    created_datetime: '2025-12-01T07:31:12.681Z',
    modified_datetime: '2025-12-01T08:18:42.288Z',
    account_rid: 'D001-f5f3d900-8688-4f17-a578-8ab539f6fdb9',
    attach_to: 'Brilliant',
    attachment_level: 'account',
    task_name: 'test',
    description: '',
    fiscal_year: 2021,
    assigned_to: 'D001-0f338c28-e420-4922-9ae2-b8c87b67db75',
    status_rid: 'D001-e8450e3f-edcb-44fb-a22c-15d279162b11',
    priority_rid: 'D001-0af56b99-c383-4b8b-90af-e54a249247b5',
    effective_start_datetime: '2025-11-02T00:00:00.000Z',
    effective_end_datetime: '2025-12-01T00:00:00.000Z',
    task_rid: 'D001-1f9a55e8-29e9-450b-b27a-f52b00b74d66',
    created_by_name: 'Super User Certainti',
    modified_by_name: 'Dhivya Sivasamy',
    status_name: null,
    priority_name: null,
    assigned_to_name: 'D001-0f338c28-e420-4922-9ae2-b8c87b67db75',
    account_status_rid: 'D001-5c952c6a-7f05-4e99-be04-97ea50bcf87b',
    account_status_name: 'Active',
  },
  {
    rid: 'D001-54ab4206-cf50-4290-bf3b-f0b7e462a61d',
    r_number: 'ACT-0000000187',
    created_by: 'D001-09c06141-8832-472f-9a88-74cd917a45bb',
    modified_by: '',
    created_datetime: '2025-12-01T06:40:13.393Z',
    modified_datetime: '2025-12-01T06:48:18.959Z',
    account_rid: 'D001-f5f3d900-8688-4f17-a578-8ab539f6fdb9',
    attach_to: 'Brilliant',
    attachment_level: 'account',
    task_name: 'test',
    description: '',
    fiscal_year: 2020,
    assigned_to: 'D001-9e3cc824-157e-41ac-b90a-187c163b3680',
    status_rid: 'D001-e8450e3f-edcb-44fb-a22c-15d279162b11',
    priority_rid: 'D001-0af56b99-c383-4b8b-90af-e54a249247b5',
    effective_start_datetime: '2025-11-02T00:00:00.000Z',
    effective_end_datetime: '2025-11-30T00:00:00.000Z',
    task_rid: 'D001-159607d6-7aaa-4b60-88de-0e4e1f743e60',
    created_by_name: 'Super User Certainti',
    modified_by_name: '',
    status_name: null,
    priority_name: null,
    assigned_to_name: 'D001-9e3cc824-157e-41ac-b90a-187c163b3680',
    account_status_rid: 'D001-5c952c6a-7f05-4e99-be04-97ea50bcf87b',
    account_status_name: 'Active',
  },
  {
    rid: 'D001-77394b8f-2ba0-4aa7-8351-3026569a4592',
    r_number: 'ACT-0000000003',
    created_by: 'D001-caace427-6365-469d-b8e5-d6322da67d40',
    modified_by: null,
    created_datetime: '2025-12-01T06:37:12.630Z',
    modified_datetime: null,
    account_rid: 'D001-5d9f3cf1-1aed-4c20-9268-b755c7a8fb24',
    attach_to: 'freshwork-USA',
    attachment_level: 'account',
    task_name: 'Test',
    description: 'Test',
    fiscal_year: 2025,
    assigned_to: 'D001-5e333040-c8e8-4f9e-888b-d9f0614b5f0a',
    status_rid: 'D001-e8450e3f-edcb-44fb-a22c-15d279162b11',
    priority_rid: 'D001-0af56b99-c383-4b8b-90af-e54a249247b5',
    effective_start_datetime: '2025-11-11T00:00:00.000Z',
    effective_end_datetime: '2025-11-13T00:00:00.000Z',
    task_rid: 'D001-05552407-a07f-4df3-86b1-d41485a0bde9',
    created_by_name: 'Dhivya Sivasamy',
    modified_by_name: null,
    status_name: null,
    priority_name: null,
    assigned_to_name: 'D001-5e333040-c8e8-4f9e-888b-d9f0614b5f0a',
    account_status_rid: 'D001-5c952c6a-7f05-4e99-be04-97ea50bcf87b',
    account_status_name: 'Active',
  },
];

export const fetchTasksList = async (
  params: TasksListURLParams
): Promise<{ tasks: TaskList[]; count: number }> => {
  // TODO: Uncomment when API is deployed
  // const response = await caseServiceApi.get<TaskListResponse>(
  //   TasksListURL(params)
  // );
  // return {
  //   tasks: response.data.data.tasks,
  //   count: response.data.data.count || response.data.data.totalCount,
  // };

  // Mock response - Remove when API is deployed
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    tasks: mockTasksData,
    count: mockTasksData.length,
  };
};

export const useTasksList = (
  params: TasksListURLParams,
  refreshTasks?: number
): UseQueryResult<{ tasks: TaskList[]; count: number }, Error> => {
  return useQuery<{ tasks: TaskList[]; count: number }, Error>({
    queryKey: ['tasksList', params, refreshTasks],
    queryFn: () => fetchTasksList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.isGlobal,
  });
};

export const useAllTasksList = (
  params: TasksListURLParams,
  refreshTrigger?: number
): UseQueryResult<{ tasks: TaskList[]; count: number }, Error> => {
  return useQuery<{ tasks: TaskList[]; count: number }, Error>({
    queryKey: ['allTasksList', params, refreshTrigger],
    queryFn: () => fetchTasksList(params),
    retry: 0,
    gcTime: 0,
  });
};

type ExportType = 'tasks' | 'all_tasks';
export const exportTasksData = async (
  type: ExportType,
  params: TasksListExportParams
) => {
  let url = '';
  let filename = '';

  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  switch (type) {
    case 'tasks':
      url = TasksExportListURL({ ...params, timezone: systemTimezone });
      filename = 'tasks_records.xlsx';
      break;
    case 'all_tasks':
      url = TasksExportListURL({ ...params, timezone: systemTimezone });
      filename = 'all_tasks_records.xlsx';
      break;
    default:
      console.error('Invalid export type');
      return;
  }

  try {
    const response = await caseServiceApi.get(url);
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
