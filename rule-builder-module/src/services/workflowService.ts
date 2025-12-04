import { RuleScope } from "../models/ruleScope";
import { ScopeEvent } from "../models/scopeEvents";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize, Op, QueryTypes } from "sequelize";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import { Logger } from "winston";
import { ICreateRuleMapWithScope, IListSCopeEvent } from "../utils/types";
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
        filters: Record<string, any>,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { scopes: any; count: number };
    }> {
        const mainDb = await this.getMainDb();
        RuleScope.initialize(mainDb);
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
        listRequest: IListSCopeEvent,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { data: any; };
    }> {
        const sequelize = await initSequelize();
        ScopeEvent.initialize(sequelize);
        const whereConditions: any = {};

        // If scopeTypeRid is provided, add it to the conditions
        if (listRequest.scope_type_rid) {
            whereConditions.scope_type_rid = listRequest.scope_type_rid;
        }

        // If statusRid is provided, add it to the conditions
        if (listRequest.status_rid) {
            whereConditions.status_rid = listRequest.status_rid;
        }

        // If no filters are provided, return all scope events
        const events = await ScopeEvent.findAll({
            where: whereConditions,
        });

        //     const results = await sequelize.query(
        //         `
        // SELECT jsonb_object_agg(key, value) AS result
        // FROM (
        //     SELECT 
        //         lower(replace(rs.name, ' ', '_')) AS key,
        //         jsonb_agg(
        //             jsonb_build_object(
        //                 'rid', se.rid,
        //                 'eid', se.eid,
        //                 'event_name', se.event_name,
        //                 'description', se.description,
        //                 'scope_type_rid', se.scope_type_rid,
        //                 'status_rid', se.status_rid,
        //                 'created_by', se.created_by,
        //                 'modified_by', se.modified_by
        //             )
        //         ) AS value
        //     FROM scope_events se
        //     JOIN scopes rs ON rs.rid = se.scope_type_rid
        //     WHERE 
        //         ($1 IS NULL OR se.scope_type_rid = $1)
        //         AND ($2 IS NULL OR se.status_rid = $2)
        //     GROUP BY rs.name
        // ) grouped;
        // `,
        //         {
        //             bind: [listRequest.scope_type_rid || null, listRequest.status_rid || null],
        //             type: QueryTypes.SELECT
        //         }
        //     );

        return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
                data: events,
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

}