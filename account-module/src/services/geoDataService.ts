import { Country } from "../models/countryModel";
import { Currency } from "../models/currencyModel";
import { Region } from "../models/regionModel";
import { States } from "../models/stateModel";
import { HttpStatus } from "../utils/constant";

class GeoDataService {
  async countries(): Promise<{
    statusCode: number;
    message: string;
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
        console.log("err", err)
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
      };
    }
  }

  async currencies(): Promise<{
    statusCode: number;
    message: string;
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
        console.log("err", err)
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
      };
    }
  }

  async regions(): Promise<{
    statusCode: number;
    message: string;
    data?: { regions: any };
  }> {
    try {
      const regions = await Region.findAll();
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          regions
        },
      };
    } catch (err) {
        console.log("err", err)
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
      };
    }
  }

  async states(): Promise<{
    statusCode: number;
    message: string;
    data?: { states: any };
  }> {
    try {
      const states = await States.findAll();
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          states
        },
      };
    } catch (err) {
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
      };
    }
  }
}

export default GeoDataService;