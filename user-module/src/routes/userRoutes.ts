import { Router } from 'express';
import controller from "../controllers/index"

const routes = Router();

routes.get("/", controller.userController.listUsers);
routes.get("/:id", controller.userController.listUserById);
routes.get("/roles", controller.userController.userRoles);
routes.get("/profiles", controller.userController.userProfiles);
routes.post("/create", controller.userController.createUser);
routes.put("/update", controller.userController.updateUser);

export default routes;
