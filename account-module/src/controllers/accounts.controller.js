const response = require("../utils/apiResponse");
const constant = require("../utils/constant");
const Configurations = require("../config/config");

const logger = Configurations.getInstance().getLogger();
const services = Configurations.getInstance().getServices();
const accountServices = services.accountServices;

/**
 * @async
 * @function accounts
 * @description Handles the retrieval of account information.
 *
 * @param {Request} req - Express Request object.
 * @param {Response} res - Express Response object.
 * @returns {Promise<void>} - Sends a JSON response with account data on success,
 * or an error message on failure.
 */
async function accounts(req, res) {
  const methodName = "account";
  try {
    const accounts = await accountServices.accountsById(2);

    if (accounts.statusCode === constant.SUCCESS) {
      logger.info("Success log: ", {
        timestamp: new Date().toISOString(),
        method: methodName,
      });

      response.successResponse(
        res,
        constant.SUCCESS,
        constant.SUCCESS_MESSAGE,
        accounts.data
      );
    } else {
      logger.info("Failed log: ", {
        timestamp: new Date().toISOString(),
        method: methodName,
      });
      response.errorResponse(
        res,
        constant.BAD_REQUEST,
        constant.BAD_REQUEST_MESSAGE,
        accounts.message
      );
    }
  } catch (err) {
    const error = err;
    logger.info("Failed log: ", {
      timestamp: new Date().toString(),
      method: "accounts",
      message: error.message,
    });

    response.errorResponse(
      res,
      constant.FAILED,
      constant.FAILED_MESSAGE,
      error.message
    );
  }
}

module.exports = {
  accounts,
};
