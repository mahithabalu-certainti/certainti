import { Router } from "express";
import controller from "../controllers";
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";

const routes: Router = Router();

routes.post("/list/summaryExportMilestone", checkUserStatusMiddleware("cases_workbreakdown_export"), controller.taskController.exportAllTaskSummary);
routes.post("/list/summaryExportActivity", checkUserStatusMiddleware("activity_task_view_edit"), controller.taskController.exportAllTaskSummary);
routes.post("/list/summaryMilestone", checkUserStatusMiddleware("cases_workbreakdown_view_edit"), controller.taskController.getAllTaskSummary);
routes.post("/list/summaryActivity", checkUserStatusMiddleware("activity_task_view_edit"), controller.taskController.getAllTaskSummary);
// routes.get("/list/details", checkUserStatusMiddleware("NA"), controller.taskController.fetchTaskDetailsById);

export default routes;
