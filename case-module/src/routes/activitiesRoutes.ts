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
  "/email/update",
  checkUserStatusMiddleware("NA"),
  upload.array('files'),
  controller.activitiesController.updateActivityEmail
)

routes.post(
  "/meeting/update",
  checkUserStatusMiddleware("NA"),
  upload.array('files'),
  controller.activitiesController.updateActivityMeeting
)

routes.post(
  "/meeting/create",
  checkUserStatusMiddleware("NA"),
  upload.array('files'),
  controller.activitiesController.createActivityMeeting
)

routes.post(
  "/call/update",
  checkUserStatusMiddleware("NA"),
  upload.array('files'),
  controller.activitiesController.updateActivityCall
)

routes.post(
  "/call/create",
  checkUserStatusMiddleware("NA"),
  upload.array('files'),
  controller.activitiesController.createActivityCall
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
routes.get(
  "/export",
  checkUserStatusMiddleware("NA"),
  controller.activitiesController.exportAllActivity
);
export default routes;