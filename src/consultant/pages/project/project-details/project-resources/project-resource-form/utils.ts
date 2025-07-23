import { ProjectResourceNewPayload } from '../../../../../types';

export const projectResourcesPayloadData = (
  formData: Partial<ProjectResourceNewPayload>,
  updated_resource_rid: string,
  isEdit: boolean,
  showSkillRoleOthersField?: boolean,
  isResourceType?: boolean
): Partial<ProjectResourceNewPayload> => {
  const data: Partial<ProjectResourceNewPayload> = {
    account_rid: formData.account_rid,
    project_rid: formData.project_rid,
    // resource_name: formData.resource_name || null,
    resource_code: formData.resource_code,
    // resource_type_rid: formData.resource_type_rid,
    // resource_orgname: formData.resource_orgname || null,
    // designation: formData.designation || null,
    // resource_role: formData.resource_role || null,
    assigned_skill_role_type_rid: formData.assigned_skill_role_type_rid || null,
    skill_role_rid: showSkillRoleOthersField ? formData.skill_role_rid : null,
    skill_role_others: showSkillRoleOthersField
      ? formData.skill_role_others
      : null,
    status_rid: formData.status_rid || null,
    country_rid: formData.country_rid || null,
    region_rid: formData.region_rid || null,
    currency_rid: formData.currency_rid || null,
    start_date: formData.start_date || null,
    end_date: formData.end_date || null,
    total_hours_pro_res: formData.total_hours_pro_res || null,
    total_cost_pro_res: formData.total_cost_pro_res || null,
    salary: isResourceType ? formData.salary : null,
    bonus: isResourceType ? formData.bonus : null,
    insurance: isResourceType ? formData.insurance : null,
    deductions: formData.deductions || null,
    description: formData.description || null,
  };

  if (isEdit && updated_resource_rid) {
    data.project_resource_rid = updated_resource_rid;
    if (formData.total_hours_pro_res !== undefined) {
      data.total_hours_pro_res = String(formData.total_hours_pro_res) || null;
    }
  }
  return data;
};
