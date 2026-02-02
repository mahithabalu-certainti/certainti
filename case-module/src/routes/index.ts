import { Router } from "express";
import { errorLog, successLog } from "../utils/helpers";
import caseRoutes from "./caseRoutes";
import caseManagementRoutes from "./caseManagementRoutes"
import jurisdictionRoutes from "./jurisdictionRoutes";
import historicalSubmissionRoutes from "./historicalSubmissionRoutes";
import activitiesRoutes from "./activitiesRoutes";
import projectResourceRoutes from "./projectResourceRoutes"
import projectTaskRoutes from "./projectTaskRoutes"
import projectRoutes from "./projectRoutes"
import dataMapperRoutes from "./dataMapperRoutes"
import financialRDCreditRoutes from "./financialRDCreditRoutes";
import rdFormMapperRoutes from "./rdFormMapperRoutes";

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

routes.use("/cases", caseRoutes);
routes.use("/caseManagement", caseManagementRoutes);
routes.use("/activities", activitiesRoutes);
routes.use("/jurisdictions", jurisdictionRoutes);
routes.use("/historicalSubmission", historicalSubmissionRoutes);
routes.use("/caseProjectResource", projectResourceRoutes);
routes.use("/caseProjectTask", projectTaskRoutes);
routes.use("/caseProject", projectRoutes);
routes.use("/dataMapper", dataMapperRoutes);
routes.use("/rd-credit", financialRDCreditRoutes);
routes.use("/rdFormMapper", rdFormMapperRoutes);

export default routes;
