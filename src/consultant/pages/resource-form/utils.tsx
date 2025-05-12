import {
  ResourceDetailsForPayload,
  ResourceDetailsTypes,
  SelectOption,
} from '../../types';
import {
  ResourceCostPayload,
  ResourceCostSkillFormData,
} from '../../types/resource-cost';
import { ResourceSkillPayload } from '../../types/resource-skill';
import { skillLevel } from '../account-details-sidebar/sidebar-pages/resources/resource-skill/resource-skill-type';

// Constants for dropdown options
export const RESOURCE_STATUS_OPTIONS: SelectOption[] = [
  { label: 'Active', value: 'Active' },
  { label: 'In-Active', value: 'Inactive' },
];

export const RESOURCE_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Full-Time', value: 'Full-Time' },
  { label: 'Sub Con', value: 'Sub Con' },
  { label: 'Non-Labor', value: 'Non-Labor' },
];

export const FREQUENCY_OPTIONS: SelectOption[] = [
  { label: 'Annual', value: 'annual' },
  { label: 'Semi Annual', value: 'semi_annual' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Bi-Weekly', value: 'bi_weekly' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Daily', value: 'daily' },
  { label: 'Hourly', value: 'hourly' },
];

// Type definitions
interface RawResourceData {
  resource_ref_id?: string;
  resource_fullname?: string;
  resource_firstname?: string;
  resource_lastname?: string;
  resource_type?: string;
  resource_orgname?: string;
  resource_role?: string;
  country?: string;
  state?: string;
  city?: string;
  fiscal_year: number;
  cost?: string;
  resource_startdate?: string;
  resource_enddate?: string;
  designation?: string;
  total_years_experience?: string;
  total_years_in_org?: string;
  resource_status?: string;
  comments?: string;
  resource_country?: string;
}

interface ResourceTransformationOptions {
  resource_id?: string;
  account_number?: string;
  [key: string]: unknown; // More type-safe than 'any'
}

// Helper functions
const formatDateToMMDDYYYY = (dateString?: string | null): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
};

// const capitalizeFirstLetter = (str?: string): string => {
//   return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
// };

const safeParseNumber = (value?: string, fallback = 0): number => {
  const parsed = Number(value);
  return isNaN(parsed) ? fallback : parsed;
};

// Main transformation function
export function transformPayloadforUpdateResource(
  rawData: RawResourceData,
  existingResource?: ResourceDetailsTypes,
  options: ResourceTransformationOptions = {}
) {
  return {
    resource_id: options.resource_id || '',
    account_number: options.account_number || '',
    resource_ref_id:
      rawData.resource_ref_id || existingResource?.resource_ref_id || '',
    resource_type:
      rawData.resource_type || existingResource?.resource_type || '',

    full_name:
      rawData.resource_fullname || existingResource?.resource_fullname || '',
      first_name:
      rawData.resource_firstname || existingResource?.resource_fullname || '',
      last_name:
      rawData.resource_fullname || existingResource?.resource_fullname || '',
    org_name:
      rawData.resource_orgname || existingResource?.resource_orgname || '',
    role: rawData.resource_role || existingResource?.resource_role,
    resource_status:
      rawData.resource_status || existingResource?.resource_status,
    resource_country: rawData.country || existingResource?.country || '',
    resource_region: rawData.state || existingResource?.state || '',
    resource_city: rawData.city || existingResource?.city || '',
    comments: rawData.comments || existingResource?.comments || '',
    effective_from_date:
      formatDateToMMDDYYYY(rawData.resource_startdate) ||
      formatDateToMMDDYYYY(existingResource?.resource_startdate) ||
      '',
    effective_end_date:
      formatDateToMMDDYYYY(rawData.resource_enddate) ||
      formatDateToMMDDYYYY(existingResource?.resource_enddate) ||
      '',
    resource_designation: rawData.designation || existingResource?.designation || '',
    total_years_experience: safeParseNumber(
      rawData.total_years_experience,
      existingResource?.resource_total_experience || 0
    ),
    total_years_in_org: safeParseNumber(
      rawData.total_years_in_org,
      existingResource?.resource_total_experience_organization || 0
    ),
  };
}

export const transformPayloadforCreateResource = (
  formData: ResourceDetailsForPayload
) => {
  return {
    account_id: formData.account_id,
    account_number: formData.account_number,
    resource_ref_id: formData.resource_ref_id,
    resource_type: formData.resource_type,
    first_name: formData.resource_firstname,
    last_name: formData.resource_lastname,
    full_name: formData.resource_fullname,
    org_name: formData.resource_orgname,
    role: formData.resource_role,
    resource_country: formData.country,
    resource_region: formData.state,
    resource_city: formData.city,
    effective_from_date: formatDateToMMDDYYYY(formData.resource_startdate),
    effective_end_date: formatDateToMMDDYYYY(formData.resource_enddate),
    resource_designation: formData.designation,
    total_years_experience: formData.total_years_experience,
    total_years_in_org: formData.total_years_in_org,
    resource_status: formData.resource_status,
    comments: formData.comments,
    created_by: formData.created_by,
  };
};

export const transformCostData = (
  formData: Partial<ResourceCostSkillFormData>,
  isEdit: boolean
) => {
  const data: Partial<ResourceCostPayload> = {
    eid: '',
    account_rid: formData.account_rid,
    effective_date: formData.financial_start_date
      ? formData.financial_start_date
      : '',
    end_date: formData.financial_end_date ? formData.financial_end_date : '',
    cost_frequency: formData.cost_frequency,
    cost: formData.cost?.toString(),
    fiscal_year: formData.fiscal_year,
    resource_type: formData.resource_type,
    resource_ref_id: formData.resource_ref_id,
    currency_rid: formData.currency ? formData.currency : null,
    resource_rid: formData.resource_rid,
    accountNumber: formData.accountNumber,
    resource_number: formData?.resource_number,
    comments: formData.comments,
  };

  if (isEdit) {
    data.rid = formData.cost_rid;

    delete data.account_rid;
    delete data.resource_rid;
    delete data.resource_type;
    delete data.resource_ref_id;
    delete data.resource_number;
  }

  return data;
};

export const transformSkillData = (
  formData: Partial<ResourceCostSkillFormData>,
  isEdit: boolean
) => {
  const data: Partial<ResourceSkillPayload> = {
    eid: '',
    account_rid: formData.account_rid,
    resource_type: formData.resource_type,
    resource_rid: formData.resource_rid,
    resource_ref_id: formData.resource_ref_id,
    start_date: formData.skill_start_date ? formData.skill_start_date : '',
    skill_level: formData.skill_level as skillLevel,
    skill_type_rid: formData.skill_type,
    skill_subtype_rid: formData.skill_sub_type,
    skill_type_others: formData.skill_type_others || "",
    skill_subtype_others: formData.skill_subtype_others || "",
    skill_details: formData.skill_details,
    accountNumber: formData.accountNumber,
    resource_number: formData?.resource_number,
    comments: formData.comments,
  };

  if (isEdit) {
    delete data.resource_rid;
    delete data.account_rid;
    delete data.resource_type;
    delete data.resource_ref_id;
    delete data.resource_desc;
    delete data.resource_number;

    data.rid = formData.skill_rid;
  }

  return data;
};
