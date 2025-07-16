import {
  createUser,
  listUsers,
  exportUsers,
  updateUser,
  listUserById,
} from "./userController";
import { userProfiles, userPermissionById, userRoles, userPermissionFields, createProfile, getProfilePermissions, updateProfilePermissions, editProfilePermissions,exportUserProfiles,getUserExtendedPermissions,updateUserExtendedPermissions } from "./userManagementController";
import {
  createUserGroup,
  updateUserGroup,
  listUserGroup,
  exportUserGroup,
  getActiveUsersForGrouping,
  listUserGroupById,
  listAccountGroupById,
  listGroupDetailsById,
  getAccountUsers,
  getProjectUsers,
  getAccountGroups,
  assignEntityAccessToAccount,
  assignEntityAccessToProject,
  assignUsersToGroup,
  assignAccountsToGroup,
  getUserGroupType


} from "./userGroupController";
import { get } from "http";
const controller = {
  userController: {
    createUser,
    updateUser,
    exportUsers,
    listUsers,
    listUserById,
  },
  userManagementController: {
    userProfiles,
    userRoles,
    userPermissionById,
    userPermissionFields,
    createProfile,
    getProfilePermissions,
    updateProfilePermissions,
    editProfilePermissions,
    exportUserProfiles,
    getUserExtendedPermissions,
    updateUserExtendedPermissions
  },
  userGroupController:{
    createUserGroup,
    updateUserGroup,
    getActiveUsersForGrouping,
    listUserGroup,
    exportUserGroup,
    listUserGroupById,
    listAccountGroupById,
    listGroupDetailsById,
    getAccountUsers,
    getAccountGroups,
    getProjectUsers,
    assignEntityAccessToAccount,
    assignEntityAccessToProject,
    assignUsersToGroup,
    assignAccountsToGroup,
    getUserGroupType
  }
};

export default controller;
