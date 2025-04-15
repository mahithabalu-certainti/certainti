// import { ResourceSkillList } from '../../../types/resourceSkill';

import { ResourceSkillList } from "../../../../../types/resourceSkill";

export interface RenderSkillRowProps {
  resourceSkill: ResourceSkillType[];
}

export enum skillLevel{
  Beginner = 'Beginner',
  Intermediate = 'Intermediate',
  Advanced = 'Advanced',
}

export interface ResourceSkillType {
  resourceRole?: string;
  resourceRID?:string;
  startDate?: string;
  skillName?: string;
  skillLevel?: skillLevel;
  yearsOfExperience?: string;
}

export function convertResourceSkill(
  resourceSkill: ResourceSkillList[]
): ResourceSkillType[] {
  const resourceSkillList: ResourceSkillType[] = [];

  function ProcessResourceSkill(skill: ResourceSkillList): void {
    const convertedSkill: ResourceSkillType = {
      resourceRole: skill.resource_desc,
      resourceRID: skill.resource_rid,
      startDate: skill.start_date,
      skillName: skill.skill_name,
      skillLevel: skill.skill_level,
      yearsOfExperience: skill.years_of_experience,
    };
    resourceSkillList.push(convertedSkill);
  }

  resourceSkill.forEach((skill) => {
    ProcessResourceSkill(skill);
  });

  return resourceSkillList;
}
