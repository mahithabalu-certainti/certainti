import { caseServiceApi } from '../../../api/api';
import { getWorkBreakdownURL } from '../urls/work-breakdown-url';

export interface KanbanBoardData {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: KanbanColumn[];
}

export interface KanbanColumn {
  rid: string;
  milestone_name: string;
  tasks: TaskCard[];
  task_count: number;
}

export interface TaskCard {
  rid: string;
  sequence_no: number;
  r_number: string;
  task_name: string;
  created_by: string;
  status_rid: string;
  assigned_to: string | null;
  priority_rid: string;
  task_type_rid: string;
  effort_in_days: number;
  checklists_count: number;
  task_description: string | null;
  reminder_interval: number;
  effective_end_datetime: string;
  effective_start_datetime: string;
  case_team_member_role_rid: string;
  milestone_template_rid: string;
  priority_name: string;
  assigned_to_name: string | null;
  case_team_member_role_name: string;
  task_type_name: string;
  status_name: string;
}

export const getKanbanBoardData = async (
  accountId: string,
  caseId: string
): Promise<KanbanBoardData> => {
  const url = getWorkBreakdownURL(accountId, caseId);
  const response = await caseServiceApi.get<KanbanBoardData>(url);
  return response.data;
};
