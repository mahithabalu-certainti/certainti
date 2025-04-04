import UserServices from './userService';

class Services {
  userServices: UserServices;

  constructor() {
    this.userServices = new UserServices();
  }
}

export default Services;
