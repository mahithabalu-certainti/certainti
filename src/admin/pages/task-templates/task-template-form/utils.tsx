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
  // Filter out null/undefined values from target_rid array
  const filteredTargetRid = Array.isArray(formData.target_rid)
    ? formData.target_rid.filter(
        (rid): rid is string => rid !== null && rid !== undefined && rid !== ''
      )
    : [];

  // Check if both target_rid and relationship_connector_rid are empty
  const hasTargetRid = filteredTargetRid.length > 0;
  const hasRelationshipConnector = !!formData?.relationship_connector_rid;

  // Create workflow_connector only if at least one field has data
  const workflowConnector =
    hasTargetRid || hasRelationshipConnector
      ? {
          source_rid:
            isEditView && originalData?.workflow_connector?.source_rid
              ? originalData.workflow_connector.source_rid
              : '',
          target_rid: filteredTargetRid,
          relationship_connector_rid: formData?.relationship_connector_rid,
        }
      : {};

  const basePayload: TaskTemplateFormPayload = {
    task_name: formData.task_name?.trim() || '',
    task_description: formData.task_description,
    task_type_rid: formData.task_type_rid,
    effort_in_days: formData.effort_in_days,
    milestone_template_rid: formData.milestone_template_rid,
    priority_rid: formData.priority_rid,
    checklist_template_rid: formData.checklist_template_rid,
    case_team_member_role_rid: formData.case_team_member_role_rid,
    status_rid: formData.status_rid,
    task_category_rid: formData.task_category_rid,
    weightage_rid: formData.weightage_rid,
    workflow_connector: workflowConnector,
  };

  if (isEditView && originalData) {
    return {
      ...basePayload,
      rid: originalData.rid,
    };
  }
  return basePayload;
};
