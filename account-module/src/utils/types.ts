export interface IAccount {
  account_id: string;
  account_number: string;
  account_name: string;
  comments?: string | null;
  status: "active" | "inactive";
  eid: number;
  is_parent: boolean;
  region: number;
  storage_type: "separate_db" | "store_in_parent";
  parent_account_rid?: string | null;
  account_currency_rid: string;
  account_country_rid: string;
  account_country_region_rid: string;
  account_city_rid: number;
  tax_claim_level: string;
  max_ai_interactions: number;
  expiry_duration: number;
  autosend_interaction: boolean;
  auto_access_rd: boolean;
  fiscal_start_date: string;
  fiscal_end_date: string;
  interaction_cc_list?: string | null;
  blended_rate_fte?: string | null;
  blended_rate_subcon?: string | null;
  created_by?: string | null;
  modified_by?: string | null;
  industry_rid: string;
  industry_name_other?:string;
  website?: string | null;
  database_level: boolean;
  database_connection_rid?: number | null;
  created_datetime?: string | null;
  modified_datetime?: string | null;
  annual_revenue?: string | null;
  data_residency?: string | null;
  data_storage: "separate_db" | "store_in_parent";
  key_contacts:any;
  business_details:string
}

export interface IUpdateAccount {
  account_rid: string;
  account_id: string;
  account_number: string;
  account_name: string;
  comments?: string | null;
  status: "active" | "inactive";
  eid: number;
  is_parent: boolean;
  region: number;
  storage_type: "separate_db" | "store_in_parent";
  parent_account_rid?: string | null;
  account_currency_rid: string;
  account_country_rid: string;
  account_country_region_rid: string;
  account_city_rid: number;
  tax_claim_level: string;
  max_ai_interactions: number;
  expiry_duration: number;
  autosend_interaction: boolean;
  auto_access_rd: boolean;
  fiscal_start_date: string;
  fiscal_end_date: string;
  interaction_cc_list?: string | null;
  blended_rate_fte?: string | null;
  blended_rate_subcon?: string | null;
  created_by?: string | null;
  modified_by?: string | null;
  industry_rid: string;
  industry_name_other?:string;
  website?: string | null;
  database_level: boolean;
  database_connection_rid?: number | null;
  created_datetime?: string | null;
  modified_datetime?: string | null;
  annual_revenue?: string | null;
  data_residency?: string | null;
  data_storage: "separate_db" | "store_in_parent";
  r_number: string;
  business_details:string;
  key_contacts:any;
}

export interface IKeyContactDetail {
  key_contact_id: string;
  key_contact_name: string;
  key_contact_email: string;
  key_contact_role: string;
  is_primary_contact: boolean;
  include_in_communication: boolean;
  status: "active" | "inactive";
}

export interface IUpdateKeyContactDetail {
  rid: string;
  key_contact_name: string;
  key_contact_email: string;
  key_contact_role: string;
  is_primary_contact: boolean;
  include_in_communication: boolean;
  status: "active" | "inactive";
}

export type IColorCodeType = 'Active' | 'Inactive' | 'All';