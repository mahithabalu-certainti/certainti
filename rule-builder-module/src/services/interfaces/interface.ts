
import { ICreateRule, ICreateCondition } from "../../utils/types";
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