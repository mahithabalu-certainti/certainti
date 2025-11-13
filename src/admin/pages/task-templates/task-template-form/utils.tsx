import {
  TaskTemplateDetails,
  TaskTemplateFormData,
  TaskTemplateFormPayload,
} from '../../../types';

export const transformTaskTemplatePayload = (
  formData: Partial<TaskTemplateFormData>,
  isEditView: boolean,
  originalData?: TaskTemplateDetails
): TaskTemplateFormPayload => {
  const basePayload: TaskTemplateFormPayload = {
    task_name: formData.task_name,
    task_description: formData.task_description,
    task_type_rid: formData.task_type_rid,
    effort_in_days: formData.effort_in_days,
    milestone_template_rid: formData.milestone_template_rid,
    priority_rid: formData.priority_rid,
    checklist_template_rid: formData.checklist_template_rid,
    case_team_member_role_rid: formData.case_team_member_role_rid,
    reminder_interval: formData.reminder_interval,
    status_rid: formData.status_rid,
  };

  if (isEditView && originalData) {
    return {
      ...basePayload,
      rid: originalData.rid,
    };
  }
  return basePayload;
};
