import { Logger } from "winston";
import { ReportService } from "./report/reportService";

class Services {
    private logger: Logger;
    reportService: ReportService;

    constructor(logger: Logger) {
        this.logger = logger;
        this.reportService = new ReportService();
    }
}

export default Services;
