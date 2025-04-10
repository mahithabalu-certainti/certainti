import { CommonApiResponse } from '../../common-service';

export interface ParentAccountApiResponse extends CommonApiResponse {
  data: {
    gloablAcconunt: GloablAcconunts[];
  };
}

export interface CurrencyApiResponse extends CommonApiResponse {
  data: {
    currency: Currencys[];
  };
}

export interface RegionApiResponse extends CommonApiResponse {
  data: {
    regions: Regions[];
  };
}

export interface AccountFieldsApiResponse extends CommonApiResponse {
  data: {
    accountById: AccountById;
    accountDetails: AccountFieldsTypes;
  };
}

export interface Regions {
  rid: string;
  region_name: string;
}

export interface Currencys {
  rid: string;
  currency_name: string;
}

export interface GloablAcconunts {
  rid: string;
  account_name: string;
}

export interface Account {
  accountName: string;
  accountId: string;
  parentAccount: string | null;
  accountNumber: string;
  industry: string;
  country: string;
  currency: string;
  status: string;
  primaryContact: string;
}

export interface Column<T> {
  id: keyof T;
  label: string;
  sortable?: boolean;
}

export enum Storagetype {
  SeperateDB = 'separate_db',
  StoredDB = 'store_in_parent',
}

export enum Status {
  Active = 'active',
  InActive = 'inactive',
}

export enum YesNo {
  Yes = 'yes',
  No = 'no',
}

export interface AccountById {
  parent_account_rid: string | null;
  r_number: string;
  account_name: string;
  industry: string;
  country_rid: string;
  currency_rid: string;
  status: Status;
  primary_contact_name: string;
  is_parent: boolean;
  account_description: string | null;
  annual_revenue: number;
  region: string;
  rid: string;
}

export interface AccountFieldsTypes {
  primary_contact_email: string;
  primary_contact_number: string;
  finance_poc_name: string;
  finance_poc_email: string;
  finanace_poc_number: string;
  website: string | null;
  project_manager: string;
  fiscal_start_date: string;
  fiscal_end_date: string;
  autosend_interaction: boolean;
  max_ai_interactions: number;
  auto_access_rd: boolean;
  blended_rate_fte: string | null;
  blended_rate_subcon: string | null;
  data_storage: Storagetype;
}

export interface NewAccountData extends AccountFieldsTypes, AccountById {
  account_id: string;
  account_currency_rid: string;
  account_country_rid: string;
  account_country_region_rid: string;
  account_city_rid: string;
  created_by: string;
  modified_by: string;
  finance_poc_number: string;
  account_rid: string;
}

export interface AccountFormData
  extends Omit<
    NewAccountData,
    'is_parent' | 'autosend_interaction' | 'auto_access_rd'
  > {
  is_parent: YesNo;
  autosend_interaction: YesNo;
  auto_access_rd: YesNo;
}

type Country = {
  country_name: string;
};

type Currency = {
  currency_code: string;
};

export type AccountListResponse = {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    account: AccountList[];
    count: number;
  };
};

export interface AccountListURLParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
}

export type AccountList = {
  rid: string;
  r_number: string;
  serial_number: number;
  account_name: string;
  account_description: string;
  eid: string | null;
  status: 'active' | 'inactive';
  is_parent: boolean;
  annual_revenue: string;
  region: string;
  storage_type: 'separate_db' | 'store_in_parent';
  parent_account_rid: string | null;
  database_connection_rid: string | null;
  country_rid: string;
  currency_rid: string;
  industry: string;
  primary_contact_name: string;
  createdAt: string;
  updatedAt: string;
  child_accounts?: AccountList[];
  country?: Country;
  currency?: Currency;
  account_id?: string;
  parent_account?: string;
  account_number?: number;
  primary_contact?: string;
};

export interface ConvertedAccount {
  accountName: string;
  accountId: string;
  parentAccount: string | null;
  accountNumber: string;
  industry: string;
  country: string;
  currency: string;
  status: 'Active' | 'In Active';
  primaryContact: string;
  parentAccountID: string | null;
}
