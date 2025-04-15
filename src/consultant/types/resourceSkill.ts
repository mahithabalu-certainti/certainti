import { CommonApiResponse } from '../../common-service';

export interface ResourceSkillListParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  accountNumber?: string;
  fiscalYear?: number;
}

enum skillLevel {
  Beginner = 'Beginner',
  Intermediate = 'Intermediate',
  Advanced = 'Advanced',
}

export type ResourceSkillList = {
  rid: string;
  r_number: string;
  eid: '';
  account_rid: string;
  resource_type: string;
  resource_rid: string;
  resource_desc: string;
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
  skill_name: string;
};

export interface ResourceSkillApiResponse extends CommonApiResponse {
  data: {
    resourceSkill: ResourceSkillList[];
    count: number;
  };
}
