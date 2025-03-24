import {
  createUser,
  listUsers,
  updateUser,
  userProfiles,
  userRoles,
  listUserById
} from "./userController";

const controller = {
  userController: {
    createUser,
    updateUser,
    userProfiles,
    userRoles,
    listUsers,
    listUserById
  },
};

export default controller;
