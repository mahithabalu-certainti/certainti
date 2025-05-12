import { FilterState } from '../pages/account-details-sidebar/components/filter/filterType';
import { Status, YesNo } from './account';

export interface ResourceListURLParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: object;
  accountNumber: string;
  fiscalYear: number;
}

export type ResourceList = {
  rid: string;
  r_number: string;
  resource_ref_id: string;
  resource_fullname: string;
  resource_type: string;
  resource_status: string;
};

export type ResourcesData = {
  resources: ResourceList[];
  count: number;
};

export type ResourcesListResponse = {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: ResourcesData;
};

export interface ResourceById {
  rid: string;
  resource_name: string;
  status: Status;
  resource_number: string;
  industry: string;
  country_rid: string;
  currency_rid: string;
  primary_contact_name: string;
  resource_description: string | null;
}

export interface ResourceFieldsTypes {
  primary_contact_email: string;
  primary_contact_number: string;
  website: string | null;
  fiscal_start_date: string;
  fiscal_end_date: string;
}

export interface NewResourceData extends ResourceFieldsTypes, ResourceById {
  resource_id: string;
  resource_currency_rid: string;
  resource_country_rid: string;
  created_by: string;
  modified_by: string;
}

export interface ResourceFormData extends Omit<NewResourceData, 'status'> {
  status: YesNo;
}

export interface ResetFilter {
  setAppliedFilters: (filters: Record<string, string>) => void;
  setFilterStates: (filterStates: Record<string, FilterState>) => void;
  setSelectedFilters: (selectedFilters: string[]) => void;
  onFilterStatesChange?: (filterStates: Record<string, FilterState>) => void;
  onSelectedFiltersChange?: (selectedFilters: string[]) => void;
}

export interface SkillType {
  rid: string;
  skill_type_name: string;
  skill_type_description: string;
  status: "active" | "inactive" | string; // Add other possible statuses if needed
  created_by: string;
  modified_by: string;
  created_datetime: string; // or Date if you parse it
  modified_datetime: string; // or Date if you parse it
}

export interface SkillTypeApiResponse {
  statusCode: number;
  statusCodeValue: "Success" | string; // Add other possible values if needed
  statusMessage: string;
  data: SkillType[];
}

export interface SkillSubtype {
  rid: string;
  skill_subtype_name: string;
  skill_subtype_description: string;
  status: "active" | "inactive" | string; // Add other possible statuses if needed
  created_by: string;
  modified_by: string;
  created_datetime: string; // or `Date` if parsed
  modified_datetime: string; // or `Date` if parsed
}

export interface SKillSubTypeApiResponse {
  statusCode: number;
  statusCodeValue: "Success" | string; // Add other possible values (e.g., "Error")
  statusMessage: string;
  data: SkillSubtype[];
}