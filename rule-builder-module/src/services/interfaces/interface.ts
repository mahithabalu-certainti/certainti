
import { ICreateRule, IUpdateRule, ICreateCondition, IUpdateCondition, ICreateAction, ICreateScope, ICreateSchedule, ICreateAudit, ICreateTrigger, ICreateRuleMap, ICreateRuleMapWithScope, IListSCopeEvent } from "../../utils/types";
export interface IRulemasterService {
    createRuleMaster(
        ruleRequest: ICreateRule,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { rules: any };
    }>;

    updateRuleMaster(
        ruleRequest: IUpdateRule,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { rules: any };
    }>;

    listRuleMasters(data: any,
        filters: Record<string, any>,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { rules: any; count: number };
    }>;

    getRuleDetailByRuleRid(
        ruleRid: string,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: any;
    }>;

    updateRuleMaster(
        ruleRequest: ICreateRule,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { rules: any };
    }>;

    deleteRuleMaster(data: any, userId: string): Promise<any>;
}


export interface IConditionService {
    createCondition(
        conditionRequest: ICreateCondition,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { condition: any };
    }>;

    listConditions(data: any,
        filters: Record<string, any>,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { conditions: any; count: number };
    }>;

    getConditionsByRuleRid(rule_rid: string): Promise<any>;

    updateCondition(
        conditionRequest: IUpdateCondition,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { condition: any };
    }>;

    deleteCondition(condition_rid: string, rule_rid: string, userId: string): Promise<any>;
}


export interface IActionService {
    createAction(
        actionRequest: ICreateAction,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { action: any };
    }>;

    listActions(data: any,
        filters: Record<string, any>,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { actions: any; count: number };
    }>;

    getActionsByRuleRid(rule_rid: string): Promise<any>;

    updateAction(
        actionRequest: ICreateAction,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { action: any };
    }>;

    deleteAction(action_rid: string, rule_rid: string, userId: string): Promise<any>;
}


export interface IScopeService {
    createScope(
        scopeRequest: ICreateScope,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { scope: any };
    }>;

    listScopes(data: any,
        filters: Record<string, any>,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { scopes: any; count: number };
    }>;

    updateScope(
        scopeRequest: ICreateScope,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { scope: any };
    }>;

    deleteScope(data: any, userId: string): Promise<any>;
}

export interface IScheduleService {
    createSchedule(
        scheduleRequest: ICreateSchedule,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { schedule: any };
    }>;

    listSchedules(data: any,
        filters: Record<string, any>,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { schedules: any; count: number };
    }>;

    updateSchedule(
        scheduleRequest: ICreateSchedule,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { schedule: any };
    }>;

    deleteSchedule(data: any, userId: string): Promise<any>;
}

export interface IRuleHistoryservice {
    createHistory(
        request: any,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { history: any };
    }>;
}

export interface ITriggerservice {
    createTriggerLog(
        triggerRequest: ICreateTrigger,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { trigger: any };
    }>;
}


export interface IRuleMapService {
    createRuleMap(
        rulemapRequest: ICreateRuleMap,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { ruleMap: any };
    }>;
}


export interface IWorkFlowService {

    listScopes(data: any,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { scopes: any; };
    }>;

    listScopeEvents(listRequest: IListSCopeEvent,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: any;
    }>;

    listEventConditions(listRequest: any,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: any;
    }>;

    listConditionCategory(listRequest: any,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: any;
    }>;

    listFields(listRequest: any,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: any;
    }>;

    listOperators(listRequest: any,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: any;
    }>;

    listValues(listRequest: any,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: any;
    }>;

    listActionTypes(listRequest: any,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: any;
    }>;

    listActions(listRequest: any,
        userId: string,
        apiType: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: any;
    }>;

    createRuleMapWithScope(
        rulemapRequest: ICreateRuleMapWithScope,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { ruleMap: any };
    }>;

    createRule(
        ruleRequest: any,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { rule: any };
    }>;

    ruleDetailByRuleRid(
        ruleRequest: any,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { rule: any };
    }>;

    updateRule(
        ruleRequest: any,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { rule: any };
    }>;


    execute(
        request: any,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { info: any };
    }>;
}


