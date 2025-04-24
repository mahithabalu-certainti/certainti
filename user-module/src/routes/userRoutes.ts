import { Router } from 'express';
import controller from "../controllers/index"
import { checkUserStatusMiddleware } from '../middlewares/auzureMiddleware';

const routes = Router();

routes.get("/list", checkUserStatusMiddleware, controller.userController.listUsers);
routes.get("/export", checkUserStatusMiddleware, controller.userController.exportUsers);
routes.get("/roles", checkUserStatusMiddleware, controller.userManagementController.userRoles);
routes.get("/profiles", checkUserStatusMiddleware, controller.userManagementController.userProfiles);
routes.get("/:id", checkUserStatusMiddleware, controller.userController.listUserById);
routes.get("/list/:id", checkUserStatusMiddleware, controller.userController.listUserById);
routes.get("/:id/permission", controller.userManagementController.userPermissionById);
routes.post("/create", checkUserStatusMiddleware, controller.userController.createUser);
routes.put("/update", checkUserStatusMiddleware, controller.userController.updateUser);

export default routes;
