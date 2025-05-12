import UserServices from './userService';
import UserManagementService from './userManagementService';

class Services {
  userServices: UserServices;
  userManagementServices: UserManagementService;

  constructor() {
    this.userServices = new UserServices();
    this.userManagementServices = new UserManagementService();
  }
}

export default Services;
