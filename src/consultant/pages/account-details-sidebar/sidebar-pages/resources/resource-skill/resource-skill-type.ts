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
  skillLevel?: skillLevel;
  skillType?: string;
  skillSubType?: string;
  yearsOfExperience?: string;
  skillTypeId?: string;
  skillSubTypeId?: string;
  skillTypeOthers?: string;
  skillSubTypeOthers?: string;
  comments?: string;
}

export function convertResourceSkill(
  resourceSkill: ResourceSkillList[]
): ResourceSkillType[] {
  const resourceSkillList: ResourceSkillType[] = [];

  function ProcessResourceSkill(skill: ResourceSkillList): void {
    const convertedSkill: ResourceSkillType = {
      resourceRole: skill.resource_role,
      resourceRID: skill.resource_rid,
      skillRId: skill.rid,
      startDate: skill.start_date,
      skillDetails: skill.skill_details,
      skillType: skill.skill_type_name,
      skillSubType: skill.skill_subtype_name,
      skillLevel: skill.skill_level,
      skillTypeId: skill.skill_type_rid,
      skillSubTypeId: skill.skill_subtype_rid,
      skillTypeOthers: skill.skill_type_others,
      skillSubTypeOthers: skill.skill_subtype_others,
      comments: skill.comments,
    };
    resourceSkillList.push(convertedSkill);
  }

  resourceSkill.forEach((skill) => {
    ProcessResourceSkill(skill);
  });

  return resourceSkillList;
}
