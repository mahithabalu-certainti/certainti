import { Router } from "express";
import resourceSkillController from "../controllers/resourceSkillController";
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";

const routes: Router = Router();

routes.get("/list", checkUserStatusMiddleware("account_resource_skill_view_edit"), resourceSkillController.resourceSkill);
routes.get("/export", checkUserStatusMiddleware("account_resources_skill_export"), resourceSkillController.exportResourceSkill);
routes.get("/list/:id", checkUserStatusMiddleware("account_resource_skill_view_edit"), resourceSkillController.resourceSkillById);
routes.get("/skilltypes", checkUserStatusMiddleware("NA"), resourceSkillController.getSkillTypes);
routes.get("/skillsubtypes", checkUserStatusMiddleware("NA"), resourceSkillController.getSkillSubTypes);
routes.post("/create", checkUserStatusMiddleware("account_resources_skill_create"), resourceSkillController.createResourceSkill);
routes.put("/update", checkUserStatusMiddleware("account_resource_skill_view_edit"), resourceSkillController.updateResourceSkill);

export default routes;
