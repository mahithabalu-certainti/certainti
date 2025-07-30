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
  listGroupDetailsById,
  getAccountUsers,
  getProjectUsers,
  getProjectOfAccounts,
  getAccountGroups,
  assignEntityAccessToAccount,
  assignEntityAccessToProject,
  getUserGroupType,
  getUserAccessInfo


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
    listGroupDetailsById,
    getAccountUsers,
    getAccountGroups,
    getProjectUsers,
    getProjectOfAccounts,
    assignEntityAccessToAccount,
    assignEntityAccessToProject,
    getUserGroupType,
    getUserAccessInfo
  }
};

export default controller;
