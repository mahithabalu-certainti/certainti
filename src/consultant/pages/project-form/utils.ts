/* eslint-disable @typescript-eslint/no-explicit-any */
import { KeyContacts, KeyContactsUpdate, SelectOption } from '../../types';
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
export const transformKeyContactsFromAPI = (
  keyContacts: KeyContacts[],
  memoizedStatus: SelectOption[]
) => {
  const formData = {} as any;

  // ID → Label
  const getStatusLabelById = (id: string): string => {
    return memoizedStatus.find((option) => option.value === id)?.desc || '';
  };

  keyContacts.forEach((contact: any, index: number) => {
    formData[`key_contact_name_${index}`] = contact.key_contact_name || '';
    formData[`key_contact_role_${index}`] = contact.key_contact_role || '';
    formData[`key_contact_email_${index}`] = contact.key_contact_email || '';
    formData[`key_contact_rid_${index}`] = contact.rid || '';
    formData[`is_primary_contact_${index}`] = contact.is_primary_contact
      ? 'yes'
      : 'no';
    formData[`include_in_communication_${index}`] =
      contact.include_in_communication ? 'yes' : 'no';
    formData[`key_contact_status_${index}`] =
      getStatusLabelById(contact.status) || 'active';
  });
  return formData;
};

export const keyContactsTransformPayload = (
  formData: Partial<Record<string, any>>,
  isEdit: boolean = false,
  keyContactsList: KeyContacts[] = [],
  memoizedStatus: SelectOption[],
  defaultActiveValue: string
): KeyContacts[] => {
  const keyContacts: KeyContacts[] = [];

  // Label → ID
  const getStatusIdByLabel = (label: string): string => {
    return (
      memoizedStatus.find(
        (option) => option?.desc?.toLowerCase() === label.toLowerCase()
      )?.value || ''
    );
  };

  const indices = Array.from(
    new Set(
      Object.keys(formData)
        .map((key) => {
          const match = key.match(/^key_contact_name_(\d+)$/);
          return match ? Number(match[1]) : null;
        })
        .filter((index): index is number => index !== null)
    )
  );

  const retainedRids = new Set<string>();

  for (const index of indices) {
    const name = formData[`key_contact_name_${index}`];
    const email = formData[`key_contact_email_${index}`];
    const role = formData[`key_contact_role_${index}`];
    const rid = formData[`key_contact_rid_${index}`];

    if (name || email) {
      if (rid) retainedRids.add(rid);

      keyContacts.push({
        key_contact_name: name || '',
        key_contact_email: email || '',
        key_contact_role: role || null,
        is_primary_contact: formData[`is_primary_contact_${index}`] === 'yes',
        include_in_communication:
          formData[`include_in_communication_${index}`] === 'yes',
        status:
          getStatusIdByLabel(formData[`key_contact_status_${index}`]) ||
          defaultActiveValue,
        action_type:
          isEdit && rid ? KeyContactsUpdate.Edit : KeyContactsUpdate.Add,
        ...(isEdit && rid && { rid }),
      });
    }
  }

  // For edit mode: find and mark deleted contacts
  if (isEdit) {
    for (const contact of keyContactsList) {
      if (contact.rid && !retainedRids.has(contact.rid)) {
        keyContacts.push({
          rid: contact.rid,
          include_in_communication: contact.include_in_communication,
          status: contact.status,
          is_primary_contact: contact.is_primary_contact,
          key_contact_name: contact.key_contact_name,
          key_contact_email: contact.key_contact_email,
          key_contact_role: contact.key_contact_role,
          action_type: KeyContactsUpdate.Delete,
        });
      }
    }
  }

  return keyContacts;
};

export const transformFormData = (
  formData: Partial<NewProjectData>,
  isEdit: boolean,
  memoizedStatus: SelectOption[],
  defaultActiveValue: string,
  keyContactsList?: KeyContacts[]
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
    project_startdate: formData.project_startdate || null,
    project_enddate: formData.project_enddate || null,
    project_type_rid: formData.project_type || '',
    project_classification_rid: formData.project_classification_rid || null,
    project_classification_other: formData.classification_name || null,
    // uuid: formData.project_classification_rid || null,
    project_client_group: formData.project_client_group || '',
    project_group: formData.project_group || '',
    project_description: formData.project_description || '',
    status_rid: formData.project_status || '',
    fiscal_year: formData.fiscal_year,
    country_rid: formData.country,
    region_rid: formData.region,
    currency_rid: formData.currency,
    total_effort: String(formData.total_effort) || null,
    total_cost: String(formData.total_cost) || null,
    total_fte: parseNullableNumber(formData.total_fte) || null,
    total_subcon: formData.total_subcon || null,
    total_cost_nonlabor: String(formData.total_cost_nonlabor) || null,
    total_effort_fte: String(formData.total_effort_fte) || null,
    total_effort_subcon: String(formData.total_effort_subcon) || null,
    total_cost_fte: String(formData.total_cost_fte) || null,
    total_cost_subcon: String(formData.total_cost_subcon) || null,
    auto_send_ai_interaction:
      String(formData.auto_send_ai_interaction) === 'Yes',
    auto_access_rd: String(formData.auto_access_rd) === 'Yes',
    max_ai_interaction:
      parseNullableNumber(formData.max_ai_interaction) || null,
    blended_rate_fte: formData.blended_rate_fte
      ? `${formData.blended_rate_fte}`
      : null,
    blended_rate_subcon: formData.blended_rate_subcon
      ? `${formData.blended_rate_subcon}`
      : null,
    comments: formData.comments || '',
    key_contacts:
      keyContactsTransformPayload(
        formData,
        isEdit,
        keyContactsList,
        memoizedStatus,
        defaultActiveValue
      ) || [],
  };

  if (isEdit && formData.rid) {
    // data.account_id = formData.rid;
    data.project_fiscal_id = formData.project_id;
  }

  return data;
};
