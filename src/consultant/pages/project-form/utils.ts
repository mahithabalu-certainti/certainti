import { NewProjectData } from '../../types/project';
const parseNullableNumber = (value: any): number | null => {
  const parsed = Number(value);
  return isNaN(parsed) || value === "" ? null : parsed;
};

export const transformFormData = (
  formData: Partial<NewProjectData>,
  isEdit: boolean
): Partial<NewProjectData> => {
  const data: Partial<NewProjectData> = {
    account_id: formData.account_id,
    account_number: formData.account_number,
    project_ref_id: formData.project_ref_id,
    industry: formData.industry,
    program_name: formData.program_name || '',
    client_organization: formData.client_organization,
    project_start_date: formData.project_start_date,
    project_end_date: formData.project_end_date,
    project_type: formData.project_type,
    project_classification: formData.project_classification || '',
    project_client_group: formData.project_client_group || '',
    project_group: formData.project_group || '',
    project_summary: formData.project_summary || '',
    status: formData.status,
    fiscal_year: formData.fiscal_year,
    country: formData.country,
    region: formData.region,
    currency: formData.currency,
    project_manager: formData.project_manager,
    project_lead: formData.project_lead,
    spoc_name: formData.spoc_name,
    spoc_email: formData.spoc_email || '',
    spoc_mobile: formData.spoc_mobile || '',
    project_tpc_name: formData.project_tpc_name || '',
    project_tpc_email: formData.project_tpc_email || '',
    project_tpc_mobile: formData.project_tpc_mobile || '',
    project_cc_list: formData.project_cc_list || '',
    total_effort: parseNullableNumber(formData.total_effort),
    total_cost: parseNullableNumber(formData.total_cost),
    total_fte: parseNullableNumber(formData.total_fte),
    total_sub_con: parseNullableNumber(formData.total_sub_con),
    total_non_labor_cost: parseNullableNumber(formData.total_non_labor_cost),
    total_fte_effort: parseNullableNumber(formData.total_fte_effort),
    total_sub_con_effort: parseNullableNumber(formData.total_sub_con_effort),
    total_fte_cost: parseNullableNumber(formData.total_fte_cost),
    total_sub_con_cost: parseNullableNumber(formData.total_sub_con_cost),
    last_rd_ai_assess_on: formData.last_rd_ai_assess_on || '',
    last_rd_ai_assess_by: formData.last_rd_ai_assess_by || '',
    auto_send_ai_interaction: String(formData.auto_send_ai_interaction) === 'true',
    auto_access_rd: String(formData.auto_access_rd) === 'true',        
    max_ai_interaction: parseNullableNumber(formData.max_ai_interaction),
    blended_rate_fte: formData.blended_rate_fte ? `${formData.blended_rate_fte} $/Hour` : '',
    blended_rate_sub_con: formData.blended_rate_sub_con ? `${formData.blended_rate_sub_con} $/Hour` : '',
    project_description: formData.project_description || '',
    created_by: "9d87e8ae-08cf-4cb2-871f-e832e2ea5600",   // need to remove 

  };

  if (isEdit) {
    // Include any fields specifically for edit mode if needed
    // Currently no additional fields provided in the interface
  }

  return data;
};
