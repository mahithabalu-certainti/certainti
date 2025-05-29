import { CommonApiResponse } from '../../common-service';

export interface ParentAccountApiResponse extends CommonApiResponse {
  data: {
    gloablAcconunt: GloablAcconunts[];
  };
}

export interface IndustrysApiResponse extends CommonApiResponse {
  data: {
    industries: Industries[];
  };
}

export interface CurrencyApiResponse extends CommonApiResponse {
  data: {
    currency: Currencys[];
  };
}
export interface ClassificationApiResponse extends CommonApiResponse {
  data: {
    projectClassifications: Classification[];
  };
}

export interface StatesApiResponse extends CommonApiResponse {
  data: {
    states: States[];
  };
}

export interface CitysApiResponse extends CommonApiResponse {
  data: {
    cities: Cities[];
  };
}

export interface AccountFieldsApiResponse extends CommonApiResponse {
  data: {
    accountById: AccountById;
    accountDetails: AccountFieldsTypes;
  };
}

export interface States {
  rid: string;
  state_name: string;
}

export interface Cities {
  rid: string;
  city_name: string;
}

export interface Currencys {
  rid: string;
  currency_name: string;
  currency_code: string;
}
export interface Industries {
  rid: string;
  currency_name: string;
  currency_code: string;
}
export interface Classification {
  rid: string;
  classification_name: string;
  currency_code: string;
}

export interface GloablAcconunts {
  rid: string;
  account_name: string;
}

export interface Industries {
  rid: string;
  industry_name: string;
}

export interface Account {
  accountName: string;
  accountId: string;
  parentAccount: string | null;
  accountNumber: string;
  industry: string;
  country: string;
  totalProjects: string | number;
  totalProjectHours: string | number;
  totalProjectCost: string | number;
  estimatedHours: string | number;
  qre: string | number;
  estimatedCredits: string | number;
  actualCredits: string | number;
  financeExecutive: string;
  financeHead: string;
  professionalConsultant: string;
}

export interface Column<T> {
  id: keyof T;
  label: string;
  sortable?: boolean;
}

export interface AccountColumn {
  id: string;
  label: string;
  width: string;
  sortId: string;
  sortable?: boolean;
  sx?: React.CSSProperties;
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

export enum KeyContactsUpdate {
  Edit = 'edit',
  Delete = 'delete',
  Add = 'add',
}

export interface AccountById {
  parent_account_rid: string | null;
  r_number: string;
  account_name: string;
  industry: string;
  industry_rid: string;
  business_details: string;
  country_rid: string;
  currency_rid: string;
  status: Status;
  primary_contact_name: string;
  is_parent: boolean;
  comments: string | null;
  annual_revenue: number;
  region: string;
  rid: string;
  created_datetime: string;
  modified_datetime: string;
}

export interface KeyContacts {
  key_contact_id?: string;
  account_rid?: string;
  key_contact_name: string;
  key_contact_email: string;
  key_contact_role: string;
  is_primary_contact: boolean;
  include_in_communication: boolean;
  status: Status;
  action_type?: string;
  rid?: string;
}

export interface AccountFieldsTypes {
  rid: string;
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
  keyContacts: KeyContacts[];
  modified_by: string;
  created_by: string;
}

export interface NewAccountData extends AccountFieldsTypes, AccountById {
  account_id: string;
  account_currency_rid: string | null;
  account_country_rid: string | null;
  account_country_region_rid: string | null;
  account_city_rid: string;
  created_by: string;
  modified_by: string;
  finance_poc_number: string;
  account_rid: string;
  industry_rid: string;
  industry_name_other: string;
  key_contact_name: string;
  key_contact_email: string;
  key_contact_role: string;
  is_primary_contact: string;
  include_in_communication: string;
  key_contact_status: Status;
  key_contacts: KeyContacts[];
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
    account: {
      data: AccountList[];
    };
    count: number;
  };
};

export type GlobalAccountListResponse = {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    gloablAcconunt: AccountList[];
    count: number;
  };
};

export interface AccountListURLParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: object;
  globalFilters?: globalFilters;
  fiscalYear?: string;
}

export interface globalFilters {
  [key: string]: string[];
}
type Industry = {
  rid: string;
  industry_name: string;
};
export type AccountList = {
  rid: string;
  r_number: string;
  createdAt: string;
  updatedAt: string;
  account_name: string;
  comments: string;
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
  industry_rid: string;
  industry_name_other: string | null;
  is_file_drop_enabled: boolean;
  file_drop_medium: string | null;
  file_drop_config_id: string | null;
  total_projects: number;
  total_project_cost: number;
  total_projects_rd_credits: number;
  total_project_hours: number;
  qualifying_project_hours_fed: number;
  qualifying_project_qre_fed: number;
  qualifying_project_rd_credits_fed: number;
  created_datetime: string;
  modified_datetime: string;
  created_by: string;
  modified_by: string;
  country?: Country | null;
  currency?: Currency | null;
  industry?: Industry;
  child_accounts?: AccountList[];
  key_contacts: KeyContacts[];
  technical_consultant: string;
  financial_consultant: string;
  delivery_head: string;
  finance_executive: string;
};

export interface ConvertedAccount {
  accountName: string;
  accountId: string;
  parentAccount: string | null;
  accountNumber: string;
  industry: string;
  country: string;
  // currency: string;
  // status: 'Active' | 'In Active';
  // primaryContact: string;
  // parentAccountID: string | null;
  // annualRevenue: string;
  color: string;
  bgColor: string;
  totalProjects: string | number;
  totalProjectHours: string | number;
  totalProjectCost: string | number;
  estimatedHours: string | number;
  qre: string | number;
  estimatedCredits: string | number;
  actualCredits: string | number;
  financeExecutive: string;
  financeHead: string;
  professionalConsultant: string;
}

export interface keyContactRoles {
  rid: string;
  role_name: string;
}

export interface keyContactRolesApiResponse extends CommonApiResponse {
  data: {
    keyContactRoles: keyContactRoles[];
  };
}
