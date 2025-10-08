import { Request, Response } from "express";
import { HttpStatus } from "../utils/constants";
import {
  errorLog,
  handleErrorResponse,
  handleSuccessResponse,
  logMessage,
  successLog,
} from "../utils/helpers";
import configurations from "../config/config";

const services = configurations.getInstance().getServices();
const webhookService = services.webhookService;

async function handleWehook(req: Request, res: Response): Promise<void> {
  const methodName = "Create interaction";
  try {
    logMessage(`[${methodName}] Request received: ${JSON.stringify(req.body)} Query: ${JSON.stringify(req.query)} `);
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
