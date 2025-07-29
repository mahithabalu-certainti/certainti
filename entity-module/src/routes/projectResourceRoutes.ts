import { Router } from "express";
import controller from "../controllers";
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";

const routes: Router = Router();

routes.get(
  "/skillroles",
  checkUserStatusMiddleware("NA"),
  controller.projectResourcesController.resourceSkillRoles
);
routes.get(
  "/skillSubtype",
  checkUserStatusMiddleware("NA"),
  controller.projectResourcesController.resourceSkillRolesSubtype
);
routes.get(
  "/list/:accountId/:projectId",
  checkUserStatusMiddleware("projects_resources_view_edit"),
  controller.projectResourcesController.listProjectResource
);
routes.get(
  "/export/:accountId/:projectId",
  checkUserStatusMiddleware("projects_resources_export"),
  controller.projectResourcesController.exportProjectResource
);
routes.get(
  "/detail/:accountId/:id",
  checkUserStatusMiddleware("projects_resources_view_edit"),
  controller.projectResourcesController.projectResourceDetails
);
routes.get(
  "/resourcecodes/:accountId",
  checkUserStatusMiddleware("NA"),
  controller.projectResourcesController.resourceCodes
);
routes.get(
  "/assignedcodes/:accountId/:projectFiscalId",
  checkUserStatusMiddleware("NA"),
  controller.projectResourcesController.assignedResourceCodes
);
routes.post(
  "/new",
  checkUserStatusMiddleware("projects_resources_create"),
  controller.projectResourcesController.createProjectResource
);
routes.put(
  "/update",
  checkUserStatusMiddleware("projects_resources_view_edit"),
  controller.projectResourcesController.updateProjectResource
);

export default routes;
