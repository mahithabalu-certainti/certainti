import { Request, Response } from "express";
import configurations from "../config/config";
import { errorResponse, successResponse } from "../utils/apiResponse";
import { HttpStatus } from "../utils/constant";

const logger = configurations.getInstance().getLogger();
const services = configurations.getInstance().getServices();

async function country(req: Request, res: Response): Promise<void> {
  try {
    const countries = await services.geoDataServices.countries();
    if (countries.statusCode === HttpStatus.SUCCESS) {
      logger.info("Success log: ", {
        timestamp: new Date().toISOString(),
        method: "country",
      });

      successResponse(
        res,
        HttpStatus.SUCCESS,
        HttpStatus.SUCCESS_MESSAGE,
        countries.data
      );
    } else {
      logger.error("Failed log: ", {
        timestamp: new Date().toISOString(),
        method: "country",
      });
      errorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        countries.message
      );
    }
  } catch (err) {
    const error = err as Error;
    logger.error("Failed log: ", {
      timestamp: new Date().toString(),
      method: "country",
      message: error.message,
    });

    errorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

async function currency(req: Request, res: Response): Promise<void> {
  try {
    const currencies = await services.geoDataServices.currencies();
    if (currencies.statusCode === HttpStatus.SUCCESS) {
      logger.info("Success log: ", {
        timestamp: new Date().toISOString(),
        method: "currency",
      });

      successResponse(
        res,
        HttpStatus.SUCCESS,
        HttpStatus.SUCCESS_MESSAGE,
        currencies.data
      );
    } else {
      logger.error("Failed log: ", {
        timestamp: new Date().toISOString(),
        method: "currency",
      });
      errorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        currencies.message
      );
    }
  } catch (err) {
    const error = err as Error;
    logger.error("Failed log: ", {
      timestamp: new Date().toString(),
      method: "currency",
      message: error.message,
    });

    errorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

async function regions(req: Request, res: Response): Promise<void> {
  try {
    const regions = await services.geoDataServices.regions();
    if (regions.statusCode === HttpStatus.SUCCESS) {
      logger.info("Success log: ", {
        timestamp: new Date().toISOString(),
        method: "regions",
      });

      successResponse(
        res,
        HttpStatus.SUCCESS,
        HttpStatus.SUCCESS_MESSAGE,
        regions.data
      );
    } else {
      logger.error("Failed log: ", {
        timestamp: new Date().toISOString(),
        method: "regions",
      });
      errorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        regions.message
      );
    }
  } catch (err) {
    const error = err as Error;
    logger.error("Failed log: ", {
      timestamp: new Date().toString(),
      method: "regions",
      message: error.message,
    });

    errorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

async function states(req: Request, res: Response): Promise<void> {
  try {
    const states = await services.geoDataServices.states();
    if (states.statusCode === HttpStatus.SUCCESS) {
      logger.info("Success log: ", {
        timestamp: new Date().toISOString(),
        method: "states",
      });

      successResponse(
        res,
        HttpStatus.SUCCESS,
        HttpStatus.SUCCESS_MESSAGE,
        states.data
      );
    } else {
      logger.error("Failed log: ", {
        timestamp: new Date().toISOString(),
        method: "states",
      });
      errorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        states.message
      );
    }
  } catch (err) {
    const error = err as Error;
    logger.error("Failed log: ", {
      timestamp: new Date().toString(),
      method: "states",
      message: error.message,
    });

    errorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

export default {
  country,
  currency,
  regions,
  states
};
