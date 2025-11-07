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
    task_type_rid: formData.task_type,
    effort_in_days: formData.effort_in_days,
    milestone_template_rid: formData.milestone_rid,
    priority_rid: formData.priority_rid,
    checklist_template_rid: formData.checklist_rid,
    case_team_member_role_rid: formData.case_team_member_role_rid,
    reminder_interval: formData.reminder_interval,
  };

  if (isEditView && originalData) {
    return {
      ...basePayload,
      template_rid: originalData.rid,
    };
  }
  return basePayload;
};
