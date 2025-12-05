export type TaskList = {
  task_rid: string;
  task_id: string;
  task_name: string;
  task_description: string | null;
  fiscal_year: number;
  assignee: string | null;
  assignee_rid: string | null;
  priority: string | null;
  priority_rid: string | null;
  status: string;
  status_rid: string;
  related_entity: string | null;
  related_to_id: string | null;
  related_to_name: string | null;
  created_by: string;
  created_on: string;
  modified_by: string | null;
  modified_on: string | null;
};

export interface GlobalFilters {
  [key: string]: string[];
}

export interface TasksListURLParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  globalFilters?: GlobalFilters;
  isGlobal?: boolean;
  search?: string;
}

export type TaskListResponse = {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    tasks: TaskList[];
    count: number;
    totalCount: number;
  };
};

export interface TasksListExportParams {
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  globalFilters?: GlobalFilters;
  timezone?: string;
  page?: number;
  limit?: number;
  search?: string;
}
