import { Router } from 'express';
import controller from "../controllers/index"
import { checkUserStatusMiddleware } from '../middlewares/azureMiddleware';

const routes = Router();

routes.post("/create", checkUserStatusMiddleware("NA"), controller.userGroupController.createUserGroup);
routes.post("/update", checkUserStatusMiddleware("NA"), controller.userGroupController.updateUserGroup);
routes.get("/list", checkUserStatusMiddleware("NA"), controller.userGroupController.listUserGroup);
routes.get("/export", checkUserStatusMiddleware("NA"), controller.userGroupController.exportUserGroup);
routes.get("/list/:id", checkUserStatusMiddleware("NA"), controller.userGroupController.listUserGroupById);
routes.get("/listUsers", checkUserStatusMiddleware("NA"), controller.userGroupController.getActiveUsersForGrouping);




//user group access
routes.get("/account/:accountid/users", checkUserStatusMiddleware("NA"), controller.userGroupController.getAccountUsers);
routes.get("/account/:accountid/groups", checkUserStatusMiddleware("NA"), controller.userGroupController.getAccountGroups);
routes.get("/project/users", checkUserStatusMiddleware("NA"), controller.userGroupController.getProjectUsers);
routes.post("/assign-access-to-account", checkUserStatusMiddleware("NA"), controller.userGroupController.assignEntityAccessToAccount);
routes.post("/assign-access-to-project", checkUserStatusMiddleware("NA"), controller.userGroupController.assignEntityAccessToProject);

export default routes;

