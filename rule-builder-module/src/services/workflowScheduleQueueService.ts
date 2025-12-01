import { RuleScheduleQueue, RuleScheduleQueueCreationAttributes } from "../models/workflowRuleScheduleQueue";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize, Op } from "sequelize";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import { Logger } from "winston";
import { ICreateSchedule } from "../utils/types";
import { logMessage } from "../utils/helpers";

export class ScheduleService {

    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    /** CREATE a new Schedule */
    async createSchedule(scheduleRequest: ICreateSchedule, userId: string): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { schedule: any };
    }> {
        //const sequelize = await initSequelize();
        const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
            dialect: "postgres",
            logging: false, // optional
        });
        RuleScheduleQueue.initialize(sequelize);
        const schedule = await RuleScheduleQueue.create({
            rule_rid: scheduleRequest.rule_rid,
            related_task_rid: scheduleRequest.related_task_rid,
            scheduled_datetime: scheduleRequest.scheduled_datetime,
            executed_datetime: scheduleRequest.executed_datetime,
            executed: scheduleRequest.executed ?? true,
            created_by: scheduleRequest.created_by,
            modified_by: scheduleRequest.modified_by ?? scheduleRequest.created_by, // fallback to created_by if undefined
        });

        return {
            statusCode: HttpStatus.SUCCESS,
            message: STATUS_MESSAGE.scheduleCreated,
            data: {
                schedule: schedule,
            },
        };
    };

    /** GET all RuleMasters */
    async listSchedules(
        data: any,
        filters: Record<string, any>,
        userId: string,
        apiType: string): Promise<{
            statusCode: number;
            message: string;
            errorMessage?: string;
            data?: { schedules: any; count: number };
        }> {
        const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
            dialect: "postgres",
            logging: false, // optional
        });
        RuleScheduleQueue.initialize(sequelize);
        const limit = data.limit;
        const offset = (data.page - 1) * limit;

        const where: any = {};

        if (filters && Object.keys(filters).length > 0) {
            for (const key in filters) {
                if (filters[key] !== undefined && filters[key] !== null) {
                    // You can also add LIKE support here if needed
                    where[key] = filters[key];
                }
            }
        }

        const { rows, count } = await RuleScheduleQueue.findAndCountAll({
            where,
            order: [[data.sortBy, data.sortOrder]],
            limit,
            offset
        });

        return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
                schedules: rows,
                count: count,
            },
        };
    };

    /** GET RuleMaster by RID */
    // export const getRuleScheduleById = async (rid: string) => {
    //     const queue = await RuleScheduleQueue.findByPk(rid);
    //     return queue;
    // };

    // export const getRuleScheduleByRule = async (rule_rid: string) => {
    //     const queue = await RuleScheduleQueue.findByPk(rule_rid);
    //     return queue;
    // };

    // export const markScheduleExecuted = async (rule_rid: string) => {
    //     const queue = await RuleScheduleQueue.findByPk(rule_rid);
    //     return queue;
    // };

    /** UPDATE RuleMaster by RID */
    async updateSchedule(
        scopeRequest: ICreateSchedule,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { schedule: any };
    }> {
        // Build update object dynamically
        const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
            dialect: "postgres",
            logging: false, // optional
        });
        const dbInit = RuleScheduleQueue.initialize(sequelize);
        const caseUpdateResponse = await RuleScheduleQueue.update(
            {
                ...scopeRequest,
                modified_by: "userId",
                modified_datetime: new Date(),
            },
            {
                where: { rid: scopeRequest.schedule_rid },
            }
        );

        return {
            statusCode: HttpStatus.SUCCESS,
            message: STATUS_MESSAGE.scheduleUpdated,
            data: {
                schedule: {},
            },
        };
    };


    /** DELETE RuleMaster by RID */
    async deleteSchedule(data: any, userId: string) {
        try {
            const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
                dialect: "postgres",
                logging: false, // optional
            });
            RuleScheduleQueue.initialize(sequelize);
            await RuleScheduleQueue.destroy({ where: { rid: data.schedule_rid } });
            return {
                statusCode: HttpStatus.SUCCESS,
                message: STATUS_MESSAGE.scheduleDeleteSuccess,
            };
        } catch (err) {
            console.log(`Error deleting, ${err}`)
            return {
                statusCode: HttpStatus.FAILED,
                message: STATUS_MESSAGE.scheduleDeleteFailed,
            };
        }
    };

}