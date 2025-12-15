/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonApiResponse } from '../../common-service';

export type GeoBasedRule = {
  rid: string;
  created_datetime: string;
  modified_datetime: string | null;
  group_name: string;
  is_consultant_only_group: boolean;
  group_type_rid: string;
  user_count: string;
};
export interface GeoBasedRuleListParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
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
