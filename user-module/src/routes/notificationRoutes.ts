import { Router } from 'express';
import controller from "../controllers/index"
import { checkUserStatusMiddleware } from '../middlewares/azureMiddleware';

const routes = Router();

routes.get("/list", checkUserStatusMiddleware("NA"), controller.notificationController.listNotifications);
routes.get("/updateStatus", checkUserStatusMiddleware("NA"), controller.notificationController.updateNotificationStatus);

export default routes;

