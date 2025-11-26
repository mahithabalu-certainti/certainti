import {Router} from 'express'
import controller from '../controllers'
import { checkUserStatusMiddleware } from '../middlewares/authmiddleware'

const routes : Router = Router()

routes.get(
  "/list/:accountId/:caseId",
  checkUserStatusMiddleware("projects_resources_view_edit"),
  controller.projectResourcesController.listProjectResource
);
routes.get(
  "/export/:accountId/:caseId",
  checkUserStatusMiddleware("projects_resources_export"),
  controller.projectResourcesController.exportProjectResource
);
routes.get(
  "/detail/:accountId/:id",
  checkUserStatusMiddleware("projects_resources_view_edit"),
  controller.projectResourcesController.projectResourceDetails
);


export default routes