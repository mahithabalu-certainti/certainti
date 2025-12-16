import { RuleAudit, RuleAuditCreationAttributes } from "../models/workflowRuleAudit";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize } from "sequelize";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import { Logger } from "winston";
import { ICreateAudit } from "../utils/types";
import { logMessage } from "../utils/helpers";

export class AuditService {

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

    /** CREATE a new Audit */
    async createAudit(auditRequest: ICreateAudit, userId: string): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { audit: any };
    }> {
        const mainDb = await this.getMainDb();
        RuleAudit.initialize(mainDb);
        const audit = await RuleAudit.create({
            rule_rid: auditRequest.rule_rid,
            action: auditRequest.action,
            old_value: auditRequest.old_value,
            new_value: auditRequest.new_value,
            notes: auditRequest.notes,
            created_by: auditRequest.created_by,
            modified_by: auditRequest.modified_by ?? auditRequest.created_by, // fallback to created_by if undefined
        });

        return {
            statusCode: HttpStatus.SUCCESS,
            message: STATUS_MESSAGE.auditCreated,
            data: {
                audit: audit,
            },
        };
    };

}
