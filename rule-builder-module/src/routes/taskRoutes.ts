import { Router } from "express";
import * as TaskController from "../controllers/taskController";

const router = Router();

router.post("/", TaskController.createTask);
router.get("/", TaskController.getAllTasks);
router.get("/:taskId", TaskController.getTaskById);
router.put("/:taskId", TaskController.updateTask);
router.delete("/:taskId", TaskController.deleteTask);

export default router;
