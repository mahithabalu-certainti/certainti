import AccountServices from './accountService';

class Services {
  accountServices: AccountServices;

  constructor() {
    this.accountServices = new AccountServices();
  }
}

export default Services;
