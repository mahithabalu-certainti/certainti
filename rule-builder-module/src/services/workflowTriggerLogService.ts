import { RuleTriggerLog, RuleTriggerLogCreationAttributes } from "../models/workflowRuleTriggerLog";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize } from "sequelize";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import { Logger } from "winston";
import { ICreateTrigger } from "../utils/types";
import { logMessage } from "../utils/helpers";

export class TriggerService {

    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }


    /** CREATE a new RuleMaster */
    async createTriggerLog(triggerRequest: ICreateTrigger, userId: string): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { trigger: any };
    }> {
        //const sequelize = await initSequelize();
        const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
            dialect: "postgres",
            logging: false, // optional
        });
        RuleTriggerLog.initialize(sequelize);
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

    /** GET all RuleMasters */
    // export const getAllRuleTriggerLogs = async () => {

    // };

    // /** GET RuleMaster by RID */
    // export const getRuleTriggerLogById = async (rid: string) => {
    //     const logDetail = await RuleTriggerLog.findByPk(rid);
    //     return logDetail;
    // };

    // export const getRuleTriggerLogByRule = async (rule_rid: string) => {
    //     const logDetail = await RuleTriggerLog.findByPk(rule_rid);
    //     return logDetail;
    // };

    // /** UPDATE RuleMaster by RID */
    // export const updateRuleTriggerLog = async (
    //     rid: string,
    //     data: Partial<RuleTriggerLogCreationAttributes>
    // ) => {
    // }


    // /** DELETE RuleMaster by RID */
    // export const deleteRuleTriggerLog = async (rid: string) => {
    //     await RuleTriggerLog.destroy({ where: { rid } });
    //     return { message: "TriggerLog deleted successfully" };
    // };

}