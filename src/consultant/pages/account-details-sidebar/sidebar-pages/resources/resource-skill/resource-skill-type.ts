// import { ResourceSkillList } from '../../../types/resourceSkill';

import { ResourceSkillList } from '../../../../../types/resource-skill';

export interface RenderSkillRowProps {
  resourceSkill: ResourceSkillType[];
}

export enum skillLevel {
  Beginner = 'Beginner',
  Intermediate = 'Intermediate',
  Advanced = 'Advanced',
}

export interface ResourceSkillType {
  skillRId?: string;
  resourceRole?: string;
  resourceRID?: string;
  startDate?: string;
  skillDetails?: string;
  skillLevel?: string;
  skillType?: string;
  skillSubType?: string;
  yearsOfExperience?: string;
  skillTypeId?: string;
  skillSubTypeId?: string;
  skillTypeOthers?: string;
  skillSubTypeOthers?: string;
  comments?: string;
  Created_On?: string;
  Created_By?: string | null;
  Updated_On?: string;
  Updated_By?: string | null;
  resourceNumber?: string;
}

export function convertResourceSkill(
  resourceSkill: ResourceSkillList
): ResourceSkillType {
  const convertedSkill: ResourceSkillType = {
    resourceRole: resourceSkill.resource_role,
    resourceRID: resourceSkill.resource_rid,
    skillRId: resourceSkill.rid,
    startDate: resourceSkill.start_date,
    skillDetails: resourceSkill.skill_details,
    skillType: resourceSkill.skill_type_name,
    skillSubType: resourceSkill.skill_subtype_name,
    skillLevel: resourceSkill.skill_level_rid,
    skillTypeId: resourceSkill.skill_type_rid,
    skillSubTypeId: resourceSkill.skill_subtype_rid,
    skillTypeOthers: resourceSkill.skill_type_others,
    skillSubTypeOthers: resourceSkill.skill_subtype_others,
    comments: resourceSkill.comments,
    Created_On: resourceSkill?.created_datetime,
    Created_By: resourceSkill?.created_by,
    Updated_On: resourceSkill?.modified_datetime,
    Updated_By: resourceSkill?.modified_by,
    resourceNumber: resourceSkill?.r_number,
  };

  return convertedSkill;
}
