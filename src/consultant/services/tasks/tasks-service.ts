import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  TaskList,
  TasksListURLParams,
  TasksListExportParams,
} from '../../types/task';

// Mock data generator
const generateMockTasks = (count: number = 50): TaskList[] => {
  const mockTasks: TaskList[] = [];
  const priorities = ['High', 'Medium', 'Low'];
  const statuses = ['Not Started', 'In Progress', 'Completed', 'On Hold'];
  const relatedEntities = ['Project', 'Case', 'Account', null];
  const assignees = [
    'John Doe',
    'Jane Smith',
    'Bob Johnson',
    'Alice Williams',
    null,
  ];

  for (let i = 1; i <= count; i++) {
    const priorityIndex = Math.floor(Math.random() * priorities.length);
    const statusIndex = Math.floor(Math.random() * statuses.length);
    const entityIndex = Math.floor(Math.random() * relatedEntities.length);
    const assigneeIndex = Math.floor(Math.random() * assignees.length);

    mockTasks.push({
      task_rid: `task-rid-${i}`,
      task_id: `TASK-${String(i).padStart(4, '0')}`,
      task_name: `Task ${i}: Sample Task Name`,
      task_description: i % 3 === 0 ? null : `Description for task ${i}`,
      fiscal_year: 2024 + Math.floor(i / 20),
      assignee: assignees[assigneeIndex],
      assignee_rid: assignees[assigneeIndex]
        ? `assignee-rid-${assigneeIndex}`
        : null,
      priority: priorities[priorityIndex],
      priority_rid: `priority-rid-${priorityIndex}`,
      status: statuses[statusIndex],
      status_rid: `status-rid-${statusIndex}`,
      related_entity: relatedEntities[entityIndex],
      related_to_id: relatedEntities[entityIndex]
        ? `entity-id-${Math.floor(Math.random() * 100)}`
        : null,
      related_to_name: relatedEntities[entityIndex]
        ? `${relatedEntities[entityIndex]} Name ${Math.floor(Math.random() * 100)}`
        : null,
      created_by: 'System Admin',
      created_on: new Date(
        Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000
      ).toISOString(),
      modified_by: i % 4 === 0 ? null : 'John Doe',
      modified_on:
        i % 4 === 0
          ? null
          : new Date(
              Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
    });
  }

  return mockTasks;
};

// Mock data storage
let mockTasksData = generateMockTasks(100);

// Fetch tasks list with filtering, sorting, and pagination
export const fetchTasksList = async (
  params: TasksListURLParams
): Promise<{ tasks: TaskList[]; count: number }> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  let filteredTasks = [...mockTasksData];

  // Apply search filter
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filteredTasks = filteredTasks.filter(
      (task) =>
        task.task_id.toLowerCase().includes(searchLower) ||
        task.task_name.toLowerCase().includes(searchLower) ||
        task.task_description?.toLowerCase().includes(searchLower) ||
        task.assignee?.toLowerCase().includes(searchLower)
    );
  }

  // Apply fiscal year filter
  if (params.fiscalYear && params.fiscalYear !== 0) {
    filteredTasks = filteredTasks.filter(
      (task) => task.fiscal_year === Number(params.fiscalYear)
    );
  }

  // Apply sorting
  if (params.sortBy) {
    filteredTasks.sort((a, b) => {
      const aValue = a[params.sortBy as keyof TaskList];
      const bValue = b[params.sortBy as keyof TaskList];

      if (aValue === null) return 1;
      if (bValue === null) return -1;

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;

      return params.sortOrder === 'ASC' ? comparison : -comparison;
    });
  }

  const totalCount = filteredTasks.length;

  // Apply pagination
  const startIndex = (params.page - 1) * params.limit;
  const endIndex = startIndex + params.limit;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

  return {
    tasks: paginatedTasks,
    count: totalCount,
  };
};

// Hook for fetching all tasks list
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

// Hook for fetching tasks list with specific conditions
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

// Export tasks data
type ExportType = 'tasks' | 'all_tasks';
export const exportTasksData = async (
  type: ExportType,
  params: TasksListExportParams
) => {
  // This is a placeholder for actual export functionality
  // In a real implementation, this would call an API endpoint
  console.log('Exporting tasks data:', type, params);

  // Simulate export by creating a mock CSV
  const tasks = await fetchTasksList({
    page: 1,
    limit: 1000,
    sortBy: params.sortBy || 'task_id',
    sortOrder: params.sortOrder || 'ASC',
    search: params.search,
    fiscalYear: params.fiscalYear,
  });

  const csvContent = [
    [
      'Task ID',
      'Task Name',
      'Task Description',
      'Fiscal Year',
      'Assignee',
      'Priority',
      'Status',
      'Related Entity',
      'Related To ID',
      'Related To Name',
      'Created By',
      'Created On',
      'Modified By',
      'Modified On',
    ].join(','),
    ...tasks.tasks.map((task) =>
      [
        task.task_id,
        `"${task.task_name}"`,
        `"${task.task_description || ''}"`,
        task.fiscal_year,
        task.assignee || '',
        task.priority || '',
        task.status,
        task.related_entity || '',
        task.related_to_id || '',
        task.related_to_name || '',
        task.created_by,
        task.created_on,
        task.modified_by || '',
        task.modified_on || '',
      ].join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download =
    type === 'all_tasks' ? 'all_tasks_records.csv' : 'tasks_records.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
