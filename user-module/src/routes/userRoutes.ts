import { Router } from 'express';
import controller from "../controllers/index"

const routes = Router();

routes.get("/roles", controller.userManagementController.userRoles);
routes.get("/profiles", controller.userManagementController.userProfiles);
routes.get("/", controller.userController.listUsers);
routes.get("/:id", controller.userController.listUserById);
routes.post("/create", controller.userController.createUser);
routes.put("/update", controller.userController.updateUser);

export default routes;
