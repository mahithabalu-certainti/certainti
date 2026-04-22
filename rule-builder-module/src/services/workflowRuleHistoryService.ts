import { RuleHistory } from "../models/workflowRuleHistory";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize } from "sequelize";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import { Logger } from "winston";
import { logMessage } from "../utils/helpers";

export class RuleHistoryService {

    private logger: Logger;
    private mainDbSequelize: Sequelize | null = null;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    private async getMainDb() {
        if (!this.mainDbSequelize) {
            this.mainDbSequelize = await initSequelize();
        }
        return this.mainDbSequelize;
    }

    async createHistory(request: any, userId: string): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { history: any };
    }> {
        const mainDb = await this.getMainDb();
        RuleHistory.initialize(mainDb);
        const history = await RuleHistory.create({
            rule_rid: request.rule_rid,
            attribute_name: request.attribute_name,
            old_value: request.old_value,
            new_value: request.new_value,
            notes: request.notes,
            action: request.action,
            created_by: request.created_by,
        });

        return {
            statusCode: HttpStatus.SUCCESS,
            message: STATUS_MESSAGE.auditCreated,
            data: {
                history: history,
            },
        };
    };

}
