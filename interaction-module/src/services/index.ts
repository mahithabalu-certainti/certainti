import { Logger } from "winston";
import { IInteractionService, IWebHookService } from "./interfaces/interface";
import { InteractionService } from "./interactions/interactionService";
import { WebHookService } from "./webhook/webhookService";
class Services {
  private logger: Logger;
  interactionService: IInteractionService;
  webhookService: IWebHookService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.interactionService = new InteractionService(logger);
    this.webhookService = new WebHookService(logger);
  }
}

export default Services;
