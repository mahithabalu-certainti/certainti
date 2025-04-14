import { Country } from "../models/countryModel";
import { Currency } from "../models/currencyModel";
import { Region } from "../models/regionModel";
import { States } from "../models/stateModel";
import { HttpStatus } from "../utils/constant";
import { models } from "../models";

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
    data?: { country: any; count: number };
  }> {
    try {
      const country = await Country.findAll();
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          country,
          count: country.length,
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
    data?: { currency: any; count: number };
  }> {
    try {
      const currency = await Currency.findAll();
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          currency,
          count: currency.length,
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
    data?: { regions: any; count: number };
  }> {
    try {
      const regions = await Region.findAll();
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          regions,
          count: regions.length,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Fetches a list of states from the database.
   * If country_rid is provided, filters states by that country.
   *
   * @param {string} countryId - Optional country ID to filter states
   * @returns {Promise<{ statusCode: number, message: string, errorMessage?: string, data?: { states: any } }>} The response object containing status code, message, and a list of states.
   * - statusCode: HTTP status code indicating the result of the request.
   * - message: A success or error message based on the outcome of the request.
   * - errorMessage (optional): The error message in case of a failure.
   * - data (optional): An object containing the list of states if the request is successful.
   */
  async states(countryId?: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { states: any; count: number };
  }> {
    try {
      let states;
      
      if (countryId) {
        states = await States.findAll({
          where: {
            country_rid: countryId
          },
          include: [
            {
              model: Country,
              as: "country",
              attributes: ["country_name"]
            }
          ]
        });
      } else {
        states = await States.findAll({
          include: [
            {
              model: Country,
              as: "country",
              attributes: ["country_name"]
            }
          ]
        });
      }
      
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          states,
          count: states.length,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Fetches a list of cities from the database.
   * If stateId is provided, filters cities by that state.
   *
   * @param {string} stateId - Optional state ID to filter cities
   * @returns {Promise<{ statusCode: number, message: string, errorMessage?: string, data?: { cities: any } }>} The response object containing status code, message, and a list of cities.
   * - statusCode: HTTP status code indicating the result of the request.
   * - message: A success or error message based on the outcome of the request.
   * - errorMessage (optional): The error message in case of a failure.
   * - data (optional): An object containing the list of cities if the request is successful.
   */
  async cities(stateId?: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { cities: any; count: number };
  }> {
    try {
      let cities;
      
      if (stateId) {
        cities = await models.City.findAll({
          where: {
            state_rid: stateId
          },
          include: [
            {
              model: States,
              as: "state",
              attributes: ["state_name"]
            },
            {
              model: Country,
              as: "country",
              attributes: ["country_name"]
            }
          ]
        });
      } else {
        cities = await models.City.findAll({
          include: [
            {
              model: States,
              as: "state",
              attributes: ["state_name"]
            },
            {
              model: Country,
              as: "country",
              attributes: ["country_name"]
            }
          ]
        });
      }
      
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          cities,
          count: cities.length,
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
