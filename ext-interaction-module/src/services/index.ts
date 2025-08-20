import { Logger } from "winston";
import { IOtpServices , IInteractionService } from "./interfaces/interface";
import { OtpService } from "./otp/otpService";
import { InteractionService } from "./interactions/interactionService";
class Services {
  private logger: Logger;
  otpService: IOtpServices;
  interactionService: IInteractionService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.otpService = new OtpService(logger);
    this.interactionService = new InteractionService(logger);
  }
}

export default Services;
