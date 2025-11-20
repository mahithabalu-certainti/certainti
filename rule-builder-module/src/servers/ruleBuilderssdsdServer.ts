import express from "express";

import ruleRoutes from "../routes/ruleRoutes";
import conditionRoutes from "../routes/conditionRoutes";
import actionRoutes from "../routes/actionRoutes";

export const createRuleBuilderServer = () => {
  const app = express();

  app.use(express.json());

  // Register each module route under /api
  app.use("/api/rules", ruleRoutes);
  app.use("/api/conditions", conditionRoutes);
  app.use("/api/actions", actionRoutes);

  return app;
};
