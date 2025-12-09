import { CommonApiResponse } from '../../common-service';

export type ProjectTasksListType = {
  list_sequence: number;
  project_code: string;
  project_name: string;
  resource_code: string;
  resource_name: string;
  task_name: string;
  resource_type: string;
  project_resource_role: string;
  task_type: string;
  classification_type: string;
  start_date: string;
  end_date: string;
  cost: number;
  effort_hours: number;
  status: string;
  comments: string;
  project_task_id: string;
  rid: string;
};

export interface ProjectTasksApiResponse extends CommonApiResponse {
  data: {
    projectTasks: ProjectTasksListType[];
    count: number;
  };
}
