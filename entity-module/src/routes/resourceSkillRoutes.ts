import { Router } from "express";
import resourceSkillController from "../controllers/resourceSkillController";
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";

const routes: Router = Router();

routes.get("/list", checkUserStatusMiddleware, resourceSkillController.resourceSkill);
routes.post("/create", checkUserStatusMiddleware, resourceSkillController.createResourceSkill);
routes.put("/update", checkUserStatusMiddleware, resourceSkillController.updateResourceSkill);

export default routes;
