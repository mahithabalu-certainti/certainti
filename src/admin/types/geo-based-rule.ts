/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonApiResponse } from '../../common-service';

export type GeoBasedRule = {
  rid: string;
  r_number: string;
  config_name: string;
  country_name: string;
  country_rid: string;
  state_name: string | null;
  state_rid: string | null;
  is_federal: boolean;
  effective_start_date: string;
  effective_end_date: string | null;
  status_name: string;
  status_rid: string;
  created_datetime: string;
  modified_datetime: string | null;
  created_user_name: string;
  modified_user_name: string | null;
  credit_config_group_rid: string;
  jurisdiction_config_group_rid?: string;
  platform_config_group_rid?: string;
  jurisdictionConfig?: any;
  platformConfig?: any;
};
export interface GeoBasedRuleListParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filter?: any;
}
export interface ConfigItem {
  label: string;
  displayName: string;
  value: any;
  type: string;
}

export interface JurisdictionConfig {
  configItems: ConfigItem[];
  credit_program_name: string;
  config_rid: string | null;
}

export interface ConfigDetails {
  jurisdictionConfig: JurisdictionConfig;
}

export interface GeoBasedApiResponse extends CommonApiResponse {
  data: {
    configs: GeoBasedRule[];
    count: number;
    configDetails?: ConfigDetails;
  };
}
