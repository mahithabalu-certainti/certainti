import { RuleTriggerLog, RuleTriggerLogCreationAttributes } from "../models/workflowRuleTriggerLog";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize } from "sequelize";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import { Logger } from "winston";
import { ICreateTrigger } from "../utils/types";
import { logMessage } from "../utils/helpers";

export class TriggerService {

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

    /** CREATE a new RuleMaster */
    async createTriggerLog(triggerRequest: ICreateTrigger, userId: string): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { trigger: any };
    }> {
        const mainDb = await this.getMainDb();
        RuleTriggerLog.initialize(mainDb);
        const trigger = await RuleTriggerLog.create({
            rule_rid: triggerRequest.rule_rid,
            event_name: triggerRequest.event_name,
            event_time: triggerRequest.event_time,
            context_entity_id: triggerRequest.context_entity_id,
            status: triggerRequest.status,
            message: triggerRequest.message,
            created_by: triggerRequest.created_by,
            modified_by: triggerRequest.modified_by ?? triggerRequest.created_by, // fallback to created_by if undefined
        });

        return {
            statusCode: HttpStatus.SUCCESS,
            message: STATUS_MESSAGE.triggerLogCreated,
            data: {
                trigger: trigger,
            },
        };
    };
}