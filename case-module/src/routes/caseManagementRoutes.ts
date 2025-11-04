import { Router } from "express";
import controller from "../controllers";
import { checkUserStatusMiddleware } from "../middlewares/authmiddleware";

const routes: Router = Router();
routes.post(
  "/adminChecklist/create",
  checkUserStatusMiddleware("NA"),
  controller.caseManagementController.createAdminCheckList
);

export default routes;
