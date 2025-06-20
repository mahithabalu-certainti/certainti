export interface IAccount {
  account_id: string;
  account_number: string;
  account_name: string;
  comments?: string | null;
  status_id: string;
  eid: number;
  is_parent: boolean;
  region: number;
  storage_type: "separate_db" | "store_in_parent";
  parent_account_rid?: string | null;
  currency_rid: string;
  country_rid: string;
  region_rid: string;
  city_rid: number;
  tax_claim_level: string;
  max_ai_interactions: number;
  expiry_duration: number;
  autosend_interaction: boolean;
  auto_access_rd: boolean;
  fiscal_start_date: string;
  fiscal_end_date: string;
  interaction_cc_list?: string | null;
  blended_rate_fte?: number | null;
  blended_rate_subcon?: number | null;
  created_by?: string | null;
  modified_by?: string | null;
  industry_rid: string;
  industry_name_other?:string;
  website?: string | null;
  database_level: boolean;
  database_connection_rid?: number | null;
  created_datetime?: string | null;
  modified_datetime?: string | null;
  annual_revenue?: number | null;
  data_residency?: string | null;
  data_storage: "separate_db" | "store_in_parent";
  key_contacts:any;
  business_details:string
  logo_url:string;
  organisation_name:string;
}

export interface IUpdateAccount {
  account_rid: string;
  account_id: string;
  account_number: string;
  account_name: string;
  comments?: string | null;
  status_id: string;
  eid: number;
  is_parent: boolean;
  region: number;
  storage_type: "separate_db" | "store_in_parent";
  parent_account_rid?: string | null;
  currency_rid: string;
  country_rid: string;
  region_rid: string;
  city_rid: number;
  tax_claim_level: string;
  max_ai_interactions: number;
  expiry_duration: number;
  autosend_interaction: boolean;
  auto_access_rd: boolean;
  fiscal_start_date: string;
  fiscal_end_date: string;
  interaction_cc_list?: string | null;
  blended_rate_fte?: number | null;
  blended_rate_subcon?: number | null;
  created_by?: string | null;
  modified_by?: string | null;
  industry_rid: string;
  industry_name_other?:string;
  website?: string | null;
  database_level: boolean;
  database_connection_rid?: number | null;
  created_datetime?: string | null;
  modified_datetime?: string | null;
  annual_revenue?: number | null;
  data_residency?: string | null;
  data_storage: "separate_db" | "store_in_parent";
  r_number: string;
  business_details:string;
  key_contacts:any;
  logo_url:string;
  organisation_name:string;
}

export interface IKeyContactDetail {
  key_contact_id: string;
  key_contact_name: string;
  key_contact_email: string;
  key_contact_role: string;
  is_primary_contact: boolean;
  include_in_communication: boolean;
  interaction_cc_recipient: boolean;
  status: "active" | "inactive";
}

export interface IUpdateKeyContactDetail {
  rid: string;
  key_contact_name: string;
  key_contact_email: string;
  key_contact_role: string;
  is_primary_contact: boolean;
  include_in_communication: boolean;
  interaction_cc_recipient: boolean;
  status: "active" | "inactive";
}

export type IColorCodeType = 'Active' | 'Inactive' | 'All';