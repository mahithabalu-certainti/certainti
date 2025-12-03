import { Router } from "express";
import controller from "../controllers";
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";

const routes: Router = Router();

routes.get("/list/summary/export", checkUserStatusMiddleware("NA"), controller.taskController.exportAllTaskSummary);
routes.get("/list/summary", checkUserStatusMiddleware("NA"), controller.taskController.getAllTaskSummary);
routes.get("/list/details", checkUserStatusMiddleware("NA"), controller.taskController.fetchTaskDetailsById);

export default routes;
