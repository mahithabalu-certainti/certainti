const AccountServices = require("./accountService");

class Services {
  constructor() {
    this.accountServices = new AccountServices();
  }
}

module.exports = Services;
