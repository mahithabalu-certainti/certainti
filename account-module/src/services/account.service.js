const Account = require("../models/account.model");
const constant = require("../utils/constant");

class AccountService {
  constructor() {
    this.accountRepository = null;
  }

  /**
   * Retrieves the Account model instance.
   * If the repository has not been initialized, it creates a new instance
   * using the database configuration.
   *
   * @returns {Account} - The model for Account entities.
   */
  getAccountRepository() {
    if (!this.accountRepository) {
      this.accountRepository = Account;
    }
    return this.accountRepository;
  }

  /**
   * Retrieves an account by its ID.
   *
   * @async
   * @param {number} rid - The ID of the account to retrieve.
   * @returns {Promise<Object>} - An object containing the status code, message, and retrieved account data.
   */
  async accountsById(rid) {
    try {
      const repository = this.getAccountRepository();

      const account = await repository.findOne({
        where: {
          rid,
        },
      });

      return {
        statusCode: constant.SUCCESS,
        message: constant.SUCCESS_MESSAGE,
        data: {
          account,
        },
      };
    } catch (err) {
      return {
        statusCode: constant.FAILED,
        message: constant.FAILED_MESSAGE,
      };
    }
  }
}

module.exports = AccountService;
