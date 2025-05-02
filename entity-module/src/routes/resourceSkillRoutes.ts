import { Router } from "express";
import resourceSkillController from "../controllers/resourceSkillController";
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";

const routes: Router = Router();

routes.get("/list", checkUserStatusMiddleware, resourceSkillController.resourceSkill);
routes.get("/export", checkUserStatusMiddleware, resourceSkillController.exportResourceSkill);
routes.get("/list/:id", checkUserStatusMiddleware, resourceSkillController.resourceSkillById);
routes.post("/create", checkUserStatusMiddleware, resourceSkillController.createResourceSkill);
routes.put("/update", checkUserStatusMiddleware, resourceSkillController.updateResourceSkill);

export default routes;
