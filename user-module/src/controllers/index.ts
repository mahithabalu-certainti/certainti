import {
  createUser,
  listUsers,
  updateUser,
  listUserById,
} from "./userController";
import { userProfiles, userRoleById, userRoles } from "./userManagementController";

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
    userRoleById
  },
};

export default controller;
