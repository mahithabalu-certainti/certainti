import { Router } from "express";
import controller from "../controllers";
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";

const routes: Router = Router();

routes.get(
  "/list",
  checkUserStatusMiddleware("projects_task_view_edit"),
  controller.projectTaskController.getProjectTasks
);
routes.get(
  "/type",
  checkUserStatusMiddleware("NA"),
  controller.projectTaskController.fetchProjectTaskTypes
);
routes.get(
  "/classification",
  checkUserStatusMiddleware("NA"),
  controller.projectTaskController.fetchProjectTaskClassification
);
routes.get(
  "/list/export",
  checkUserStatusMiddleware("projects_task_export"),
  controller.projectTaskController.exportAllProjectTasks
);
routes.get(
  "/detail",
  checkUserStatusMiddleware("projects_task_view_edit"),
  controller.projectTaskController.getProjectTaskById
);
routes.get(
  "/assignedCodes/:accountId/:projectFiscalId",
  checkUserStatusMiddleware("NA"),
  controller.projectTaskController.assignedResourceCodes
);
routes.post(
  "/new",
  checkUserStatusMiddleware("projects_task_create"),
  controller.projectTaskController.createProjectTask
);
routes.put(
  "/update",
  checkUserStatusMiddleware("projects_task_view_edit"),
  controller.projectTaskController.updateProjectTask
);
routes.put(
  "/status/update",
  checkUserStatusMiddleware("projects_task_view_edit"),
  controller.projectTaskController.anomalyStatusUpdate
)
routes.post(
  "/resourceCodes",
  checkUserStatusMiddleware("NA"),
  controller.projectTaskController.fetchReCodeForPrjTask
)

export default routes;
