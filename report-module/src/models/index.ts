import { initMainDbSequelize } from "../config/mainDataSource";
import { logMessage } from "../utils/helpers";
import { CaseSummary } from "./caseSummaryModel";

export const models = {
    CaseSummary,
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
