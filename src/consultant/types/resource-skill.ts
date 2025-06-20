/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonApiResponse } from '../../common-service';

export interface ResourceSkillListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: object;
  accountNumber?: string;
  rid?: string;
  resourceRid?: string;
}

enum skillLevel {
  Beginner = 'Beginner',
  Intermediate = 'Intermediate',
  Advanced = 'Advanced',
}

export type ResourceSkillList = {
  resource_code?: string;
  rid: string;
  r_number: string;
  eid: '';
  account_rid: string;
  resource_type: string;
  resource_rid: string;
  resource_role: string;
  skill_rid: string;
  start_date: string;
  skill_description?: string;
  skill_level: skillLevel;
  fiscal_year: string;
  years_of_experience: string;
  resource_ref_id: string;
  technical_weightage?: string;
  status?: string;
  created_datetime: string;
  modified_datetime: string;
  created_by: null;
  modified_by: null;
  resource_number: string;
  resource_full_name: string;
  skill_details: string;
  skill_type_name: string;
  skill_subtype_name: string;
  skill_type_rid: string;
  skill_subtype_rid: string;
  skill_type_others?: string;
  skill_subtype_others?: string;
  comments?: string;
};

export interface ResourceSkillApiResponse extends CommonApiResponse {
  data: {
    resourceSkill: ResourceSkillList[];
    count: number;
  };
}

export type ResourceSkillFormData = {
  rid?: string;
  eid?: string;
  account_rid?: string;
  resource_type?: string;
  resource_rid?: string;
  resource_ref_id?: string;
  resource_desc?: string;
  start_date?: string;
  skill_description?: string;
  skill_level?: skillLevel;
  years_of_experience?: number;
  fiscal_year?: string;
  skill_type?: string;
  skill_name: string;
  technical_weightage?: string;
  accountNumber?: string;
};

export type ResourceSkillPayload = {
  rid?: string;
  eid?: string;
  account_rid?: string;
  resource_number: string;
  resource_type?: string;
  resource_rid?: string;
  resource_code?: string;
  resource_ref_id?: string;
  resource_desc?: string;
  start_date?: string;
  effective_from?: string;
  skill_description?: string;
  skill_level?: skillLevel;
  years_of_experience?: number | null;
  fiscal_year?: string;
  skill_type?: string;
  skill_name: string;
  technical_weightage?: string;
  accountNumber?: string;
  skill_type_rid?: string;
  skill_subtype_rid?: string;
  skill_details?: string;
  comments?: string;
  skill_type_others?: string;
  skill_subtype_others?: string;
};

export type ExportModule = {
  sortBy?: string;
  sortOrder?: string;
  fiscalYear?: string;
  rNumber?: string;
  resourceRid?: string;
  filter?: Record<string, any>;
};
