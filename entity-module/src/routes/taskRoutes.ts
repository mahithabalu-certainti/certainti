import { Router } from "express";
import controller from "../controllers";
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";

const routes: Router = Router();

routes.get("/list/summary/exportMilestone", checkUserStatusMiddleware("cases_workbreakdown_export"), controller.taskController.exportAllTaskSummary);
routes.get("/list/summary/exportActivity", checkUserStatusMiddleware("activity_task_export"), controller.taskController.exportAllTaskSummary);
routes.get("/list/summaryMilestone", checkUserStatusMiddleware("cases_workbreakdown_view_edit"), controller.taskController.getAllTaskSummary);
routes.get("/list/summaryActivity", checkUserStatusMiddleware("activity_task_view_edit"), controller.taskController.getAllTaskSummary);
// routes.get("/list/details", checkUserStatusMiddleware("NA"), controller.taskController.fetchTaskDetailsById);

export default routes;
