import { RuleScope } from "../models/ruleScope";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize, Op } from "sequelize";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import { Logger } from "winston";
import { ICreateRuleMapWithScope } from "../utils/types";
import { logMessage } from "../utils/helpers";
import { RuleMapService } from "../services/workflowRuleMapService";
import { ScopeService } from "../services/workflowScopeMapService";

/**
 * Evaluate a rule for a given entity (case or task)
 */
export class WorkFlowService {

    private logger: Logger;
    private ruleMapService: RuleMapService;
    private scopeService: ScopeService;

    constructor(logger: Logger) {
        this.logger = logger;
        this.ruleMapService = new RuleMapService(this.logger);
        this.scopeService = new ScopeService(this.logger);
    }

    //list scopes
    async listScopes(
        data: any,
        filters: Record<string, any>,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { scopes: any; count: number };
    }> {
        const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
            dialect: "postgres",
            logging: false, // optional
        });
        RuleScope.initialize(sequelize);
        const limit = data.limit;
        const offset = (data.page - 1) * limit;
        const where: any = {};

        if (filters && Object.keys(filters).length > 0) {
            for (const key in filters) {
                if (filters[key] !== undefined && filters[key] !== null) {
                    // You can also add LIKE support here if needed
                    if (key === "field_name") {
                        where[key] = { [Op.iLike]: `%${filters[key]}%` };
                    } else {
                        where[key] = filters[key];
                    }
                }
            }
        }
        const { rows, count } = await RuleScope.findAndCountAll({
            where,
            order: [[data.sortBy, data.sortOrder]],
            limit,
            offset
        });
        return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
                scopes: rows,
                count: count,
            },
        };
    };

    //list scope events based on scope/all
    async listScopeEvents(
        data: any,
        filters: Record<string, any>,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { scopes: any; count: number };
    }> {
        const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
            dialect: "postgres",
            logging: false, // optional
        });
        RuleScope.initialize(sequelize);
        const limit = data.limit;
        const offset = (data.page - 1) * limit;
        const where: any = {};

        if (filters && Object.keys(filters).length > 0) {
            for (const key in filters) {
                if (filters[key] !== undefined && filters[key] !== null) {
                    // You can also add LIKE support here if needed
                    if (key === "field_name") {
                        where[key] = { [Op.iLike]: `%${filters[key]}%` };
                    } else {
                        where[key] = filters[key];
                    }
                }
            }
        }
        const { rows, count } = await RuleScope.findAndCountAll({
            where,
            order: [[data.sortBy, data.sortOrder]],
            limit,
            offset
        });
        return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
                scopes: rows,
                count: count,
            },
        };
    };

    async createRuleMapWithScope(rulemapRequest: ICreateRuleMapWithScope, userId: string): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { ruleMap: any };
    }> {
        console.log("rule map creation");
        const ruleMapResponse = await this.ruleMapService.createRuleMap(
            {
                rule_rid: rulemapRequest.rule_rid,
                scope_type_rid: rulemapRequest.scope_type_rid,
                apply_type: rulemapRequest.apply_type,
                created_by: rulemapRequest.created_by,
                modified_by: rulemapRequest.created_by
            },
            userId
        );
        const createdRuleMap = ruleMapResponse.data?.ruleMap;

        if (rulemapRequest.apply_type === 2) {
            let createdScopes: any[] = [];
            for (const entityRid of rulemapRequest.scope_entity_rid) {
                const scopeResponse = await this.scopeService.createScope(
                    {
                        scope_rid: "",
                        rule_rid: rulemapRequest.rule_rid,
                        scope_entity_type: rulemapRequest.scope_type_rid,
                        scope_entity_rid: entityRid,
                        is_active: true,
                        created_by: rulemapRequest.created_by,
                        modified_by: rulemapRequest.created_by
                    },
                    userId
                );
                createdScopes.push(scopeResponse.data?.scope);
            }
        }
        return {
            statusCode: 200,
            message: "RuleMap and Scopes processed successfully",
            data: {
                ruleMap: createdRuleMap,
            }
        };

    };

    //export const evaluateRuleForEntity = async (ruleRid: string, entity: any, userId: number) => {
    //   const conditionGroups = await ConditionGroupModel.getConditionGroupsByRule(ruleRid);

    //   let ruleSatisfied = false;

    //   for (const group of conditionGroups) {
    //     const conditions = await ConditionModel.getConditionsByGroup(group.rid!);
    //     let groupResult = group.groupOperator === "AND";

    //       for (const condition of conditions) {
    //         const entityValue = entity[condition.fieldName];
    //         const conditionMatch = ActionService.checkCondition(entityValue, condition.operator, condition.value, condition.dataType);

    //         if (group.groupOperator === "AND") groupResult = groupResult && conditionMatch;
    //         else groupResult = groupResult || conditionMatch;
    //       }

    //       if (groupResult) {
    //         ruleSatisfied = true;
    //         break; // Stop if any group satisfies
    //       }
    //   }

    //   if (ruleSatisfied) {
    //     const actions = await ActionService.getActionsByRule(ruleRid);
    //     for (const action of actions) {
    //       await ActionService.executeAction(action, entity, userId);
    //       await AuditService.createAuditEntry({
    //         ruleRid,
    //         action: action.actionType,
    //         oldValue: entity[action.fieldName],
    //         newValue: action.newValue,
    //         notes: `Executed action ${action.actionType} for entity ${entity.id}`,
    //         createdBy: userId,
    //       });
    //     }
    //   }

    //   return ruleSatisfied;
    //};

    /**
     * Fetch rules applicable for a given entity type (case/task)
     */
    //export const getApplicableRulesForEntity = async (entityType: string, entityId: number) => {
    // const scopeMaps = await ScopeMapModel.getScopesByEntity(entityType, entityId);
    //const rules = ["test"];

    // for (const map of scopeMaps) {
    //   const rule = await RuleMasterModel.getRuleMasterById(map.ruleId);
    //   if (rule?.isActive) rules.push(rule);
    // }

    //return rules;
    //};

}