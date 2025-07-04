import { Router } from "express";
import controller from '../controllers';
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";

const routes: Router = Router();

routes.get("/list/:accountNumber", checkUserStatusMiddleware("account_resources_view_edit"), controller.resoucesController.resourcesList);
routes.get("/export/:accountNumber", checkUserStatusMiddleware("account_resources_export"), controller.resoucesController.exportResourcesList);
routes.get("/list/:accountNumber/:id", checkUserStatusMiddleware("account_resources_view_edit"), controller.resoucesController.resourcesById);
routes.post("/new", checkUserStatusMiddleware("account_resources_create"), controller.resoucesController.createResource);
routes.put("/update", checkUserStatusMiddleware("account_resources_view_edit"), controller.resoucesController.updateResource);

export default routes;