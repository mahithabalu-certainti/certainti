import { Router } from "express";
import accountRoutes from "./accountRoutes";
import { errorLog, successLog } from "../utils/helpers";

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
routes.use("/accounts", accountRoutes);

export default routes;
