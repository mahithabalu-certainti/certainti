import {Router} from 'express'
import controller from '../controllers'
import { checkUserStatusMiddleware } from '../middlewares/authmiddleware'

const routes : Router = Router()

routes.get(
  "/list",
  checkUserStatusMiddleware("NA"),
  controller.projectTaskController.getProjectTasks
);
routes.get(
  "/list/export",
  checkUserStatusMiddleware("NA"),
  controller.projectTaskController.exportAllProjectTasks
);
routes.get(
  "/detail",
  checkUserStatusMiddleware("NA"),
  controller.projectTaskController.getProjectTaskById
);


export default routes