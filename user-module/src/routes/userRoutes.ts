import { Router } from 'express';
import controller from "../controllers/index"

const routes = Router();

routes.get("/list", controller.userController.listUsers);
routes.get("/export", controller.userController.exportUsers);
routes.get("/roles", controller.userManagementController.userRoles);
routes.get("/profiles", controller.userManagementController.userProfiles);
routes.get("/:id", controller.userController.listUserById);
routes.get("/list/:id", controller.userController.listUserById);
routes.get("/:id/permission", controller.userManagementController.userPermissionById);
routes.post("/create", controller.userController.createUser);
routes.put("/update", controller.userController.updateUser);

export default routes;
