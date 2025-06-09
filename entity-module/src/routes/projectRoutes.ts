import { Router } from "express";
import controller from "../controllers";
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";

const routes: Router = Router();

routes.get(
  "/list",
  checkUserStatusMiddleware("projects_projects_view_all"),
  controller.projectController.allProjectList
);
routes.get(
  "/list/export",
  checkUserStatusMiddleware("projects_projects_export"),
  controller.projectController.exportAllProjectList
);
routes.get(
  "/list/:accountId",
  checkUserStatusMiddleware("account_projects_view_all"),
  controller.projectController.projectList
);
routes.get(
  "/export/:accountId",
  checkUserStatusMiddleware("account_projects_download"),
  controller.projectController.exportProjectList
);
routes.get(
  "/list/:accountId/:projectId",
  checkUserStatusMiddleware("account_projects_view_overview"),
  controller.projectController.projectById
);
routes.post(
  "/new",
  checkUserStatusMiddleware("account_projects_create"),
  controller.projectController.createProject
);
routes.put(
  "/update",
  checkUserStatusMiddleware("account_projects_edit_update"),
  controller.projectController.updateProject
);
routes.get(
  "/projectclassification",
  checkUserStatusMiddleware("NA"),
  controller.projectController.projectClassification
);

export default routes;
