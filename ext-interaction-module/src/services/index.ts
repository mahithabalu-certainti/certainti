import { Logger } from "winston";
import { IOtpServices } from "./interfaces/interface";
import { OtpService } from "./otp/otpService";

class Services {
  private logger: Logger;
  otpService: IOtpServices;

  constructor(logger: Logger) {
    this.logger = logger;
    this.otpService = new OtpService(logger);
  }
}

export default Services;
