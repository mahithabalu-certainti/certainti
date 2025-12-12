import { RuleScope } from "../models/ruleScope";
import { ScopeEvent } from "../models/scopeEvents";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize, Op, QueryTypes } from "sequelize";
import { HttpStatus, STATUS_MESSAGE, rawQueries } from "../utils/constants";
import { Logger } from "winston";
import { actions, Fields, ICreateRuleMapWithScope, IListSCopeEvent } from "../utils/types";
import { logMessage } from "../utils/helpers";
import { RuleMapService } from "../services/workflowRuleMapService";
import { ScopeService } from "../services/workflowScopeMapService";
import { RulemasterService } from "./rulemasterService";
import { ConditionService } from "./workflowConditionService";
import { ActionService } from "./workflowActionService";
import { ScopeEventRows, EventConditions, ConditionCategory, Operators, Values, actionTypes } from "../utils/types";

/**
 * Evaluate a rule for a given entity (case or task)
 */
export class WorkFlowService {

    private logger: Logger;
    private ruleMasterService: RulemasterService;
    private ruleMapService: RuleMapService;
    private scopeService: ScopeService;
    private conditionService: ConditionService;
    private actionService: ActionService;
    private mainDbSequelize: Sequelize | null = null;

    constructor(logger: Logger) {
        this.logger = logger;
        this.ruleMasterService = new RulemasterService(this.logger);
        this.ruleMapService = new RuleMapService(this.logger);
        this.scopeService = new ScopeService(this.logger);
        this.conditionService = new ConditionService(this.logger);
        this.actionService = new ActionService(this.logger);
    }

    private async getMainDb() {
        if (!this.mainDbSequelize) {
            this.mainDbSequelize = await initSequelize();
        }
        return this.mainDbSequelize;
    }

