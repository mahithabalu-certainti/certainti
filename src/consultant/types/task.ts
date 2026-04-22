export type TaskList = {
  rid: string;
  r_number: string;
  created_by: string;
  modified_by: string | null;
  created_datetime: string;
  modified_datetime: string | null;
  account_rid: string;
  account_name?: string;
  attach_to: string;
  attach_to_name: string;
  attachment_level: string;
  task_name: string;
  description: string;
  fiscal_year: number;
  assigned_to: string;
  status_rid: string;
  priority_rid: string;
  effective_start_datetime: string;
  effective_end_datetime: string;
  task_rid: string;
  created_by_name: string;
  modified_by_name: string | null;
  status_name: string | null;
  priority_name: string | null;
  assigned_to_name: string;
  account_status_rid: string;
  account_status_name: string;
  case_rid?: string;
  project_rid?: string;
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
  flag?: 'milestone' | 'activity';
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
