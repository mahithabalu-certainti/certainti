import { Router } from "express";
import controller from "../controllers";
import { checkUserStatusMiddleware } from "../middlewares/authmiddleware";

const routes: Router = Router();
routes.post(
  "/adminChecklist/create",
  checkUserStatusMiddleware("NA"),
  controller.caseManagementController.createAdminCheckList
);
routes.get(
  "/adminChecklist/list",
  checkUserStatusMiddleware("NA"),
  controller.caseManagementController.listAdminCheckList
);
routes.post(
  "/taskTemplate/create",
  checkUserStatusMiddleware("NA"),
  controller.caseManagementController.createTaskTemplate
);
routes.get(
  "/priority",
  checkUserStatusMiddleware("NA"),
  controller.caseManagementController.getPriorityTypes
)
routes.get(
  "/caseMilestones",
  checkUserStatusMiddleware("NA"),
  controller.caseManagementController.getMilestones
)
routes.get(
  "/checklist",
  checkUserStatusMiddleware("NA"),
  controller.caseManagementController.getChecklist
)
routes.put(
  "/taskTemplate/update",
  checkUserStatusMiddleware("NA"),
  controller.caseManagementController.updateTaskTemplate
);

export default routes;
