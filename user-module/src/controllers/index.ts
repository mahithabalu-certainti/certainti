import {
  createUser,
  listUsers,
  exportUsers,
  updateUser,
  listUserById,
} from "./userController";
import { userProfiles, userPermissionById, userRoles, userPermissionFields, createProfile, getProfilePermissions, updateProfilePermissions, editProfilePermissions,exportUserProfiles,getUserExtendedPermissions,updateUserExtendedPermissions } from "./userManagementController";

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
};

export default controller;
