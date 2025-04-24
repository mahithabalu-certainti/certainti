import { Router } from "express";
import controller from '../controllers';
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";

const routes: Router = Router();

routes.get("/list/:accountNumber", checkUserStatusMiddleware, controller.resoucesController.resourcesList);
routes.get("/list/:accountNumber/:id", checkUserStatusMiddleware, controller.resoucesController.resourcesById);
routes.post("/new", checkUserStatusMiddleware, controller.resoucesController.creatResource);
routes.put("/update", checkUserStatusMiddleware, controller.resoucesController.updateResource);

export default routes;