import UserServices from './userService';
import UserManagementService from './userManagementService';
import UserGroupService from './userGroupService';
import SettingsService from './settingsService';

class Services {
  userServices: UserServices;
  userManagementServices: UserManagementService;
  userGroupService:UserGroupService;
  settingsService: SettingsService;;

  constructor() {
    this.userServices = new UserServices();
    this.userManagementServices = new UserManagementService();
    this.userGroupService = new UserGroupService();
    this.settingsService = new SettingsService();
  }
}

export default Services;
