import { Router } from "express";
import controller from '../controllers';
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";

const routes: Router = Router();

routes.use(checkUserStatusMiddleware("NA"));

routes.get("/list", controller.projectController.allProjectList);
routes.get("/list/:accountId", controller.projectController.projectList);
routes.get("/list/:accountId/:projectId", controller.projectController.projectById);
routes.post("/new", controller.projectController.createProject);
routes.put("/update", controller.projectController.updateProject);
routes.get("/projectclassification", controller.projectController.projectClassification);
export default routes;
