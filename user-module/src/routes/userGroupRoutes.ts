import { Router } from "express";
import controller from "../controllers/index";
import { checkUserStatusMiddleware } from "../middlewares/azureMiddleware";

const routes = Router();

routes.post(
  "/create",
  checkUserStatusMiddleware("user_group_create"),
  controller.userGroupController.createUserGroup
);
routes.post(
  "/update",
  checkUserStatusMiddleware("user_group_view_edit"),
  controller.userGroupController.updateUserGroup
);
//lists the group type
routes.get(
  "/groupType",
  checkUserStatusMiddleware("NA"),
  controller.userGroupController.getUserGroupType
);

//list all the groups
routes.get(
  "/list",
  checkUserStatusMiddleware("user_group_view_edit"),
  controller.userGroupController.listUserGroup
);
//list all the accounts associated to the group  !applicable only if its a custom type
routes.get(
  "/list/:groupId",
  checkUserStatusMiddleware("user_group_view_edit"),
  controller.userGroupController.listGroupDetailsById
);
//exports all group
routes.get(
  "/export",
  checkUserStatusMiddleware("user_group_export"),
  controller.userGroupController.exportUserGroup
);
routes.post(
  "/listUsers",
  checkUserStatusMiddleware("NA"),
  controller.userGroupController.getActiveUsersForGrouping
);
//user group access
routes.get(
  "/account/:accountid/users",
  checkUserStatusMiddleware("NA"),
  controller.userGroupController.getAccountUsers
);
routes.get(
  "/account/:accountid/groups",
  checkUserStatusMiddleware("NA"),
  controller.userGroupController.getAccountGroups
);
routes.get(
  "/users/:accountid/:userGroupId",
  checkUserStatusMiddleware("NA"),
  controller.userGroupController.listUserGroupUser
);
routes.get(
  "/project/users",
  checkUserStatusMiddleware("NA"),
  controller.userGroupController.getProjectUsers
);
routes.post(
  "/projects-of-accounts",
  checkUserStatusMiddleware("NA"),
  controller.userGroupController.getProjectOfAccounts
);
routes.post(
  "/assign-access-to-account",
  checkUserStatusMiddleware("manage_account_access_view_edit"),
  controller.userGroupController.assignEntityAccessToAccount
);
routes.post(
  "/assign-access-to-project",
  checkUserStatusMiddleware("manage_account_access_view_edit"),
  controller.userGroupController.assignEntityAccessToProject
);

export default routes;
