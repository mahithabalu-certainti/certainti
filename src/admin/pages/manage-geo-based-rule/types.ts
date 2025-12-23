/* eslint-disable @typescript-eslint/no-explicit-any */
export interface GeoBasedRuleFormData {
  rid?: string;
  rule_name?: string;
  country?: string;
  region?: string;
  is_federal?: string | boolean;
  effective_start_date?: string;
  effective_end_date?: string;
  created_datetime?: string;
  modified_datetime?: string;
}

export interface GeoBasedRulePayload {
  config_name: string;
  state_rid?: string;
  status_rid: string;
  country?: string;
  is_federal: boolean;
  effective_start_date: string;
  effective_end_date: string | null;
  rid?: string;
  jurisdiction_config_group_rid?: string;
  platform_config_group_rid?: string;
  jurisdictionConfig?: Record<string, any>;
  platformConfig?: Record<string, any>;
  config_rid?: string;
}
