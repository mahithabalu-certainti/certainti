import {Router} from 'express'
import controller from '../controllers'
import { checkUserStatusMiddleware } from '../middlewares/authmiddleware'

const routes : Router = Router()

routes.get(
  "/list/:accountId/:caseId",
  checkUserStatusMiddleware("NA"),
  controller.projectResourcesController.listProjectResource
);
routes.get(
  "/export/:accountId/:caseId",
  checkUserStatusMiddleware("NA"),
  controller.projectResourcesController.exportProjectResource
);
routes.get(
  "/detail/:accountId/:id",
  checkUserStatusMiddleware("NA"),
  controller.projectResourcesController.projectResourceDetails
);


export default routes