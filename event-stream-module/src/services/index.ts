import { Logger } from "winston";
import { IAIAssessmentService } from "./interfaces/interface";
import { AIAssessmentService } from "./aiAssessment/aiAssessmentService";

class Services {
  private logger: Logger;
  aiAssessmentService: IAIAssessmentService;
 
  constructor(logger: Logger) {
    this.logger = logger;
    this.aiAssessmentService = new AIAssessmentService(logger);
  }
}

export default Services;
