import { Logger } from "winston";
import { IInteractionService, IInteractionChildService, IWebHookService } from "./interfaces/interface";
import { InteractionService } from "./interactions/interactionService";
import { InteractionChildService } from "./interactions/interactionChildService";
import { WebHookService } from "./webhook/webhookService";
class Services {
  private logger: Logger;
  interactionService: IInteractionService;
  interactionChildService: IInteractionChildService;
  webhookService: IWebHookService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.interactionService = new InteractionService(logger);
    this.interactionChildService = new InteractionChildService(logger);
    this.webhookService = new WebHookService(logger);
  }
}

export default Services;
