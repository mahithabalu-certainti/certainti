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
  listUserGroupUser
} from "./userGroupController";
import { listSettings, updateSettings } from "./settingsController";

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
    listUserGroupUser
  },
  settingsController:{
    updateSettings,
    listSettings
  }
};

export default controller;
