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
// export interface ConfigItem {
//   label: string;
//   displayName: string;
//   value: any;
//   type: string;
// }

// export interface JurisdictionConfig {
//   configItems: ConfigItem[];
//   credit_program_name: string;
//   config_rid: string | null;
// }

// export interface ConfigDetails {
//   jurisdictionConfig: JurisdictionConfig;
// }

export interface ConfigDetails {
  config_name: string;
  jurisdictionConfig: {
    configItems: ConfigItem[];
    credit_program_name: string;
    config_rid: string;
  };
  platformConfig: {
    configItems: ConfigItem[];
    credit_program_name: string;
    config_rid: string;
  };
  effective_start_date: string;
  effective_end_date: string;
  country_rid: string;
  is_federal: boolean;
  state_rid: string | null;
  country_code: string;
  state_name: string | null;
  country_name: string;
  created_datetime: string;
  created_by: string;
  modified_datetime: string;
  modified_by: string;
  created_user_name: string;
  modified_user_name: string;
  status_rid: string;
  r_number: string;
  rid: string;
}

export interface ConfigItem {
  label: string;
  displayName: string;
  value: string | number | string[];
  type: string;
  is_required: boolean;
}

export interface GeoBasedApiResponse extends CommonApiResponse {
  data: {
    configs: GeoBasedRule[];
    count: number;
    configDetails?: ConfigDetails;
  };
}

export interface CreateConfigPayload {
  config_name: string;
  status_rid: string;
  is_federal: boolean;
  effective_start_date: string; // ISO date format: "YYYY-MM-DD"
  effective_end_date: string; // ISO date format: "YYYY-MM-DD"
  jurisdiction_config_group_rid: string;
  jurisdictionConfig?: {
    rrc_elect_280c_no: number;
    rrc_credit_rate: number;
    rrc_sub_con_percent: number;
    rrc_fixed_base_percentage: number;
    rrc_elect_280c_yes: number;
    asc_sub_con_percent: number;
    asc_credit_rate: number;
    asc_fixed_base_percentage: number;
    asc_elect_280c_yes: number;
    asc_elect_280c_no: number;
    rrc_qre_cap_rate: number;
  };
  platform_config_group_rid: string;
  platformConfig?: {
    project_type: string;
    submission_date: string;
  };
  config_rid: string;
}
