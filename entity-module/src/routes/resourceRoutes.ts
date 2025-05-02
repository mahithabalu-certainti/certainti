import { Router } from "express";
import controller from '../controllers';
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";

const routes: Router = Router();

routes.get("/list/:accountNumber", checkUserStatusMiddleware, controller.resoucesController.resourcesList);
routes.get("/export/:accountNumber", checkUserStatusMiddleware, controller.resoucesController.exportresourcesList);
routes.get("/list/:accountNumber/:id", checkUserStatusMiddleware, controller.resoucesController.resourcesById);
routes.post("/new", checkUserStatusMiddleware, controller.resoucesController.createResource);
routes.put("/update", checkUserStatusMiddleware, controller.resoucesController.updateResource);

export default routes;