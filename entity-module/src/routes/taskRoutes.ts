import { Router } from "express";
import controller from "../controllers";
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";

const routes: Router = Router();

routes.get("/list/summary/export", checkUserStatusMiddleware("notes_view_edit"), controller.taskController.exportAllTaskSummary);
routes.get("/list/summary", checkUserStatusMiddleware("notes_view_edit"), controller.taskController.getAllTaskSummary);
routes.get("/list/details", checkUserStatusMiddleware("notes_view_edit"), controller.taskController.fetchTaskDetailsById)
routes.put("/update", checkUserStatusMiddleware("notes_view_edit"), controller.taskController.updateTask)



export default routes;
