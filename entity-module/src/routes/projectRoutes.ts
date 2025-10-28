import { Router } from "express";
import controller from "../controllers";
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";

const routes: Router = Router();

routes.post(
  "/list",
  checkUserStatusMiddleware("projects_view_edit"),
  controller.projectController.allProjectList
);
routes.get(
  "/list/export",
  checkUserStatusMiddleware("projects_export"),
  controller.projectController.exportAllProjectList
);
routes.get(
  "/list/:accountId",
  checkUserStatusMiddleware("projects_view_edit"),
  controller.projectController.projectList
);
routes.get(
  "/export/:accountId",
  checkUserStatusMiddleware("projects_export"),
  controller.projectController.exportProjectList
);
routes.get(
  "/list/:accountId/:projectId",
  checkUserStatusMiddleware("projects_view_edit"),
  controller.projectController.projectById
);
routes.post(
  "/new",
  checkUserStatusMiddleware("projects_create"),
  controller.projectController.createProject
);
routes.put(
  "/update",
  checkUserStatusMiddleware("projects_view_edit"),
  controller.projectController.updateProject
);
routes.get(
  "/projectclassification",
  checkUserStatusMiddleware("NA"),
  controller.projectController.projectClassification
);
routes.post(
  "/qreHistory",
  checkUserStatusMiddleware("projects_view_edit"),
  controller.projectController.fetchQreHistory
)

export default routes;
