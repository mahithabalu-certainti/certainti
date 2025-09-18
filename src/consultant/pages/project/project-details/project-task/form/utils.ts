import { ProjectTaskInput } from '../../../../../types/project-task';

export const projectTaskPayloadData = (
  formData: Partial<ProjectTaskInput>,
  project_task_rid: string,
  isEdit: boolean
): Partial<ProjectTaskInput> => {
  const data: Partial<ProjectTaskInput> = {
    account_rid: formData.account_rid,
    project_fiscal_rid: formData.project_fiscal_rid,
    resource_code: formData.resource_code,
    country_rid: formData.country_rid || null,
    region_rid: formData.region_rid || null,
    currency_rid: formData.currency_rid || null,
    start_date: formData.start_date || null,
    end_date: formData.end_date || null,
    total_hours_pro_task: formData.total_hours_pro_task || null,
    total_cost_pro_task: formData.total_cost_pro_task || null,
    comments: formData.comments || null,
    user_preference: '',
  };

  if (isEdit && project_task_rid) {
    data.project_task_rid = project_task_rid;
  }
  return data;
};
