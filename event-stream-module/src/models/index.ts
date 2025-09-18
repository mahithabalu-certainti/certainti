
import { initMainDbSequelize } from "../config/mainDataSource";

export const models = {

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
