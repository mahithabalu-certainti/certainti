import { Router } from "express";
import controller from "../controllers";

import multer from "multer";
import { checkUserStatusMiddleware } from "../middlewares/authmiddleware";

const routes: Router = Router();
const upload = multer({storage : multer.memoryStorage()})
routes.post(
  "/task/create",
  checkUserStatusMiddleware("NA"),
  controller.activitiesController.createActivityTask
);

routes.get(
  "/tasks/list",
  checkUserStatusMiddleware("checklists_view_edit"),
  controller.activitiesController.getAllActivityTask
);

routes.post(
  "/email/create",
  checkUserStatusMiddleware("NA"),
  upload.array('files'),
  controller.activitiesController.createActivityEmail
)

routes.post(
  "/email/attachments/delete",
  checkUserStatusMiddleware("NA"),
  controller.activitiesController.deleteActivityAttachments
)

routes.get(
  "/email/detail/:activityRid/:accountRid",
  checkUserStatusMiddleware("NA"),
  controller.activitiesController.fetchEmailActivityById
);
export default routes;