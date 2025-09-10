import { Request, Response } from "express";
import { HttpStatus } from "../utils/constants";
import {
  errorLog,
  handleErrorResponse,
  handleSuccessResponse,
  successLog,
} from "../utils/helpers";
import configurations from "../config/config";

const services = configurations.getInstance().getServices();
const webhookService = services.webhookService;

async function handleWehook(req: Request, res: Response): Promise<void> {
  const methodName = "Create interaction";
  try {
    console.log(`[${methodName}] Request received`, JSON.stringify(req.body));

    console.log("request", req.query);
    if (req.query && req.query.validationToken) {
      res.status(200).send(req.query.validationToken);
      return;
    }

    res.status(200).send({
      message: "Success"
    });

    const interaction = await webhookService.webhookHanlder(
      req.body,
    );

    console.log(
      `[${methodName}] Service response:`,
      JSON.stringify(interaction)
    );
    if (interaction.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      // handleSuccessResponse(res, interaction.data);
      return;
    } else {
      errorLog(methodName, interaction.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interaction.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

export default {
  handleWehook,
};
