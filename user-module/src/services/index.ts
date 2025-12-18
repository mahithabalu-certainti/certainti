import UserServices from './userService';
import UserManagementService from './userManagementService';
import UserGroupService from './userGroupService';
import SettingsService from './settingsService';
import NotificationService from './notificationService';

class Services {
  userServices: UserServices;
  userManagementServices: UserManagementService;
  userGroupService:UserGroupService;
  settingsService: SettingsService;
  notificationService: NotificationService;

  constructor() {
    this.userServices = new UserServices();
    this.userManagementServices = new UserManagementService();
    this.userGroupService = new UserGroupService();
    this.settingsService = new SettingsService();
    this.notificationService = new NotificationService();

  }
}

export default Services;
