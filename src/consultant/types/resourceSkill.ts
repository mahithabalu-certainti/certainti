import { CommonApiResponse } from "../../common-service";

export interface ResourceSkillListParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
}

export type ResourceSkillList = {
  resourceRole: string;
  startDate: string;
  skillName:string;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  yearsOfExperience: string;
};


export interface ResourceSkillApiResponse extends CommonApiResponse {
  data: {
    resourceSkill: ResourceSkillList[];
    totalRecords: number;
  };
}
