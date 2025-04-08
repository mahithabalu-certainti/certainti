import {
  createUser,
  listUsers,
  updateUser,
  listUserById,
} from "./userController";
import { userProfiles, userPermissionById, userRoles } from "./userManagementController";

const controller = {
  userController: {
    createUser,
    updateUser,

    listUsers,
    listUserById,
  },
  userManagementController: {
    userProfiles,
    userRoles,
    userPermissionById
  },
};

export default controller;
