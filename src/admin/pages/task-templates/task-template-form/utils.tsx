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

  // Get original target_rid values for comparison (edit mode only)
  const originalTargetRid =
    isEditView && originalData?.workflow_connector?.target_data?.[0]
      ? originalData.workflow_connector.target_data[0]
          .map((item: { target_rid: string }) => item.target_rid)
          .filter((rid): rid is string => rid !== null && rid !== undefined)
      : [];

  // Find target_rid values that exist in original data but NOT in current form data
  const deletedTargetRid =
    isEditView && originalData
      ? originalTargetRid.filter(
          (rid: string) => !filteredTargetRid.includes(rid)
        )
      : [];

  // Check if both target_rid and relationship_connector_rid are empty
  const hasTargetRid = filteredTargetRid.length > 0;
  const hasRelationshipConnector = !!formData?.relationship_connector_rid;
  const hasDeletions = deletedTargetRid.length > 0;

  // Determine the relationship_connector_rid to use
  const relationshipConnectorRid =
    formData?.relationship_connector_rid !== undefined &&
    formData?.relationship_connector_rid !== null &&
    formData?.relationship_connector_rid !== ''
      ? formData.relationship_connector_rid // Use form data if it has a value
      : isEditView
        ? originalData?.workflow_connector?.relationship_connector_rid
        : '';

  // Create workflow_connector only if at least one field has data
  const workflowConnector =
    hasTargetRid || hasRelationshipConnector || hasDeletions
      ? {
          source_rid: isEditView ? originalData?.rid : '',
          target_rid: filteredTargetRid,
          relationship_connector_rid: relationshipConnectorRid,
          // Add delete_rid only in edit mode when there are deletions
          ...(isEditView && hasDeletions
            ? { delete_target_rids: deletedTargetRid }
            : {}),
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
