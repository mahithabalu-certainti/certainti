
import { ICreateRule, ICreateCondition, ICreateAction, ICreateScope, ICreateSchedule, ICreateAudit, ICreateTrigger, ICreateRuleMap, ICreateRuleMapWithScope } from "../../utils/types";
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

    updateCondition(
        conditionRequest: ICreateCondition,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { condition: any };
    }>;

    deleteCondition(data: any, userId: string): Promise<any>;
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

    updateAction(
        actionRequest: ICreateAction,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { action: any };
    }>;

    deleteAction(data: any, userId: string): Promise<any>;
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

export interface IAuditservice {
    createAudit(
        auditRequest: ICreateAudit,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { audit: any };
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
    createRuleMapWithScope(
        rulemapRequest: ICreateRuleMapWithScope,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { ruleMap: any };
    }>;
}