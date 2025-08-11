import { Logger } from "winston";
import { IInteractionService } from "./interfaces/interface";
import { InteractionService } from "./interactionService";
class Services {
  private logger: Logger;
  interactionService: IInteractionService;
  
  constructor(logger: Logger) {
    this.logger = logger;
    this.interactionService = new InteractionService(logger);
  }
}

export default Services;
