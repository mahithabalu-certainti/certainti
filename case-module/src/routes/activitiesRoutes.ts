import { Router } from "express";
import controller from "../controllers";

import multer from "multer";
import { checkUserStatusMiddleware } from "../middlewares/authmiddleware";

const routes: Router = Router();
const upload = multer({storage : multer.memoryStorage()})
routes.post(
  "/task/create",
  checkUserStatusMiddleware("activity_task_view_edit"),
  controller.activitiesController.createActivityTask
);

routes.get(
  "/tasks/list",
  checkUserStatusMiddleware("NA"),
  controller.activitiesController.getAllActivityTask
);

routes.post(
  "/email/create",
  checkUserStatusMiddleware("activity_email_view_edit"),
  upload.array('files'),
  controller.activitiesController.createActivityEmail
)

routes.post(
  "/email/update",
  checkUserStatusMiddleware("activity_email_create"),
  upload.array('files'),
  controller.activitiesController.updateActivityEmail
)

routes.post(
  "/meeting/update",
  checkUserStatusMiddleware("activity_meeting_view_edit"),
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
  checkUserStatusMiddleware("activity_call_view_edit"),
  upload.array('files'),
  controller.activitiesController.updateActivityCall
)

routes.post(
  "/call/create",
  checkUserStatusMiddleware("activity_call_view_edit"),
  upload.array('files'),
  controller.activitiesController.createActivityCall
)
routes.post(
  "/email/attachments/delete",
  checkUserStatusMiddleware("activity_email_view_edit"),
  controller.activitiesController.deleteActivityAttachments
)

routes.get(
  "/email/detail/:activityRid/:accountRid",
  checkUserStatusMiddleware("activity_email_view_edit"),
  controller.activitiesController.fetchEmailActivityById
);

routes.get(
  "/meeting/detail/:activityRid/:accountRid",
  checkUserStatusMiddleware("activity_meeting_view_edit"),
  controller.activitiesController.fetchMeetingActivityById
);
routes.get(
  "/call/detail/:activityRid/:accountRid",
  checkUserStatusMiddleware("activity_call_view_edit"),
  controller.activitiesController.fetchCallActivityById
);
routes.get(
  "/export",
  checkUserStatusMiddleware("NA"),
  controller.activitiesController.exportAllActivity
);
export default routes;