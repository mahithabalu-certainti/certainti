import { Router } from 'express';
import controller from "../controllers/index"
import { checkUserStatusMiddleware } from '../middlewares/azureMiddleware';

const routes = Router();

routes.get("/list", checkUserStatusMiddleware("user_view_all"), controller.userController.listUsers);
routes.get("/export", checkUserStatusMiddleware("user_export"), controller.userController.exportUsers);
routes.get("/roles", checkUserStatusMiddleware("NA"), controller.userManagementController.userRoles);
routes.get("/profiles", checkUserStatusMiddleware("profile_view_all"), controller.userManagementController.userProfiles);
routes.get("/:id", checkUserStatusMiddleware("user_view"), controller.userController.listUserById);
routes.get("/list/:id", checkUserStatusMiddleware("user_view"), controller.userController.listUserById);
routes.get("/:id/permission", controller.userManagementController.userPermissionById);
routes.post("/create", checkUserStatusMiddleware("user_create"), controller.userController.createUser);
routes.put("/update", checkUserStatusMiddleware("user_edit_update"), controller.userController.updateUser);
routes.get("/:userId/permission/fields", checkUserStatusMiddleware("NA"), controller.userManagementController.userPermissionFields);
export default routes;
