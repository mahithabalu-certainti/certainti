import { RuleScopeMap, RuleScopeMapCreationAttributes } from "../models/workflowRuleScopeMap";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize, Op } from "sequelize";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import { Logger } from "winston";
import { ICreateScope } from "../utils/types";
import { logMessage } from "../utils/helpers";
import { RuleHistoryService } from "./workflowRuleHistoryService";


export class ScopeService {

    private logger: Logger;
    private ruleHistoryService: RuleHistoryService;
    private mainDbSequelize: Sequelize | null = null;

    constructor(logger: Logger) {
        this.logger = logger;
        this.ruleHistoryService = new RuleHistoryService(this.logger);
    }

    private async getMainDb() {
        if (!this.mainDbSequelize) {
            this.mainDbSequelize = await initSequelize();
        }
        return this.mainDbSequelize;
    }

    /** CREATE a new scope */
    async createScope(scopeRequest: ICreateScope, userId: string): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { scope: any };
    }> {
        const mainDb = await this.getMainDb();
        RuleScopeMap.initialize(mainDb);
        const scope = await RuleScopeMap.create({
            rule_rid: scopeRequest.rule_rid,
            scope_entity_type: scopeRequest.scope_entity_type ?? null,
            scope_entity_rid: scopeRequest.scope_entity_rid,
            is_active: scopeRequest.is_active ?? true,
            created_by: scopeRequest.created_by,
            modified_by: scopeRequest.modified_by ?? scopeRequest.created_by,
        });

        return {
            statusCode: HttpStatus.SUCCESS,
            message: STATUS_MESSAGE.scopeCreated,
            data: {
                scope: scope,
            },
        };
    };

    /** GET all RuleMasters */
    async getScopeMapsByRuleRid(
        rule_rid: string,
        userId: string): Promise<any[]> {
        const mainDb = await this.getMainDb();
        RuleScopeMap.initialize(mainDb);
        const scopemaps = await RuleScopeMap.findAll({
            where: {
                rule_rid: rule_rid,
            },
            order: [['created_datetime', 'ASC']], // IMPORTANT for index-based updates
        });
        return scopemaps;
    };

    /** UPDATE RuleMaster by RID */
    async updateScope(scopeRequest: any,
        userId: string): Promise<{
            statusCode: number;
            message: string;
            errorMessage?: string;
            data?: { scope: any };
        }> {
        // Build update object dynamically
        const mainDb = await this.getMainDb();
        const dbInit = RuleScopeMap.initialize(mainDb);

        const oldRuleMap = await RuleScopeMap.findOne({ where: { rid: scopeRequest.rid } });
        if (!oldRuleMap) {
            return {
                statusCode: HttpStatus.NOT_FOUND,
                message: "",
            };
        }

        const oldRuleData = oldRuleMap.toJSON(); const historyRecords = [];
        const fieldsToUpdate = [
            { field: 'scope_entity_rid', oldValue: oldRuleData.scope_entity_rid, newValue: scopeRequest.scope_entity_rid }
        ];
        for (const { field, oldValue, newValue } of fieldsToUpdate) {
            if (oldValue !== newValue) {
                try {
                    historyRecords.push({
                        rule_rid: oldRuleData.rule_rid,
                        attribute_name: field,
                        old_value: oldValue,
                        new_value: newValue,
                        created_by: scopeRequest.modified_by,
                        action: 'ruleMapScopeUpdate'
                    });
                } catch (err) {
                    console.log(err);
                }
            }
        }
        for (const history of historyRecords) {
            await this.ruleHistoryService.createHistory(history, userId);
        }
        const newRuleMap = await oldRuleMap.update({
            scope_entity_rid: scopeRequest.scope_entity_rid,
            modified_by: scopeRequest.modified_by,
            modified_datetime: new Date(),
        });

        // const caseUpdateResponse = await RuleScopeMap.update(
        //     {
        //         ...scopeRequest,
        //         modified_by: "userId",
        //         modified_datetime: new Date(),
        //     },
        //     {
        //         where: { rid: scopeRequest.rid, rule_rid: scopeRequest.rule_rid },
        //     }
        // );

        return {
            statusCode: HttpStatus.SUCCESS,
            message: STATUS_MESSAGE.scopeUpdated,
            data: {
                scope: {},
            },
        };
    };


    /** DELETE RuleMaster by RID */
    async deleteScope(data: any, userId: string) {
        try {
            const mainDb = await this.getMainDb();
            RuleScopeMap.initialize(mainDb);
            //console.log(data.apply_type + "   " + data.rid + "   " + data.rule_rid);
            if (data.apply_type === "ALL") {
                await RuleScopeMap.destroy({ where: { rule_rid: data.rule_rid } });
            } else {
                await RuleScopeMap.destroy({ where: { rule_rid: data.rule_rid, rid: data.rid } });
                await this.ruleHistoryService.createHistory({
                rule_rid: data.rule_rid,
                attribute_name: "entity_rid",
                old_value: data.rid,
                new_value: null,
                created_by: userId,
                action: 'scopeMapDelete'
            }, userId);
            }
            return {
                statusCode: HttpStatus.SUCCESS,
                message: STATUS_MESSAGE.scopeDeleteSuccess,
            };
        } catch (err) {
            console.log(`Error deleting, ${err}`)
            return {
                statusCode: HttpStatus.FAILED,
                message: STATUS_MESSAGE.scopeDeleteFailed,
            };
        }
    };

}