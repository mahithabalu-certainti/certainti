import { Country } from "../models/countryModel";
import { Currency } from "../models/currencyModel";
import { Region } from "../models/regionModel";
import { States } from "../models/stateModel";
import { HttpStatus } from "../utils/constant";

class GeoDataService {
  /**
   * Fetches a list of countries from the database.
   *
   * @returns {Promise<{ statusCode: number, message: string, errorMessage?: string, data?: { country: any } }>} The response object containing status code, message, and a list of countries.
   * - statusCode: HTTP status code indicating the result of the request.
   * - message: A success or error message based on the outcome of the request.
   * - errorMessage (optional): The error message in case of a failure.
   * - data (optional): An object containing the list of countries if the request is successful.
   */
  async countries(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { country: any };
  }> {
    try {
      const country = await Country.findAll();
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          country,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Fetches a list of currencies from the database.
   *
   * @returns {Promise<{ statusCode: number, message: string, errorMessage?: string, data?: { currency: any } }>} The response object containing status code, message, and a list of currencies.
   * - statusCode: HTTP status code indicating the result of the request.
   * - message: A success or error message based on the outcome of the request.
   * - errorMessage (optional): The error message in case of a failure.
   * - data (optional): An object containing the list of currencies if the request is successful.
   */
  async currencies(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { currency: any };
  }> {
    try {
      const currency = await Currency.findAll();
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          currency,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Fetches a list of regions from the database.
   *
   * @returns {Promise<{ statusCode: number, message: string, errorMessage?: string, data?: { regions: any } }>} The response object containing status code, message, and a list of regions.
   * - statusCode: HTTP status code indicating the result of the request.
   * - message: A success or error message based on the outcome of the request.
   * - errorMessage (optional): The error message in case of a failure.
   * - data (optional): An object containing the list of regions if the request is successful.
   */
  async regions(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { regions: any };
  }> {
    try {
      const regions = await Region.findAll();
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          regions,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Fetches a list of states from the database.
   *
   * @returns {Promise<{ statusCode: number, message: string, errorMessage?: string, data?: { states: any } }>} The response object containing status code, message, and a list of states.
   * - statusCode: HTTP status code indicating the result of the request.
   * - message: A success or error message based on the outcome of the request.
   * - errorMessage (optional): The error message in case of a failure.
   * - data (optional): An object containing the list of states if the request is successful.
   */
  async states(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { states: any };
  }> {
    try {
      const states = await States.findAll();
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          states,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Handles the error thrown during service execution and returns a standardized error response.
   *
   * @param {Error} err The error object that contains details about the failure.
   * @returns {{ statusCode: number, message: string, errorMessage: string }} The error response object.
   * - statusCode: HTTP status code indicating the failure.
   * - message: A message indicating the failure.
   * - errorMessage: The message from the error object.
   */
  private throwServiceError(err: Error): {
    statusCode: number;
    message: string;
    errorMessage: string;
  } {
    return {
      statusCode: HttpStatus.FAILED,
      message: HttpStatus.FAILED_MESSAGE,
      errorMessage: err.message,
    };
  }
}

export default GeoDataService;
