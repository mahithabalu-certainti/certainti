import { Request, Response } from "express";
import configurations from "../config/config";
import { errorResponse } from "../utils/apiResponse";
import { HttpStatus } from "../utils/constant";
import {
  errorLog,
  handleErrorResponse,
  handleSuccessResponse,
  successLog,
} from "../utils/helpers";

const services = configurations.getInstance().getServices();

/**
 * Handles the request to fetch a list of countries from the geoDataService.
 *
 * @param {Request} req The request object containing details of the HTTP request.
 * @param {Response} res The response object to send the HTTP response.
 * @returns {Promise<void>} A promise that resolves when the request is processed.
 *
 * This method calls the `countries` service, checks the status, and sends an appropriate response:
 * - If successful, it sends a success response with the list of countries.
 * - If failed, it logs the error and sends an error response.
 */
async function country(req: Request, res: Response): Promise<void> {
  const methodName = "country";
  try {
    const countries = await services.geoDataServices.countries();
    if (countries.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, countries.data);
      return;
    } else {
      errorLog(methodName, countries.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        countries.message
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
    return;
  }
}

/**
 * Handles the request to fetch a list of currencies from the geoDataService.
 * 
 * @param {Request} req The request object containing details of the HTTP request.
 * @param {Response} res The response object to send the HTTP response.
 * @returns {Promise<void>} A promise that resolves when the request is processed.
 * 
 * This method calls the `currencies` service, checks the status, and sends an appropriate response:
 * - If successful, it sends a success response with the list of currencies.
 * - If failed, it logs the error and sends an error response.
 */
async function currency(req: Request, res: Response): Promise<void> {
  const methodName = "currency";
  try {
    const currencies = await services.geoDataServices.currencies();
    if (currencies.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, currencies.data);
      return;
    } else {
      errorLog(methodName, currencies.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        currencies.message
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
    return;
  }
}

/**
 * Handles the request to fetch a list of regions from the geoDataService.
 * 
 * @param {Request} req The request object containing details of the HTTP request.
 * @param {Response} res The response object to send the HTTP response.
 * @returns {Promise<void>} A promise that resolves when the request is processed.
 * 
 * This method calls the `regions` service, checks the status, and sends an appropriate response:
 * - If successful, it sends a success response with the list of regions.
 * - If failed, it logs the error and sends an error response.
 */
async function regions(req: Request, res: Response): Promise<void> {
  const methodName = "regions";
  try {
    const regions = await services.geoDataServices.regions();
    if (regions.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, regions.data);
      return;
    } else {
      errorLog(methodName, regions.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        regions.message
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
    return;
  }
}

/**
 * Handles the request to fetch a list of states from the geoDataService.
 * Can filter states by country_rid if provided as a query parameter.
 * 
 * @param {Request} req The request object containing details of the HTTP request.
 * @param {Response} res The response object to send the HTTP response.
 * @returns {Promise<void>} A promise that resolves when the request is processed.
 * 
 * This method calls the `states` service with optional country_rid filter, checks the status, and sends an appropriate response:
 * - If successful, it sends a success response with the filtered list of states.
 * - If failed, it logs the error and sends an error response.
 */
async function states(req: Request, res: Response): Promise<void> {
  const methodName = "states";
  try {
    const { countryId } = req.params;
    const states = await services.geoDataServices.states(countryId);
    
    if (states.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, states.data);
      return;
    } else {
      errorLog(methodName, states.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        states.message
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    errorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
    return;
  }
}

/**
 * Handles the request to fetch a list of cities from the geoDataService.
 * Can filter cities by state_rid if provided as a route parameter.
 * 
 * @param {Request} req The request object containing details of the HTTP request.
 * @param {Response} res The response object to send the HTTP response.
 * @returns {Promise<void>} A promise that resolves when the request is processed.
 * 
 * This method calls the `cities` service with optional state_rid filter, checks the status, and sends an appropriate response:
 * - If successful, it sends a success response with the filtered list of cities.
 * - If failed, it logs the error and sends an error response.
 */
async function cities(req: Request, res: Response): Promise<void> {
  const methodName = "cities";
  try {
    const { stateId } = req.params;
    const cities = await services.geoDataServices.cities(stateId);
    
    if (cities.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, cities.data);
      return;
    } else {
      errorLog(methodName, cities.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        cities.message
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    errorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
    return;
  }
}

/**
 * Handles the request to fetch a list of industries from the geoDataService.
 *
 * @param {Request} req The request object containing details of the HTTP request.
 * @param {Response} res The response object to send the HTTP response.
 * @returns {Promise<void>} A promise that resolves when the request is processed.
 *
 * This method calls the `industries` service, checks the status, and sends an appropriate response:
 * - If successful, it sends a success response with the list of industries.
 * - If failed, it logs the error and sends an error response.
 */
async function industries(req: Request, res: Response): Promise<void> {
  const methodName = "industry";
  try {
    const industries = await services.geoDataServices.industries();
    if (industries.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, industries.data);
      return;
    } else {
      errorLog(methodName, industries.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        industries.message
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
    return;
  }
}

// Update the export to include the cities function
export default {
  country,
  currency,
  regions,
  states,
  cities,
  industries
};
