import { Router } from "express";
import resourceSkillController from "../controllers/resourceSkillController";
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";

const routes: Router = Router();

routes.get("/list", checkUserStatusMiddleware("account_resources_resource_skill_view"), resourceSkillController.resourceSkill);
routes.get("/export", checkUserStatusMiddleware("NA"), resourceSkillController.exportResourceSkill);
routes.get("/list/:id", checkUserStatusMiddleware("account_resources_resource_skill_view"), resourceSkillController.resourceSkillById);
routes.post("/create", checkUserStatusMiddleware("account_resources_skill_create"), resourceSkillController.createResourceSkill);
routes.put("/update", checkUserStatusMiddleware("account_resources_resource_skill_edit_update"), resourceSkillController.updateResourceSkill);

export default routes;
