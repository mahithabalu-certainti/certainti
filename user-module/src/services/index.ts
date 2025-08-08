import UserServices from './userService';
import UserManagementService from './userManagementService';
import UserGroupService from './userGroupService';

class Services {
  userServices: UserServices;
  userManagementServices: UserManagementService;
  userGroupService:UserGroupService;

  constructor() {
    this.userServices = new UserServices();
    this.userManagementServices = new UserManagementService();
    this.userGroupService = new UserGroupService();
  }
}

export default Services;
