import { Router } from 'express';
import controller from "../controllers/index"
import { checkUserStatusMiddleware } from '../middlewares/azureMiddleware';

const routes = Router();

routes.post("/create", checkUserStatusMiddleware("NA"), controller.userGroupController.createUserGroup);
routes.post("/update", checkUserStatusMiddleware("NA"), controller.userGroupController.updateUserGroup);
//lists the group type
routes.get("/groupType", checkUserStatusMiddleware("NA"), controller.userGroupController.getUserGroupType);


//list all the groups
routes.get("/list", checkUserStatusMiddleware("NA"), controller.userGroupController.listUserGroup);
//list all the accounts associated to the group  !applicable only if its a custom type
routes.get("/list/:id", checkUserStatusMiddleware("NA"), controller.userGroupController.listAccountGroupById);
//list all the users associated to the group
routes.get("/listUsers/:groupId", checkUserStatusMiddleware("NA"), controller.userGroupController.listUserGroupById);
//assigns users to group
routes.post("/assign-users-to-group", checkUserStatusMiddleware("NA"), controller.userGroupController.assignUsersToGroup);
//assigns accounts to group  !applicable only if its a custom type
routes.post("/assign-accounts-to-group", checkUserStatusMiddleware("NA"), controller.userGroupController.assignAccountsToGroup);
//exports all group
routes.get("/export", checkUserStatusMiddleware("NA"), controller.userGroupController.exportUserGroup);






routes.get("/listUsers", checkUserStatusMiddleware("NA"), controller.userGroupController.getActiveUsersForGrouping);



//user group access
routes.get("/account/:accountid/users", checkUserStatusMiddleware("NA"), controller.userGroupController.getAccountUsers);
routes.get("/account/:accountid/groups", checkUserStatusMiddleware("NA"), controller.userGroupController.getAccountGroups);

routes.get("/project/users", checkUserStatusMiddleware("NA"), controller.userGroupController.getProjectUsers);

routes.post("/assign-access-to-account", checkUserStatusMiddleware("NA"), controller.userGroupController.assignEntityAccessToAccount);
routes.post("/assign-access-to-project", checkUserStatusMiddleware("NA"), controller.userGroupController.assignEntityAccessToProject);

export default routes;

