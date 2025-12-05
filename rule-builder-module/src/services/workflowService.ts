import { RuleScope } from "../models/ruleScope";
import { ScopeEvent } from "../models/scopeEvents";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize, Op, QueryTypes } from "sequelize";
import { HttpStatus, STATUS_MESSAGE, rawQueries } from "../utils/constants";
import { Logger } from "winston";
import { ICreateRuleMapWithScope, IListSCopeEvent } from "../utils/types";
import { logMessage } from "../utils/helpers";
import { RuleMapService } from "../services/workflowRuleMapService";
import { ScopeService } from "../services/workflowScopeMapService";
import { ScopeEventRows, EventConditions, ConditionCategory, Operators, Values } from "../utils/types";

/**
 * Evaluate a rule for a given entity (case or task)
 */
export class WorkFlowService {

    private logger: Logger;
    private ruleMapService: RuleMapService;
    private scopeService: ScopeService;
    private mainDbSequelize: Sequelize | null = null;

    constructor(logger: Logger) {
        this.logger = logger;
        this.ruleMapService = new RuleMapService(this.logger);
        this.scopeService = new ScopeService(this.logger);
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
                listRequest.category_rid,
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
                listRequest.category_rid,
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

}