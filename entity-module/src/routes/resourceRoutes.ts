import { Router } from "express";
import controller from '../controllers';

const routes: Router = Router();

routes.get("/list/:accountNumber", controller.resoucesController.resourcesList);
routes.get("/list/:accountNumber/:id", controller.resoucesController.resourcesById);
routes.post("/new", controller.resoucesController.creatResource);
routes.put("/update", controller.resoucesController.updateResource);

export default routes;