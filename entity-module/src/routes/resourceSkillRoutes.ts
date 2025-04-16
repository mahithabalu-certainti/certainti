import { Router } from "express";
import resourceSkillController from "../controllers/resourceSkillController";

const routes: Router = Router();

routes.get("/", resourceSkillController.resourceSkill);
routes.post("/create", resourceSkillController.createResourceSkill);
routes.put("/update", resourceSkillController.updateResourceSkill);

export default routes;
