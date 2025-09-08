import { Router } from "express";
import userRoutes from "./userRoutes";
import { errorLog, successLog } from "../utils/helpers";
import userGroupRoutes from "./userGroupRoutes";
import settingsRoutes from "./settingsRoutes";

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
    res
      .status(500)
      .json({
        status: "error",
        message: "Internal Server Error: Unable to perform health check.",
      });
    return;
  }
});
routes.use("/user", userRoutes);
routes.use("/user_group", userGroupRoutes);
routes.use("/admin_settings", settingsRoutes);

export default routes;
