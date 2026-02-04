import { initMainDbSequelize } from "../config/mainDataSource";
// import { Case } from "./caseModel";
import { logMessage } from "../utils/helpers";

export const models = {
    // Case,
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
        logMessage(`Error loading models: ${err}`);
    }
}
