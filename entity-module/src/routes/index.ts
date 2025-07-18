import { Router } from "express";
import resourceCostRoutes from "./resourceCostRoutes";
import resourceRoutes from "./resourceRoutes";
import resourceSkillRoutes from "./resourceSkillRoutes";
import projectRoutes from "./projectRoutes";
import attachmentRoutes from "./attachmentRoutes";
import projectResourceRoutes from "./projectResourceRoutes";
import { errorLog, successLog } from "../utils/helpers";
import importRoutes from './importRoutes'

const routes: Router = Router();

routes.get("/health", async (req, res) => {
  const methodName = "health check";
  try {
    successLog(methodName);
    res.status(200).send("OK");
    return;
  } catch (error) {
    errorLog(
      methodName,
      "Internal Server Error: Unable to perform health check."
    );
    res.status(500).json({
      status: "error",
      message: "Internal Server Error: Unable to perform health check.",
    });
    return;
  }
});
routes.use("/resources", resourceRoutes);
routes.use("/resource_cost", resourceCostRoutes);
routes.use("/resource_skill", resourceSkillRoutes);
routes.use("/project", projectRoutes);
routes.use("/attachment", attachmentRoutes);
routes.use("/project_resources", projectResourceRoutes);
routes.use("/import", importRoutes)

export default routes;
