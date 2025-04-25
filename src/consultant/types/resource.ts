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
