import { CommonApiResponse } from '../../common-service';
import { FilterState } from '../pages/account-details-sidebar/components/filter/filterType';
import { Status, YesNo } from './account';

export interface ResourceListURLParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: object;
  accountNumber: string;
  value?: string;
  search?: string;
}

export type ResourceList = {
  resource_type_name: string;
  rid: string;
  r_number: string;
  resource_code: string;
  resource_ref_id: string;
  resource_fullname: string;
  resource_type: string;
  status_name: string;
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
  status: 'active' | 'inactive' | string; // Add other possible statuses if needed
  created_by: string;
  modified_by: string;
  created_datetime: string; // or Date if you parse it
  modified_datetime: string; // or Date if you parse it
}

export interface SkillTypeApiResponse {
  statusCode: number;
  statusCodeValue: 'Success' | string; // Add other possible values if needed
  statusMessage: string;
  data: SkillType[];
}

export interface SkillSubtype {
  rid: string;
  skill_subtype_name: string;
  skill_subtype_description: string;
  status: 'active' | 'inactive' | string; // Add other possible statuses if needed
  created_by: string;
  modified_by: string;
  created_datetime: string; // or `Date` if parsed
  modified_datetime: string; // or `Date` if parsed
}

export interface SKillSubTypeApiResponse {
  statusCode: number;
  statusCodeValue: 'Success' | string; // Add other possible values (e.g., "Error")
  statusMessage: string;
  data: SkillSubtype[];
}

export interface ResourceStatusItem {
  rid: string;
  resource_status_name: string;
  resource_status_description: string;
  status: string;
}

export interface GetResourceStatusApiResponse extends CommonApiResponse {
  data: {
    resourceStatus: ResourceStatusItem[];
  };
}

export interface ResourceTypeItem {
  rid: string;
  resource_type_name: string;
  resource_type_description: string;
  status: string;
}

export interface GetResourceTypeApiResponse extends CommonApiResponse {
  data: {
    resouceType: ResourceTypeItem[];
  };
}

export interface SkillLevelItem {
  rid: string;
  skill_level_name: string;
  skill_level_description: string;
  status: string;
}

export interface GetSkillLevelApiResponse extends CommonApiResponse {
  data: {
    skillLevel: SkillLevelItem[];
  };
}
