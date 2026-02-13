import { Request, Response } from "express";
import configurations from "../config/config";
import { errorResponse } from "../utils/apiResponse";
import { HttpStatus } from "../utils/constant";
import {
  errorLog,
  handleErrorResponse,
  handleSuccessResponse,
  successLog,
  validateRequest,
} from "../utils/helpers";
import { colorCodesSchema } from "../lib/joi/schemas/schema";

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
    let { statusScope} = req.query;
    if(!statusScope)
    {
      statusScope = "all";
    }
    const countries = await services.geoDataServices.countries(statusScope as string);
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
    let countryIds: string[] = [];
    const raw = req.query.countryIds;
    if (Array.isArray(raw)) {
      countryIds = raw as string[];
    } else if (typeof raw === "string") {
      if (raw.trim().startsWith("[")) {
        try {
          countryIds = JSON.parse(raw);
        } catch {
          countryIds = [];
        }
      } else {
        countryIds = raw
          .split(",")
          .map((rid) => rid.trim().replace(/^"|"$/g, "")) // ✅ remove quotes
          .filter(Boolean);
      }
    }

    let statusScope = req.query.statusScope;
    if (!statusScope)
    {
      statusScope = "all";
    }
    const states = await services.geoDataServices.states(statusScope as string,countryIds);

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
    let stateIds: string[] = [];
    const raw = req.query.stateIds;
    if (Array.isArray(raw)) {
      stateIds = raw as string[];
    } else if (typeof raw === "string") {
      if (raw.trim().startsWith("[")) {
        try {
          stateIds = JSON.parse(raw);
        } catch {
          stateIds = [];
        }
      } else {
        stateIds = raw
          .split(",")
          .map((rid) => rid.trim().replace(/^"|"$/g, "")) // ✅ remove quotes
          .filter(Boolean);
      }
    }
    const cities = await services.geoDataServices.cities(stateIds);

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

/**
 * Handles HTTP GET requests to fetch color codes filtered by status.
 *
 * @param {Request} req The Express request object containing query parameters.
 * @param {Response} res The Express response object used to send the HTTP response.
 * @returns {Promise<void>} A promise that resolves once the response is sent.
 *
 * This method:
 * - Validates the incoming request against `colorCodesSchema`.
 * - Calls the service layer to fetch color codes by the requested status.
 * - Sends a success response with the color data if validation and service calls succeed.
 * - Logs errors and sends appropriate error responses if validation or service calls fail.
 */
