import { capitalize } from '@mui/material';
import { KeyContactsUpdate, Status } from '../../types';
import { NewProjectData } from '../../types/project';
import { othersIndustryId } from '../account-create/utils';
const parseNullableNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return isNaN(parsed) || value === '' ? null : parsed;
};
export const formatSlashDateToDash = (
  dateString?: string | null
): string | null => {
  if (!dateString) return null;
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;
  const [year, month, day] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

export const transformFormData = (
  formData: Partial<NewProjectData>,
  isEdit: boolean,
  isValueUpdateInKeyContact?: boolean,
  key_rid?: string
): Partial<NewProjectData> => {
  const data: Partial<NewProjectData> = {
    account_id: formData.account_id,
    account_number: formData.account_number,
    project_code: formData.project_code,
    project_name: formData.project_name,
    industry_rid: formData.industry_rid || null,
    industry_name:
      othersIndustryId === formData.industry_rid ? formData.industry_name : '',
    program_name: formData.program_name || '',
    project_startdate: formData.project_startdate,
    project_enddate: formData.project_enddate,
    project_type: formData.project_type,
    project_classification_rid: formData.project_classification_rid || null,
    project_classification_other: formData.classification_name || null,
    // uuid: formData.project_classification_rid || null,
    project_client_group: formData.project_client_group || '',
    project_group: formData.project_group || '',
    project_description: formData.project_description || '',
    project_status: formData.project_status
      ? (capitalize(formData.project_status) as Status)
      : ('Active' as Status),
    fiscal_year: formData.fiscal_year,
    country: formData.country,
    region: formData.region,
    currency: formData.currency,
    total_effort: String(formData.total_effort) || null,
    total_cost: String(formData.total_cost) || null,
    total_fte: parseNullableNumber(formData.total_fte) || null,
    total_sub_con: formData.total_sub_con || null,
    total_non_labor_cost: String(formData.total_non_labor_cost) || null,
    total_fte_effort: String(formData.total_fte_effort) || null,
    total_sub_con_effort: String(formData.total_sub_con_effort) || null,
    total_fte_cost: String(formData.total_fte_cost) || null,
    total_sub_con_cost: String(formData.total_sub_con_cost) || null,
    auto_send_ai_interaction:
      String(formData.auto_send_ai_interaction) === 'Yes',
    auto_access_rd: String(formData.auto_access_rd) === 'Yes',
    max_ai_interaction:
      parseNullableNumber(formData.max_ai_interaction) || null,
    blended_rate_fte: formData.blended_rate_fte
      ? `${formData.blended_rate_fte}`
      : null,
    blended_rate_sub_con: formData.blended_rate_sub_con
      ? `${formData.blended_rate_sub_con}`
      : null,
    comments: formData.comments || '',
    key_contacts: isValueUpdateInKeyContact
      ? [
          {
            key_contact_name: formData.key_contact_name as string,
            key_contact_email: formData.key_contact_email as string,
            key_contact_role: formData.key_contact_role as string,
            is_primary_contact: formData?.is_primary_contact === 'yes',
            include_in_communication:
              formData?.include_in_communication === 'yes',
            status: formData?.key_contact_status
              ? (capitalize(formData.key_contact_status) as Status)
              : ('Active' as Status),
            ...(isEdit && { rid: key_rid }),
            action_type:
              isEdit && key_rid
                ? KeyContactsUpdate.Edit
                : KeyContactsUpdate.Add,
          },
        ]
      : [],
  };

  if (isEdit && formData.rid) {
    data.project_id = formData.rid;
  }

  return data;
};
