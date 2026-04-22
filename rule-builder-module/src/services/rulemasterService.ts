import { RuleMaster } from "../models/workflowRuleMaster";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize, Op } from "sequelize";
import dayjs from "dayjs";
import { HttpStatus, STATUS_MESSAGE, ALPHANUMERIC_CONDITIONS, MAIN_SCHEMA_NAME, rawQueries, mainTableFilters } from "../utils/constants";
import { Logger } from "winston";
import { ICreateRule, IUpdateRule } from "../utils/types";
import { logMessage } from "../utils/helpers";
import { RuleHistoryService } from "./workflowRuleHistoryService";
import { json } from "body-parser";


export class RulemasterService {

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


    /** CREATE a new RuleMaster */
    async createRuleMaster(ruleRequest: ICreateRule, userId: string): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { rules: any };
    }> {
        const mainDb = await this.getMainDb();
        RuleMaster.initialize(mainDb);

        const checkExists = await RuleMaster.findOne({ where: { rule_name: ruleRequest.rule_name } });
        if (checkExists) {
            return {
                statusCode: HttpStatus.BAD_REQUEST,
                message: "",
                errorMessage: "Rule name already exists"
            };
        }

        const rulem = await RuleMaster.create({
            rule_name: ruleRequest.rule_name,
            description: ruleRequest.description ?? null,
            condition_rid: ruleRequest.condition_rid ?? null,
            event_rid: ruleRequest.event_rid,
            trigger_type: ruleRequest.trigger_type,
            is_active: ruleRequest.is_active ?? true,
            scope_type_rid: ruleRequest.scope_type_rid,
            schedule_offset_type: ruleRequest.schedule_offset_type ?? null,
            schedule_offset_value: ruleRequest.schedule_offset_value ?? null,
            created_by: ruleRequest.created_by
        });

        // for (const attr of attributesToTrack) {
        //     await this.ruleHistoryService.createHistory({
        //         rule_rid: rulem.rid,          
        //         attribute_name: attr,
        //         old_value: null,                   
        //         new_value: rulem[attr],
        //         created_by: ruleRequest.created_by
        //     }, userId);
        // }

        return {
            statusCode: HttpStatus.SUCCESS,
            message: STATUS_MESSAGE.ruleCreated,
            data: {
                rules: rulem,
            },
        };
    };


    /** GET all RuleMasters */
    async listRuleMasters(
        data: any,
        filters: Record<string, any>,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { rules: any; count: number };
    }> {
        //console.log("filters"+JSON.stringify(filters));
        let sortBy = data.sortBy;
        console.log("listing all rules");
        const mainDb = await this.getMainDb();
        RuleMaster.initialize(mainDb);
        const offset = (data.page - 1) * data.limit;
        let modifiedByFilter;
        let modifiedByConditions;
        let createdByFilter;
        let scopeTypeFilter;
        let createdByConditions;
        let scopeTypeConditions;
        let totalResults: number = 0;
        let disablePagination = false;
        if (apiType === "download") {
            disablePagination = true
        }
        const detectConditions = (filters: any) => {
            if (!filters) return null;
            for (let conditions of Object.values(ALPHANUMERIC_CONDITIONS)) {
                if (Object.keys(filters).includes(conditions)) return conditions;
            }
            return null;
        };
        if (filters?.modified_user_name) {
            modifiedByFilter = filters.modified_user_name;
            modifiedByConditions = detectConditions(modifiedByFilter);
        }
        if (filters?.created_user_name) {
            createdByFilter = filters.created_user_name;
            createdByConditions = detectConditions(createdByFilter);
        }
        if (filters?.scope_type_name) {
            scopeTypeFilter = filters.scope_type_name;
            scopeTypeConditions = detectConditions(scopeTypeFilter);
        }
        ["created_user_name", "modified_user_name", "scope_type_name"].forEach(key => {
            if (filters[key]) {
                disablePagination = true;
                delete filters[key];
            }
        });

        if (mainTableFilters[sortBy] !== undefined) {
            disablePagination = true;
        }

        const schemaName = `${MAIN_SCHEMA_NAME}`;
        const { whereClause } = this.buildWhereClause(filters, schemaName);
        const [finalSortBy, finalSortOrder] = this.getSortParameters(sortBy, data.sortOrder);
        const { rows: rules, count } = await RuleMaster.findAndCountAll({
            where: {
                ...whereClause
            },
            order: [[finalSortBy, finalSortOrder]],
            ...(disablePagination
                ? {}
                : { limit: data.limit, offset: offset }),
        });

        //console.log(JSON.stringify(rules));
        if (rules.length === 0) {
            return {
                statusCode: 200,
                message: 'No rules found',
                data: {
                    rules: [],
                    count: 0
                }
            };
        }
        const plainRules = rules.map((r: any) => r.toJSON());
        let createdByIds = [...new Set(plainRules.map(r => r.created_by))];
        let modifiedByIds = [...new Set(plainRules.map(r => r.modified_by))];
        let scopeTypeIds = [...new Set(plainRules.map(r => r.scope_type_rid))];
        let ruleRids = [...new Set(plainRules.map(r => r.rid))];
        let eventRids = [...new Set(plainRules.map(r => r.event_rid))];
        // let createdByIds: any[] = [...new Set(rules.map((user: any) => user.created_by))];
        // let modifiedByIds: any[] = [...new Set(rules.map((user: any) => user.modified_by))];
        let fetchCreatedByUsers = await mainDb.query(rawQueries.fetchUser(createdByIds));
        let fetchModifiedByUsers = await mainDb.query(rawQueries.fetchUser(modifiedByIds));
        let scopeTypeName = await mainDb.query(rawQueries.getScopeTypeName(scopeTypeIds));
        let mappedRulesRes = await mainDb.query(rawQueries.getMappedRuleRids(ruleRids));
        let eventTypes = await mainDb.query(rawQueries.getEventTypes(eventRids));
        let createdMap: Map<string, string> = new Map(fetchCreatedByUsers[0].map((user: any) => [user.rid, `${user.first_name} ${user.last_name}`]));
        let modifiedMap: Map<string, string> = new Map(fetchModifiedByUsers[0].map((user: any) => [user.rid, `${user.first_name} ${user.last_name}`]));
        let scopeTypeMap: Map<string, string> = new Map(scopeTypeName[0].map((scope: any) => [scope.rid, `${scope.scope_name}`]));
        let mappedRuleSet = new Set(mappedRulesRes[0].map((row: any) => row.rule_rid));
        let eventTypeMap: Map<string, string> = new Map(eventTypes[0].map((event: any) => [event.rid, `${event.type}`]));
        let finalData = rules == null ? [] : rules.map((da: any) => {
            //console.log("each object "+d);
            const d = da.toJSON();
            return {
                rid: d.rid,
                r_number: d.r_number,
                rule_name: d.rule_name,
                description: d.description,
                event_rid: d.event_rid,
                event_type: eventTypeMap.get(d.event_rid) || null,
                condition_rid: d.condition_rid,
                scope_type_rid: d.scope_type_rid,
                scope_type_name: scopeTypeMap.get(d.scope_type_rid) || null,
                is_active: d.is_active,
                is_rule_mapped: mappedRuleSet.has(d.rid),
                created_by: d.created_by,
                created_user_name: createdMap.get(d.created_by) || null,
                modified_by: d.modified_by,
                modified_user_name: modifiedMap.get(d.modified_by) || null,
                created_datetime: d.created_datetime,
                modified_datetime: d.modified_datetime
            };
        });
        const applyFilters = (data: any[], conditions: any, value: any, field: any) => {
            if (!conditions || !field) return data;
            const val = value[conditions];
            switch (conditions) {
                case ALPHANUMERIC_CONDITIONS.equals:
                    return data.filter((d: any) => d[field]?.toLowerCase() === val?.toLowerCase());
                case ALPHANUMERIC_CONDITIONS.notEquals:
                    return data.filter((d: any) => d[field]?.toLowerCase() != val?.toLowerCase());
                case ALPHANUMERIC_CONDITIONS.contains:
                    return data.filter((d: any) => d[field]?.toLowerCase().includes(val?.toLowerCase()));
                case ALPHANUMERIC_CONDITIONS.isEmpty:
                    return data.filter((d: any) => d[field] == null);
                default:
                    return data;
            }
        };
        if (modifiedByConditions != null && modifiedByConditions != undefined)
            finalData = applyFilters(finalData, modifiedByConditions, modifiedByFilter, "modified_user_name");
        if (createdByConditions != null && createdByConditions != undefined)
            finalData = applyFilters(finalData, createdByConditions, createdByFilter, "created_user_name");
        if (scopeTypeConditions != null && scopeTypeConditions != undefined)
            finalData = applyFilters(finalData, scopeTypeConditions, scopeTypeFilter, "scope_type_name");
        if (mainTableFilters[sortBy] != undefined && data.sortOrder.toLowerCase() == 'asc') {
            finalData = finalData.sort((a: any, b: any) => {
                if (!a?.[sortBy]) return 1;
                if (!b?.[sortBy]) return -1;
                return a[sortBy].localeCompare(b[sortBy]);
            });
        } else if (mainTableFilters[sortBy] != undefined && data.sortOrder.toLowerCase() == 'desc') {
            finalData = finalData.sort((a: any, b: any) => {
                if (!b?.[sortBy]) return 1;
                if (!a?.[sortBy]) return -1;
                return b[sortBy].localeCompare(a[sortBy]);
            });
        }
        totalResults = disablePagination ? finalData.length : count;
        let finalPaginatedData = [];
        if (apiType === "download") {
            finalPaginatedData = finalData;
        }
        else {
            finalPaginatedData = disablePagination ? finalData.slice((data.page - 1) * data.limit, data.page * data.limit) : finalData;
        }

        return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
                rules: finalPaginatedData,
                count: totalResults,
            },
        };
    };

    async updateRuleMaster(
        ruleRequest: IUpdateRule,
        userId: string
    ) {
        const mainDb = await this.getMainDb();
        RuleMaster.initialize(mainDb);
        const oldRule = await RuleMaster.findOne({ where: { rid: ruleRequest.rule_rid } });
        if (!oldRule) {
            return {
                statusCode: HttpStatus.BAD_REQUEST,
                message: "",
                errorMessage: "Rule not found"
            };
        }


        if (ruleRequest.rule_name) {
            const existingRule = await RuleMaster.findOne({
                where: {
                    rule_name: ruleRequest.rule_name,
                    rid: { [Op.ne]: ruleRequest.rule_rid }, // exclude current rule
                },
            });

            if (existingRule) {
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'Rule name already exists',
                    errorMessage: "Rule name already exists"
                };
            }
        }

        const oldRuleData = oldRule.toJSON();
        const historyRecords = [];
        // Compare and prepare history records for each field
        const fieldsToUpdate = [
            { field: 'rule_name', oldValue: oldRuleData.rule_name, newValue: ruleRequest.rule_name },
            { field: 'description', oldValue: oldRuleData.description, newValue: ruleRequest.description ?? null },
            { field: 'condition_rid', oldValue: oldRuleData.condition_rid, newValue: ruleRequest.condition_rid ?? null },
            { field: 'event_rid', oldValue: oldRuleData.event_rid, newValue: ruleRequest.event_rid },
            { field: 'scope_type_rid', oldValue: oldRuleData.scope_type_rid, newValue: ruleRequest.scope_type_rid },
            { field: 'modified_by', oldValue: oldRuleData.modified_by, newValue: ruleRequest.modified_by }
        ];

        for (const { field, oldValue, newValue } of fieldsToUpdate) {
            if (oldValue !== newValue) {
                try {
                    historyRecords.push({
                        rule_rid: oldRuleData.rid,
                        attribute_name: field,
                        old_value: oldValue,
                        new_value: newValue,
                        created_by: userId,
                        action: 'ruleUpdate'
                    });
                } catch (err) {
                    console.log(err);
                }
            }
        }

        for (const history of historyRecords) {
            await this.ruleHistoryService.createHistory(history, userId);
        }

        //Update rule
        const newRule = await oldRule.update({
            rule_name: ruleRequest.rule_name,
            description: ruleRequest.description ?? null,
            condition_rid: ruleRequest.condition_rid ?? null,
            event_rid: ruleRequest.event_rid,
            trigger_type: ruleRequest.trigger_type,
            is_active: ruleRequest.is_active ?? true,
            scope_type_rid: ruleRequest.scope_type_rid,
            schedule_offset_type: ruleRequest.schedule_offset_type ?? null,
            schedule_offset_value: ruleRequest.schedule_offset_value ?? null,
            modified_by: userId,
            modified_datetime: new Date()
        });

        return {
            statusCode: HttpStatus.SUCCESS,
            message: STATUS_MESSAGE.ruleUpdated,
            data: {
                rules: "",
            },
        };
    }

    async getRuleDetailByRuleRid(
        ruleRid: string, userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: any;
    }> {
        const mainDb = await this.getMainDb();
        RuleMaster.initialize(mainDb);
        console.log("ruleRid" + ruleRid);
        const rule = await RuleMaster.findOne({ where: { rid: ruleRid } });
        if (!rule) {
            return {
                statusCode: HttpStatus.NOT_FOUND,
                message: "",
            };
        }
        return {
            statusCode: HttpStatus.SUCCESS,
            message: "",
            data: rule
        };
    }


    async updateRuleMasterStatus(
        req: any,
        userId: string
    ) {
        const mainDb = await this.getMainDb();
        RuleMaster.initialize(mainDb);
        const srule = await RuleMaster.findOne({ where: { rid: req.rule_rid } });
        if (!srule) {
            return {
                statusCode: HttpStatus.NOT_FOUND,
                message: "",
            };
        }
        await srule.update({
            is_active: req.is_active ?? true,
            modified_by: userId,
            modified_datetime: new Date(),
        });
        return {
            statusCode: HttpStatus.SUCCESS,
            message: "",
            data: ""
        };
    }

    // /** DELETE RuleMaster by RID */
    async deleteRuleMaster(data: any, userId: string) {
        try {
            const mainDb = await this.getMainDb();
            RuleMaster.initialize(mainDb);
            await RuleMaster.destroy({ where: { rid: data.rule_rid } });
            return {
                statusCode: HttpStatus.SUCCESS,
                message: STATUS_MESSAGE.ruleDeleteSuccess,
            };
        } catch (err) {
            console.log(`Error deleting, ${err}`)
            return {
                statusCode: HttpStatus.FAILED,
                message: STATUS_MESSAGE.ruleDeleteFailed,
            };
        }
    };


    private buildWhereClause(filters: Record<string, any>, schemaName?: string): {
        whereClause: Record<string, any>;
    } {
        let whereClause: Record<string, any> = {};
        let includeClause: Array<any> = [];
        if (filters) {
            const filterProcessors: Record<string, Function> = {
                'r_number': (value: any) => this.processTextFilter('r_number', value, whereClause),
                'rule_name': (value: any) => this.processTextFilter('rule_name', value, whereClause),
                //'version': (value: any) => this.processNumberFilter('version', value, whereClause),
                'created_datetime': (value: any) => this.processDateFilter('created_datetime', value, whereClause),
                'modified_datetime': (value: any) => this.processDateFilter('modified_datetime', value, whereClause),
                //'status_rid': (value: any) => this.processTextFilter('status_rid', value, whereClause),
                //'project_count': (value: any) => this.processProjectCountFilter(value, whereClause, schemaName ?? ""),
            };
            Object.keys(filters).forEach(key => {

                const value = filters[key];
                if (value === undefined || value === null) return;
                if (filterProcessors[key]) {
                    filterProcessors[key](value);
                } else if (value !== '') {
                    whereClause[key] = value;
                }
            });
        }
        return { whereClause };
    }

    private processTextFilter(field: string, value: any, whereClause: Record<string | symbol, any>): void {
        if (typeof value === 'string') {
            // Simple string value - treat as equals
            whereClause[field] = value;
        } else if (typeof value === 'object') {
            if (value.equals !== undefined) {
                whereClause[field] = Sequelize.where(
                    Sequelize.fn('LOWER', Sequelize.col(field)),
                    value.equals.toLowerCase()
                );
            } else if (value.not_equals !== undefined) {
                whereClause[field] = Sequelize.where(
                    Sequelize.fn('LOWER', Sequelize.col(field)),
                    '!=',
                    value.not_equals.toLowerCase()
                );
            } else if (value.contains !== undefined) {
                whereClause[field] = { [Op.iLike]: `%${value.contains}%` };
            } else if (Array.isArray(value.in) && value.in.length > 0) {
                whereClause[Op.or] = value.in.map((val: string) =>
                    Sequelize.where(
                        Sequelize.fn('LOWER', Sequelize.col(field)),
                        '=',
                        val.toLowerCase()
                    )
                );
            } else if (value.is_empty !== undefined) {
                if (value.is_empty) {
                    whereClause[field] = { [Op.or]: [null, ''] };
                } else {
                    whereClause[field] = { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] };
                }
            }
        }
    }

    private processNumberFilter(field: string, value: any, whereClause: Record<string | symbol, any>): void {
        if (typeof value === 'number') {
            // Simple number value - treat as equals
            whereClause[field] = value;
        } else if (typeof value === 'object') {
            if (value.equals !== undefined) {
                whereClause[field] = value.equals;
            } else if (value.not_equals !== undefined) {
                whereClause[field] = { [Op.ne]: value.not_equals };
            } else if (value.greater_than !== undefined) {
                whereClause[field] = { ...(whereClause[field] || {}), [Op.gt]: value.greater_than };
            }
            if (value.less_than !== undefined) {
                whereClause[field] = { ...(whereClause[field] || {}), [Op.lt]: value.less_than };
            }
            if (Array.isArray(value.in) && value.in.length > 0) {
                whereClause[field] = { [Op.in]: value.in };
            }
            // Support for between operator (e.g., { between: [min, max] })
            if ('between' in value && Array.isArray(value.between) && value.between.length === 2) {
                whereClause[field] = {
                    ...(whereClause[field] || {}),
                    [Op.gte]: value.between[0],
                    [Op.lte]: value.between[1],
                };
            }
        }
        if (value.is_empty !== undefined) {
            if (value.is_empty) {
                whereClause[field] = null;
            } else {
                whereClause[field] = { [Op.ne]: null };
            }
        }
    }

    private processDateFilter(
        field: string,
        value: any,
        whereClause: Record<string, any>
    ): void {
        if (typeof value === 'string') {
            const date = dayjs(value, 'YYYY-MM-DD').startOf('day').toDate();
            const nextDay = dayjs(date).add(1, 'day').toDate();

            whereClause[field] = {
                [Op.gte]: date,
                [Op.lt]: nextDay
            };
        } else if (typeof value === 'object') {
            if (value.equals !== undefined) {
                const date = dayjs(value.equals, 'YYYY-MM-DD').startOf('day').format('YYYY-MM-DDTHH:mm:ss[Z]');
                const nextDay = dayjs(date).add(1, 'day').toDate();

                whereClause[field] = {
                    [Op.gte]: date,
                    [Op.lt]: nextDay
                };
            } else if (value.before !== undefined) {
                const beforeDate = dayjs(value.before, 'YYYY-MM-DD').startOf('day').format('YYYY-MM-DDTHH:mm:ss[Z]');
                whereClause[field] = { [Op.lt]: beforeDate };
            } else if (value.after !== undefined) {
                const afterDate = dayjs(value.after, 'YYYY-MM-DD').endOf('day').format('YYYY-MM-DDTHH:mm:ss[Z]');
                whereClause[field] = { [Op.gt]: afterDate };
            } else if (value.between[0] && value.between[1]) {
                const fromDate = dayjs(value.between[0], 'YYYY-MM-DD').startOf('day').format('YYYY-MM-DDTHH:mm:ss[Z]');
                const toDate = dayjs(value.between[1], 'YYYY-MM-DD').endOf('day').format('YYYY-MM-DDTHH:mm:ss[Z]');

                whereClause[field] = {
                    [Op.gte]: fromDate,
                    [Op.lte]: toDate
                };
            } else if (value.is_empty !== undefined) {
                if (value.is_empty) {
                    whereClause[field] = null;
                } else {
                    whereClause[field] = { [Op.ne]: null };
                }
            }
        }
    }


    private getSortParameters(sortBy: string, sortOrder: string): [string, string] {
        const validSortColumns = [
            "r_number",
            "created_datetime",
            "modified_datetime",
            "rule_name",
        ];
        if (!validSortColumns.includes(sortBy)) {
            sortBy = "created_datetime";
        }

        sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
        return [sortBy, sortOrder];
    }

}