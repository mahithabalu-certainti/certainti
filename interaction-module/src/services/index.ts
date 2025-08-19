import { Logger } from "winston";
import { IInteractionService, IOtpServices } from "./interfaces/interface";
import { InteractionService } from "./interactions/interactionService";
import { OtpService } from "./otp/otpService";
class Services {
  private logger: Logger;

  interactionService: IInteractionService;
  otpService: IOtpServices;

  constructor(logger: Logger) {
    this.logger = logger;
    this.interactionService = new InteractionService(logger);
    this.otpService = new OtpService(logger);
  }
}

export default Services;
