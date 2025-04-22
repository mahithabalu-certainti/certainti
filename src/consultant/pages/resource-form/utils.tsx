/* eslint-disable @typescript-eslint/no-explicit-any */
import { ResourceDetailsTypes, SelectOption } from '../../types';
import {
  ResourceCostPayload,
  ResourceCostSkillFormData,
} from '../../types/resource-cost';
import { ResourceSkillPayload } from '../../types/resource-skill';
import { skillLevel } from '../account-details/sidebar-pages/resources/resource-skill/resource-skill-type';

const userDetails = JSON.parse(localStorage.getItem('auth') as any);

// Constants for dropdown options
export const RESOURCE_STATUS_OPTIONS: SelectOption[] = [
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
];

export const RESOURCE_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Full Time', value: 'FullTime' },
  { label: 'Contract', value: 'Contract' },
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
  resource_type?: string;
  resource_orgname?: string;
  resource_lastname?: string;
  country?: string;
  state?: string;
  city?: string;
  fiscal_year: number;
  cost?: string;
  resource_startdate?: string;
  resource_enddate?: string;
  designation?: string;
  total_years_oexperience?: string;
  total_years_in_org?: string;
}

interface TransformedResourceData {
  resource_id: string;
  account_number: string;
  resource_ref_id: string;
  resource_type: string;
  full_name: string;
  org_name: string;
  role: string;
  fiscal_year: number;
  country: string;
  state: string;
  city: string;
  effective_from_date: string;
  effective_end_date: string;
  designation: string;
  total_years_experience: number;
  total_years_in_org: number;
  modified_by: string;
}

interface ResourceTransformationOptions {
  resource_id?: string;
  account_number?: string;
  [key: string]: unknown; // More type-safe than 'any'
}

// Helper functions
const formatDateToDDMMYYYY = (dateString?: string | null): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};
const formatDateToYYYYMMDD = (dateString?: string | null): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${year}/${month}/${day}`;
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
): TransformedResourceData {
  return {
    resource_id: options.resource_id || '',
    account_number: options.account_number || '',
    resource_ref_id:
      rawData.resource_ref_id || existingResource?.resource_ref_id || '',
    resource_type:
      rawData.resource_type || existingResource?.resource_type || '',

    full_name:
      rawData.resource_fullname || existingResource?.resource_fullname || '',
    org_name:
      rawData.resource_orgname || existingResource?.resource_orgname || '',
    role: existingResource?.resource_role || '',
    fiscal_year: rawData.fiscal_year || existingResource?.fiscal_year || 0,
    country: rawData.country || existingResource?.country || '',
    state: rawData.state || existingResource?.state || '',
    city: rawData.city || existingResource?.city || '',
    effective_from_date:
      formatDateToDDMMYYYY(rawData.resource_startdate) ||
      formatDateToDDMMYYYY(existingResource?.resource_startdate) ||
      '',
    effective_end_date:
      formatDateToDDMMYYYY(rawData.resource_enddate) ||
      formatDateToDDMMYYYY(existingResource?.resource_enddate) ||
      '',
    designation: rawData.designation || existingResource?.designation || '',
    total_years_experience: safeParseNumber(
      rawData.total_years_oexperience,
      existingResource?.total_years_experience || 0
    ),
    total_years_in_org: safeParseNumber(
      rawData.total_years_in_org,
      existingResource?.total_years_in_org || 0
    ),

    modified_by: userDetails?.userId,
  };
}

export const transformPayloadforCreateResource = (
  formData: ResourceDetailsTypes
) => {
  return {
    account_id: formData.account_id,
    account_number: formData.account_number,
    resource_ref_id: formData.resource_ref_id,
    resource_type: formData.resource_type,
    full_name: formData.resource_fullname,
    org_name: formData.resource_orgname,
    role: formData.resource_role,
    fiscal_year: formData.fiscal_year,
    country: formData.country,
    state: formData.state,
    city: formData.city,
    effective_from_date: formatDateToDDMMYYYY(formData.resource_startdate),
    effective_end_date: formatDateToDDMMYYYY(formData.resource_enddate),
    designation: formData.designation,
    total_years_experience: formData.total_years_experience,
    total_years_in_org: formData.total_years_in_org,
    resource_status: formData.resource_status,
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
    effective_date: formatDateToYYYYMMDD(formData.financial_start_date),
    end_date: formatDateToYYYYMMDD(formData.financial_end_date),
    cost_frequency: formData.cost_frequency,
    cost: formData.cost ? Number(formData.cost) : null,
    resource_type: formData.resource_type,
    resource_ref_id: formData.resource_ref_id,
    currency_rid: formData.currency,
    resource_rid: formData.resource_rid,
    accountNumber: formData.accountNumber,
  };

  if (isEdit) {
    data.rid = formData.cost_rid;

    delete data.account_rid;
    delete data.resource_rid;
    delete data.resource_type;
    delete data.resource_ref_id;
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
    start_date: formatDateToYYYYMMDD(formData.skill_start_date),
    skill_level: formData.skill_level as skillLevel,
    years_of_experience: formData.years_of_experience
      ? Number(formData.years_of_experience)
      : null,
    skill_name: formData.skill_name,
    accountNumber: formData.accountNumber,
    resource_desc: formData.resource_desc,
  };

  if (isEdit) {
    delete data.resource_rid;
    delete data.account_rid;
    delete data.resource_type;
    delete data.resource_ref_id;
    delete data.resource_desc;

    data.rid = formData.skill_rid;
  }

  return data;
};