    //list scopes
    async listScopes(
        data: any,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { scopes: any; };
    }> {
        const mainDb = await this.getMainDb();
        RuleScope.initialize(mainDb);
        const scopes = await RuleScope.findAll({
            attributes: ['rid', 'name']
        });
        return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
                scopes: scopes,
            },
        };
    };

    //list scope events based on scope/all
    async listScopeEvents(
        listRequest: IListSCopeEvent,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data: any;
    }> {
        const mainDb = await this.getMainDb();
        const events: ScopeEventRows[] = await mainDb.query<ScopeEventRows>(
            rawQueries.fetchScopeEvents(
                listRequest.scope_type_rid,
                listRequest.status_rid
            ),
            { type: QueryTypes.SELECT }
        );
        // in case if response needed as scope name grouped , uncomment this
        // type GroupedEvents = {
        //     [key: string]: Omit<ScopeEventRows, 'scope_type_name'>[];
        // };
        // const grouped: GroupedEvents = events.reduce((acc, event) => {
        //     const key = event.scope_type_name.toLowerCase(); // normalize key
        //     if (!acc[key]) {
        //         acc[key] = [];
        //     }
        //     const { scope_type_name, ...rest } = event;
        //     acc[key].push(rest);
        //     return acc;
        // }, {} as GroupedEvents);

        return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: events
        };
    };

    async listEventConditions(
        listRequest: any,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data: any;
    }> {
        const mainDb = await this.getMainDb();
        const conditions: EventConditions[] = await mainDb.query<EventConditions>(
            rawQueries.fetchEventConditions(
                listRequest.event_rid,
                listRequest.status_rid
            ),
            { type: QueryTypes.SELECT }
        );

        return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: conditions
        };
    };

    async listConditionCategory(
        listRequest: any,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data: any;
    }> {
        const mainDb = await this.getMainDb();
        const categories: ConditionCategory[] = await mainDb.query<ConditionCategory>(
            rawQueries.fetchConditionCategory(
                listRequest.condition_rid,
                listRequest.status_rid
            ),
            { type: QueryTypes.SELECT }
        );

        return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: categories
        };
    };

    async listFields(
        listRequest: any,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data: any;
    }> {
        const mainDb = await this.getMainDb();
        const fields: Fields[] = await mainDb.query<Fields>(
            rawQueries.fetchFields(
                listRequest.category_rid,
                listRequest.status_rid
            ),
            { type: QueryTypes.SELECT }
        );

        return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: fields
        };
    };

    async listOperators(
        listRequest: any,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data: any;
    }> {
        const mainDb = await this.getMainDb();
        const operators: Operators[] = await mainDb.query<Operators>(
            rawQueries.fetchOperators(
                listRequest.field_rid,
                listRequest.status_rid
            ),
            { type: QueryTypes.SELECT }
        );

        return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: operators
        };
    };

    async listValues(
        listRequest: any,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data: any;
    }> {
        const mainDb = await this.getMainDb();
        const values: Values[] = await mainDb.query<Values>(
            rawQueries.fetchValues(
                listRequest.field_rid,
                listRequest.status_rid
            ),
            { type: QueryTypes.SELECT }
        );

        return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: values
        };
    };

    async listActionTypes(
        listRequest: any,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data: any;
    }> {
        const mainDb = await this.getMainDb();
        const actionTypes: actionTypes[] = await mainDb.query<actionTypes>(
            rawQueries.fetchActionTypes(
                listRequest.scope_rid,
                listRequest.status_rid
            ),
            { type: QueryTypes.SELECT }
        );

        return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: actionTypes
        };
    };

    async listActions(
        listRequest: any,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data: any;
    }> {
        const mainDb = await this.getMainDb();
        const actionTypes: actions[] = await mainDb.query<actions>(
            rawQueries.fetchActions(
                listRequest.action_type_rid,
                listRequest.status_rid
            ),
            { type: QueryTypes.SELECT }
        );

        return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: actionTypes
        };
    };

    async createRule(ruleRequest: any, userId: string): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { rule: any };
    }> {
        const rule = await this.ruleMasterService.createRuleMaster(
            {
                rule_rid: "",
                rule_name: ruleRequest.rule_name,
                description: ruleRequest.description ?? null,
                event_rid: ruleRequest.event_rid,
                trigger_type: ruleRequest.trigger_type,
                condition_rid: ruleRequest.condition_rid,
                is_active: ruleRequest.is_active ?? true,
                scope_type_rid: ruleRequest.scope_type_rid,
                schedule_offset_type: ruleRequest.schedule_offset_type ?? null,
                schedule_offset_value: ruleRequest.schedule_offset_value ?? null,
                created_by: ruleRequest.created_by,
                modified_by: ruleRequest.modified_by ?? ruleRequest.created_by, // fallback to created_by if undefined
            }, userId
        )

        let ruleRid = rule.data?.rules?.toJSON()?.rid
        console.log("rule id " + ruleRid);

        for (const [index, condition] of ruleRequest.condition_categories.entries()) {
            await this.conditionService.createCondition({
                condition_rid: "",
                rule_rid: ruleRid,
                category_rid: condition.category_rid,
                logical_operator: condition.category_operator,
                field_rid: condition.field_rid,
                operator_rid: condition.operator_rid,
                value_rid: condition.value_rid,
                data_type: "",
                sequence: index + 1,
                group_id: 1,
                created_by: ruleRequest.created_by,
                modified_by: ruleRequest.created_by
            }, userId);
        }

        for (const [index, actionRid] of ruleRequest.action_rid.entries()) {
            await this.actionService.createAction({
                rule_rid: ruleRid,
                action_rid: actionRid,
                target_user: "test",
                new_value: "test",
                action_order: index + 1,
                created_by: ruleRequest.created_by,
                modified_by: ruleRequest.created_by,
            }, userId)
        }

        return {
            statusCode: 200,
            message: "Rule created successfully",
            data: {
                rule: "",
            }
        };
    }


    async createRuleMapWithScope(ruleRequest: ICreateRuleMapWithScope, userId: string): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { ruleMap: any };
    }> {
        console.log("rule map creation");
        const ruleMapResponse = await this.ruleMapService.createRuleMap(
            {
                rule_rid: ruleRequest.rule_rid,
                apply_type: ruleRequest.apply_type,
                created_by: ruleRequest.created_by,
                modified_by: ruleRequest.created_by
            },
            userId
        );
        const createdRuleMap = ruleMapResponse.data?.ruleMap;

        if (ruleRequest.apply_type === 2) {
            let createdScopes: any[] = [];
            for (const entityRid of ruleRequest.scope_entity_rid) {
                const scopeResponse = await this.scopeService.createScope(
                    {
                        scope_rid: "",
                        rule_rid: ruleRequest.rule_rid,
                        scope_entity_type: ruleRequest.scope_type_rid,
                        scope_entity_rid: entityRid,
                        is_active: true,
                        created_by: ruleRequest.created_by,
                        modified_by: ruleRequest.created_by
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

    async execute(request: any, userId: string): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { info: any };
    }> {
        const mainDb = await this.getMainDb();
        //fetching event rid, scope type rid from event name 
        const eventRid = await mainDb.query<any>(
            rawQueries.fetchEventRid(
                request.event_name,
                request.task_rid
            ),
            { type: QueryTypes.SELECT }
        );
        const { scope_type_rid, event_rid } = eventRid[0];
        //fetching relavent rules, condition rid, apply type from event rid
        const rules = await mainDb.query<any>(rawQueries.fetchRulesFromEvent(event_rid, scope_type_rid, request.task_rid),
            { type: QueryTypes.SELECT }
        );
        // const conditions = await mainDb.query<any>(rawQueries.fetchCategories(condition_rid, rule_rid),
        //     { type: QueryTypes.SELECT }
        // );
        return {
            statusCode: 200,
            message: "",
            data: {
                info: rules,
            }
        };
    }


}