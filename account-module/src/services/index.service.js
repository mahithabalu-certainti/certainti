const AccountServices = require("./account.service");

class Services {
  constructor() {
    this.accountServices = new AccountServices();
  }
}

module.exports = Services;