async function colorCodes(req: Request, res: Response): Promise<void> {
  const methodName = "colors";
  try {
    const value = await validateRequest(req, colorCodesSchema, res, "GET");

    if (!value) {
      return;
    }

    const colorCodes = await services.geoDataServices.colorCodes(value.status);
    if (colorCodes.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, colorCodes.data);
      return;
    } else {
      errorLog(methodName, colorCodes.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        colorCodes.message
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
 * Handles HTTP requests to retrieve the list of statuses.
 *
 * @param {Request} req The Express request object.
 * @param {Response} res The Express response object used to send the HTTP response.
 * @returns {Promise<void>} A promise that resolves after sending the response.
 *
 * This method:
 * - Calls the service layer to fetch all statuses.
 * - Sends a success response with the statuses if the service call succeeds.
 * - Logs errors and sends appropriate error responses if the service call fails or an exception occurs.
 */
async function statusList(req: Request, res: Response): Promise<void> {
  const methodName = "statusList";
  try {
    const statuses = await services.geoDataServices.status();
    if (statuses.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, statuses.data);
      return;
    } else {
      errorLog(methodName, statuses.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        statuses.message
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
 * Handles HTTP requests to retrieve the list of resource types.
 *
 * @param {Request} req The Express request object.
 * @param {Response} res The Express response object used to send the HTTP response.
 * @returns {Promise<void>} A promise that resolves after sending the response.
 *
 * This method:
 * - Calls the service layer to fetch all resource types.
 * - Sends a success response with the resource types if the service call succeeds.
 * - Logs errors and sends appropriate error responses if the service call fails or an exception occurs.
 */
async function resourceType(req: Request, res: Response): Promise<void> {
  const methodName = "Resource Type";
  try {
    const resouceTypes = await services.geoDataServices.resourceType();
    if (resouceTypes.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, resouceTypes.data);
      return;
    } else {
      errorLog(methodName, resouceTypes.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        resouceTypes.message
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
 * Handles HTTP requests to retrieve the list of project types.
 *
 * @param {Request} req The Express request object.
 * @param {Response} res The Express response object used to send the HTTP response.
 * @returns {Promise<void>} A promise that resolves after sending the response.
 *
 * This method:
 * - Calls the service layer to fetch all project types.
 * - Sends a success response with the project types if the service call succeeds.
 * - Logs errors and sends appropriate error responses if the service call fails or an exception occurs.
 */
async function projectType(req: Request, res: Response): Promise<void> {
  const methodName = "Project Type";
  try {
    const projectTypes = await services.geoDataServices.projectTypes();
    if (projectTypes.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, projectTypes.data);
      return;
    } else {
      errorLog(methodName, projectTypes.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        projectTypes.message
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
 * Handles HTTP requests to retrieve the list of skill levels.
 *
 * @param {Request} req The Express request object.
 * @param {Response} res The Express response object used to send the HTTP response.
 * @returns {Promise<void>} A promise that resolves after sending the response.
 *
 * This method:
 * - Calls the service layer to fetch all skill levels.
 * - Sends a success response with the skill level data if the service call succeeds.
 * - Logs errors and sends appropriate error responses if the service call fails or an exception occurs.
 */
async function skillLevel(req: Request, res: Response): Promise<void> {
  const methodName = "Skill Level";
  try {
    const skillLevel = await services.geoDataServices.skillLevel();
    if (skillLevel.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, skillLevel.data);
      return;
    } else {
      errorLog(methodName, skillLevel.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        skillLevel.message
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
 * Handles HTTP requests to retrieve the list of resource statuses.
 *
 * @param {Request} req The Express request object.
 * @param {Response} res The Express response object used to send the HTTP response.
 * @returns {Promise<void>} A promise that resolves after sending the response.
 *
 * This method:
 * - Calls the service layer to fetch all resource statuses.
 * - Sends a success response with the resource status data if the service call succeeds.
 * - Logs errors and sends appropriate error responses if the service call fails or an exception occurs.
 */
async function resourceStatus(req: Request, res: Response): Promise<void> {
  const methodName = "Resource Status";
  try {
    const resourceStatus = await services.geoDataServices.resourceStatus();
    if (resourceStatus.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, resourceStatus.data);
      return;
    } else {
      errorLog(methodName, resourceStatus.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        resourceStatus.message
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
 * Handles HTTP requests to fetch import entity types.
 *
 * @param {Request} req The Express request object.
 * @param {Response} res The Express response object used to send the HTTP response.
 * @returns {Promise<void>} A promise that resolves after sending the response.
 *
 * This method:
 * - Calls the service layer to retrieve import entity types.
 * - Sends a success response with the retrieved data if the service call succeeds.
 * - Logs any errors and sends an error response if the service call fails or an exception occurs.
 */
const fetchImportEntityTypes = async (req: Request, res: Response) => {
  const methodName = "fetchImportEntityTypes";
  try {
    const result = await services.geoDataServices.importEntityTypes();
    handleSuccessResponse(res, result);
    return;
  } catch (err: any) {
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
};

// Update the export to include the cities function
export default {
  country,
  currency,
  regions,
  states,
  cities,
  industries,
  colorCodes,
  statusList,
  resourceType,
  projectType,
  skillLevel,
  resourceStatus,
  fetchImportEntityTypes,
};
