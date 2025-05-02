import { Router } from "express";
import controller from '../controllers';
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";

const routes: Router = Router();

routes.use(checkUserStatusMiddleware);

routes.get("/list/:accountNumber", controller.projectController.projectList);
routes.get("/list/:accountNumber/:projectId", controller.projectController.projectById);
routes.post("/new", controller.projectController.createProject);
routes.put("/update", controller.projectController.updateProject);

export default routes;
