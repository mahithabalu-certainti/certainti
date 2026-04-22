import { initSequelize } from "../config/maindbDataSource";
import { RuleMaster } from "./workflowRuleMaster";
import { errorLog } from "../utils/helpers";

export async function initModels() {
    try {
        const sequelize = await initSequelize();
        //RuleMaster.initialize(sequelize);
    } catch (err) {
        errorLog("Error loading models:", (err as Error).message);
    }
}

