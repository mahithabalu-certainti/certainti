import { Router } from "express";
import controller from "../controllers";

import { checkUserStatusMiddleware } from "../middlewares/authmiddleware";
import multer from "multer";

const routes: Router = Router();

routes.post(
  "/new",
  checkUserStatusMiddleware("NA"),
  controller.interactionTemplateController.createInteractionTemplate
);

routes.post(
  "/update",
  checkUserStatusMiddleware("NA"),
  controller.interactionTemplateController.updateInteractionTemplate
);

routes.get(
  "/detail/:templateRid",
  checkUserStatusMiddleware("NA"),
  controller.interactionTemplateController.getInteractionTemplateDetailsById
);
routes.post('/list', checkUserStatusMiddleware("NA"), controller.interactionTemplateController.listInteractionTemplates)
routes.post('/export', checkUserStatusMiddleware("NA"), controller.interactionTemplateController.exportInteractionTemplate)
export default routes;
