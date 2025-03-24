import {
  createUser,
  listUsers,
  updateUser,
  listUserById,
} from "./userController";
import { userProfiles, userRoles } from "./userManagementController";

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
  },
};

export default controller;
