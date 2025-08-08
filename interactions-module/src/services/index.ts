import { Logger } from "winston";

class Services {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }
}

export default Services;
