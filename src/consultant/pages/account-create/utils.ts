/* eslint-disable @typescript-eslint/no-explicit-any */
import { capitalize } from '@mui/material';
import {
  AccountFormData,
  KeyContacts,
  KeyContactsUpdate,
  NewAccountData,
  SelectOption,
  Status,
} from '../../types';

export const DATA_STORAGE_OPTIONS: SelectOption[] = [
  { label: 'Separate DB', value: 'separate_db' },
  { label: 'Store in Parent', value: 'store_in_parent' },
];

export const othersIndustryId = '107e689d-35d8-49e5-a444-08db0c59167b';
export const othersClassificationId = 'a6b7b3e5-1d4f-4e28-b15f-2fa49b91e5a8';

export const transformKeyContactsFromAPI = (keyContacts: KeyContacts[]) => {
  const formData = {} as any;

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
      contact.status?.toLowerCase() || 'active';
  });
  return formData;
};

export const keyContactsTransformPayload = (
  formData: Partial<Record<string, any>>,
  isEdit: boolean = false,
  keyContactsList: KeyContacts[] = []
): KeyContacts[] => {
  const keyContacts: KeyContacts[] = [];

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
        status: formData[`key_contact_status_${index}`]
          ? (capitalize(formData[`key_contact_status_${index}`]) as Status)
          : ('Active' as Status),
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
  formData: Partial<AccountFormData>,
  isEdit: boolean,
  account_rid?: string,
  keyContactsList?: KeyContacts[]
): Partial<NewAccountData> => {
  const data: Partial<NewAccountData> = {
    account_id: account_rid,
    account_name: formData.account_name,
    comments: formData.comments || null,
    status: formData.status,
    is_parent: formData.is_parent === 'yes',
    parent_account_rid: formData.parent_account_rid || null,
    account_currency_rid: formData.currency_rid || null,
    account_country_rid: formData.country_rid || null,
    account_country_region_rid: formData.region || null,
    max_ai_interactions: Number(formData.max_ai_interactions),
    autosend_interaction: formData.autosend_interaction === 'yes',
    auto_access_rd: formData.auto_access_rd === 'yes',
    fiscal_start_date: formData.fiscal_start_date,
    fiscal_end_date: formData.fiscal_end_date,
    blended_rate_fte: formData.blended_rate_fte || null,
    blended_rate_subcon: formData.blended_rate_subcon || null,
    primary_contact_name: formData.primary_contact_name,
    primary_contact_email: formData.primary_contact_email,
    primary_contact_number: formData.primary_contact_number,
    finance_poc_name: formData.finance_poc_name,
    finance_poc_email: formData.finance_poc_email,
    finance_poc_number: formData.finanace_poc_number,
    industry_rid: formData.industry_rid,
    industry_name_other:
      othersIndustryId === formData.industry_rid
        ? formData.industry_name_other
        : '', //clear others industry name if industry is not others
    website: formData.website || null,
    project_manager: formData.project_manager,
    annual_revenue: formData.annual_revenue,
    data_storage: formData.data_storage,
    business_details: formData.business_details,
    key_contacts:
      keyContactsTransformPayload(formData, isEdit, keyContactsList) || [],
  };
  if (isEdit) {
    data.account_rid = account_rid;
    data.r_number = account_rid;
  }
  return data;
};

export const formatDateValue = (dateString?: string | null): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  // Date parts
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  // Time parts (12-hour format with AM/PM)
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours || 12; // Convert "0" hours to "12"

  const formattedTime = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;

  return `${month}/${day}/${year}, ${formattedTime}`;
};
