
import { initMainDbSequelize } from "../config/mainDataSource";

import { InteractionStatus } from "./interactionStatus";
import { InteractionType } from "./interactionType";
import { InteractionTemplate } from "./interactionTemplate";
import { AiAssessmentEventTracker } from "./aiAssessmentEventTracker";

export const models = {
  InteractionStatus,
  InteractionType,
  InteractionTemplate,
  AiAssessmentEventTracker
};

export async function initModels() {
  try {
    const sequelize = await initMainDbSequelize();
   
    Object.values(models).forEach((model: any) => { 
      if (model.associate) { 
        model.associate(models); 
      } 
    });
  } catch (err) {
    console.log("Errr loading models", err);
  }
}
