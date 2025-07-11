import { Router } from "express";
import controller from '../controllers';

const routes: Router = Router();

routes.get("/list", controller.projectResourcesController.createProjectResource);
routes.get("/skillroles", controller.projectResourcesController.resourceSkillRoles);
routes.get("/skillSubtype", controller.projectResourcesController.resourceSkillRolesSubtype);
routes.get("/list/:accountId/:id", controller.projectResourcesController.projectResourceDetails);
routes.get("/resourcecodes/:accountId", controller.projectResourcesController.resourceCodes);
routes.post("/new", controller.projectResourcesController.createProjectResource);
routes.put("/update", controller.projectResourcesController.updateProjectResource);

export default routes;
