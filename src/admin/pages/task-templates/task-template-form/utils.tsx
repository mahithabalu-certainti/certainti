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
    efforts: formData.efforts,
  };

  if (isEditView && originalData) {
    return {
      ...basePayload,
      template_rid: originalData.rid,
    };
  }
  return basePayload;
};
