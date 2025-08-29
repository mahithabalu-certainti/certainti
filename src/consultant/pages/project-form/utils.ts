/* eslint-disable @typescript-eslint/no-explicit-any */
import { KeyContacts, KeyContactsUpdate, SelectOption } from '../../types';
import { NewProjectData } from '../../types/project';
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
interface KeyContactTypes {
  rid?: string;
  r_number?: string;
  created_by?: string;
  modified_by?: string | null;
  created_datetime?: string;
  modified_datetime?: string | null;
  entity_rid?: string;
  entity_type?: 'Project' | string;
  key_contact_name?: string;
  key_contact_email?: string;
  key_contact_role?: string;
  is_primary_contact?: boolean | null;
  include_in_communication?: boolean;
  interaction_cc_recipient?: boolean;
  status_rid: string;
  role_name?: string;
  status_name?: string;
}
interface FlatKeyContactsForm {
  [key: string]: string | undefined;
}
export const transformKeyContactsFromAPI = (
  keyContacts: KeyContacts[],
  memoizedStatus: SelectOption[]
) => {
  const formData = {} as FlatKeyContactsForm;

  // ID → Label
  const getStatusLabelById = (id: string): string => {
    return memoizedStatus.find((option) => option.value === id)?.desc || '';
  };

  keyContacts.forEach((contact: KeyContactTypes, index: number) => {
    formData[`key_contact_name_${index}`] = contact.key_contact_name || '';
    formData[`key_contact_role_${index}`] = contact.key_contact_role || '';
    formData[`key_contact_email_${index}`] = contact.key_contact_email || '';
    formData[`key_contact_rid_${index}`] = contact.rid || '';
    formData[`is_primary_contact_${index}`] = contact.is_primary_contact
      ? 'yes'
      : 'no';
    formData[`include_in_communication_${index}`] =
      contact.include_in_communication ? 'yes' : 'no';
    formData[`interaction_cc_recipient_${index}`] =
      contact.interaction_cc_recipient ? 'yes' : 'no';
    formData[`key_contact_status_${index}`] =
      getStatusLabelById(contact.status_rid) || 'active';
  });
  return formData;
};

export const keyContactsTransformPayload = (
  formData: Partial<Record<string, string>>,
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
        key_contact_role: role || null || '',
        is_primary_contact: formData[`is_primary_contact_${index}`] === 'yes',
        include_in_communication:
          formData[`include_in_communication_${index}`] === 'yes',
        interaction_cc_recipient:
          formData[`interaction_cc_recipient_${index}`] === 'yes',
        status_rid:
          getStatusIdByLabel(formData[`key_contact_status_${index}`] || '') ||
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
          interaction_cc_recipient: contact.interaction_cc_recipient,
          status_rid: contact.status_rid,
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
  keyContactsList?: KeyContacts[],
  showOthersField?: boolean,
  showClassifyOthersField?: boolean
): Partial<NewProjectData> => {
  const data: Partial<NewProjectData> = {
    account_id: formData.account_id,
    project_id: formData.project_id,
    account_number: formData.account_number,
    project_code: formData.project_code,
    project_name: formData.project_name,
    industry_rid: formData.industry_rid || null,
    industry_name: showOthersField ? formData.industry_name : '',
    program_name: formData.program_name || '',
    project_startdate: formData.project_startdate || null,
    project_enddate: formData.project_enddate || null,
    project_type_rid: formData.project_type || '',
    project_classification_rid: formData.project_classification_rid || null,
    project_classification_other: showClassifyOthersField
      ? formData.classification_name
      : null,
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
    comments: formData.comments || '',
    key_contacts:
      keyContactsTransformPayload(
        formData as Partial<Record<string, string>>,
        isEdit,
        keyContactsList,
        memoizedStatus,
        defaultActiveValue
      ) || [],
  };

  if (isEdit && formData.rid) {
    // data.account_id = formData.rid;
    data.project_fiscal_id = formData.rid;
  }

  return data;
};
