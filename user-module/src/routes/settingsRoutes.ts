import { Router } from 'express';
import controller from "../controllers/index"
import { checkUserStatusMiddleware } from '../middlewares/azureMiddleware';

const routes = Router();

routes.get("/list", checkUserStatusMiddleware("NA"), controller.settingsController.listSettings);
routes.post("/update", checkUserStatusMiddleware("NA"), controller.settingsController.updateSettings);

export default routes;

