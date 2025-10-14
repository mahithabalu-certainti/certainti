import { Router } from "express";
import { errorLog, successLog } from "../utils/helpers";
import interactionRoutes from "./interactionRoutes";
import interactionTemplateRoutes from "./interactionTemplatesRoutes";
import extInteractionRoute from "./extInteractionRoute";
import webhookRoute from "./webhookRoute";

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


// Initialize interaction module endpoints here
routes.use("/interactions", interactionRoutes);
routes.use("/interactionTemplates", interactionTemplateRoutes);
routes.use("/extInteractions", extInteractionRoute);
routes.use("/email", webhookRoute);

export default routes;
