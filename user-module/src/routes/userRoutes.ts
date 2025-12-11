import { Router } from 'express';
import controller from "../controllers/index"
import { checkUserStatusMiddleware } from '../middlewares/azureMiddleware';
import { upload } from '../middlewares/azureBlobUpload';
import { multerErrorHandler } from '../middlewares/multerErrorHandler';

const routes = Router();

routes.get("/list", checkUserStatusMiddleware("user_view_edit"), controller.userController.listUsers);
routes.get("/export", checkUserStatusMiddleware("user_export"), controller.userController.exportUsers);
routes.get("/roles", checkUserStatusMiddleware("NA"), controller.userManagementController.userRoles);
routes.get("/list/profiles", checkUserStatusMiddleware("NA"), controller.userManagementController.userProfiles);
routes.get("/profiles", checkUserStatusMiddleware("profile_view_edit"), controller.userManagementController.userProfiles);
routes.get("/:id", checkUserStatusMiddleware("user_view_edit"), controller.userController.listUserById);
routes.get("/list/:id", checkUserStatusMiddleware("NA"), controller.userController.listUserById);
routes.get("/:id/permission", controller.userManagementController.userPermissionById);
routes.post("/create", checkUserStatusMiddleware("user_create"), controller.userController.createUser);
routes.put("/update", checkUserStatusMiddleware("user_view_edit"), controller.userController.updateUser);
routes.get("/:userId/permission/fields", checkUserStatusMiddleware("NA"), controller.userManagementController.userPermissionFields);
routes.post("/profile/clone",checkUserStatusMiddleware("profile_create"), controller.userManagementController.createProfile);
routes.get("/profile/:profileId/permissions",checkUserStatusMiddleware("profile_view_edit"), controller.userManagementController.getProfilePermissions);
routes.put("/profile/permissions", checkUserStatusMiddleware("profile_create"), controller.userManagementController.updateProfilePermissions);
routes.put("/profile/permissions/edit", checkUserStatusMiddleware("profile_view_edit"), controller.userManagementController.editProfilePermissions);
routes.get("/:profileId/profile/export", checkUserStatusMiddleware("profile_export"), controller.userManagementController.exportUserProfiles);
routes.get("/:userId/permission/extended",checkUserStatusMiddleware("profile_view_edit"), controller.userManagementController.getUserExtendedPermissions);
routes.put("/permission/extended/edit",checkUserStatusMiddleware("profile_view_edit"), controller.userManagementController.updateUserExtendedPermissions);
routes.post("/profile/upload",checkUserStatusMiddleware("profile_view_edit"), upload.single('profile'), multerErrorHandler, controller.userController.uploadProfileImage);
export default routes;

