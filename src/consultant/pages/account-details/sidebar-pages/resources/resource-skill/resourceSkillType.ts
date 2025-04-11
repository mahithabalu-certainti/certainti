// import { ResourceSkillList } from '../../../types/resourceSkill';

import { ResourceSkillList } from "../../../../../types/resourceSkill";

export interface RenderSkillRowProps {
  resourceSkill: ResourceSkillType[];
}

export interface ResourceSkillType {
  resourceRole?: string;
  startDate?: string;
  skillName?: string;
  skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  yearsOfExperience?: string;
}

export function convertResourceSkill(
  resourceSkill: ResourceSkillList[]
): ResourceSkillType[] {
  const resourceSkillList: ResourceSkillType[] = [];

  function ProcessResourceSkill(skill: ResourceSkillList): void {
    const convertedSkill: ResourceSkillType = {
      resourceRole: skill.resourceRole,
      startDate: skill.startDate,
      skillName: skill.skillName,
      skillLevel: skill.skillLevel,
      yearsOfExperience: skill.yearsOfExperience,
    };
    resourceSkillList.push(convertedSkill);
  }

  resourceSkill.forEach((skill) => {
    ProcessResourceSkill(skill);
  });

  return resourceSkillList;
}
