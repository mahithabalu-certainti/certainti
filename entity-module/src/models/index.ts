import { initOrgSequelize } from "../config/dataSource";
import { ResourceCostAuditLog } from "./resourceCostAuditLog";
import { Resources } from "./resource";
import { ResourceCost } from "./resourceCost";

export const models: {
  Resources: typeof Resources;
  ResourceCost: typeof ResourceCost;
  ResourceCostAuditLog: typeof ResourceCostAuditLog;
} = {
  Resources: Resources,
  ResourceCost: ResourceCost,
  ResourceCostAuditLog: ResourceCostAuditLog,
};

export async function initModels() {
  try {
    const sequelize = await initOrgSequelize();
    Resources.initialize(sequelize);
    ResourceCost.initialize(sequelize);
    ResourceCostAuditLog.initialize(sequelize);
    await sequelize.sync({ force: false });
  } catch (err) {
    console.log("Errr loading models", err);
  }
}
