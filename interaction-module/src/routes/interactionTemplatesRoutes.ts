import { Router } from "express";
import controller from "../controllers";

import { checkUserStatusMiddleware } from "../middlewares/authmiddleware";
import multer from "multer";

const routes: Router = Router();

routes.post(
  "/new",
  checkUserStatusMiddleware("interaction_templates_create"),
  controller.interactionTemplateController.createInteractionTemplate
);

routes.post(
  "/update",
  checkUserStatusMiddleware("interaction_templates_view_edit"),
  controller.interactionTemplateController.updateInteractionTemplate
);

routes.get(
  "/detail/:templateRid",
  checkUserStatusMiddleware("interaction_templates_view_edit"),
  controller.interactionTemplateController.getInteractionTemplateDetailsById
);
routes.post('/list', checkUserStatusMiddleware("interaction_templates_view_edit"), controller.interactionTemplateController.listInteractionTemplates)
routes.post('/export', checkUserStatusMiddleware("interaction_templates_export"), controller.interactionTemplateController.exportInteractionTemplate)
routes.post('/exportAll', checkUserStatusMiddleware("interaction_templates_export"), controller.interactionTemplateController.exportAllInteractionTemplates)
export default routes;
