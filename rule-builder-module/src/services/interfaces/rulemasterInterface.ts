
import { ICreateRule } from "../../utils/types";
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
}