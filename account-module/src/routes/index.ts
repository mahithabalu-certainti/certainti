import { Router } from "express";
import accountRoutes from "./accountRoutes";
import { testDbConnection } from "../config/dataSource";
import { errorLog, successLog } from "../utils/helpers";

const routes: Router = Router();

routes.get("/health", async (req, res) => {
  const methodName = "health check";
  try {
    const dbStatus = await testDbConnection();
    successLog(methodName);
    res.status(200).json({ status: "ok", dbStatus });
    return;
  } catch (error) {
    errorLog(methodName, "Failed to connect to database");
    res
      .status(500)
      .json({ status: "error", message: "Failed to connect to database" });
    return;
  }
});
routes.use("/accounts", accountRoutes);

export default routes;
