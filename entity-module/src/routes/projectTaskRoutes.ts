import { Router } from "express";
import controller from "../controllers";
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";

const routes: Router = Router();

routes.get("/list", 
    checkUserStatusMiddleware("projects_task_view_edit"),
     controller.projectTaskController.getProjectTasks);
routes.get("/list/export", 
    checkUserStatusMiddleware("projects_task_export"),
     controller.projectTaskController.exportAllProjectTasks);     
routes.get("/detail",
     checkUserStatusMiddleware("projects_task_view_edit"),
      controller.projectTaskController.getProjectTaskById);     

export default routes;

