import { initOrgSequelize } from "../config/orgDataSource";
import { Resources } from "./resource";
import { ResourceCost } from "./resourceCost";
import { ResourceCostHistory } from "./resourceCostHistory";
import { ResourceCostTimeline } from "./resourceCostTimeline";
import { ResourceSkill } from "./resourceSkill";
import { ResourceSkillHistory } from "./resourceSkillHistory";
import { ResourceSkillTimeline } from "./resourceSkillTimeline";
import { Skill } from "./skill";
import {KeyContact}  from "./keyContactDetails"
import { CurrencyConversion } from "./currencyConversionModel";
export const models: {
  Resources: typeof Resources;
  ResourceCost: typeof ResourceCost;
  ResourceCostTimeline: typeof ResourceCostTimeline;
  ResourceCostHistory: typeof ResourceCostHistory;
  Skill: typeof Skill;
  ResourceSkill: typeof ResourceSkill;
  ResourceSkillTimeline: typeof ResourceSkillTimeline;
  ResourceSkillHistory: typeof ResourceSkillHistory;
  KeyContact:typeof KeyContact;
  CurrencyConversion: typeof CurrencyConversion;
} = {
  Resources: Resources,
  ResourceCost: ResourceCost,
  ResourceCostTimeline: ResourceCostTimeline,
  ResourceCostHistory: ResourceCostHistory,
  Skill: Skill,
  ResourceSkill: ResourceSkill,
  ResourceSkillTimeline: ResourceSkillTimeline,
  ResourceSkillHistory: ResourceSkillHistory,
  KeyContact:KeyContact,
  CurrencyConversion: CurrencyConversion
};
