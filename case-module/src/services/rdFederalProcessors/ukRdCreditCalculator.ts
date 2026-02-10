import { QueryTypes, Sequelize } from "sequelize";
import { initOrgSequelize } from "../../config/orgDataSource";
import { countAssignedProjects, fetchProjectCostDetailsBasedOnCases, fetchProjectCostDetailsForUkBasedOnCases } from "../../utils/rdFinancialWorkingQueries";
import { ProjectComputeValue } from "../../utils/types";

type extractConfig = {
    reduction : number,
    gross_rdec : number
}

export class RdCreditCalculatorForUK {
    country = "GBR";
    creditType = "Federal R&D Credit - UK";
    currency = "GBP";

    private orgDbSequelize: Sequelize | null = null;

    private async getOrgDb() {
        if (!this.orgDbSequelize) {
            this.orgDbSequelize = await initOrgSequelize();
        }
        return this.orgDbSequelize;
    }

    async computeForUk(caseRid : string, accountRid : string, schemaName : string, extractConfig : extractConfig) {
        const orgDb = await this.getOrgDb();
        const checkTotalProjectCount : any = await orgDb.query(countAssignedProjects(caseRid, schemaName));
        let calculateComputedValues;
        let dynamicKeyNameForTotalCount : string;

        if(checkTotalProjectCount[0][0].total >= 15) {
            dynamicKeyNameForTotalCount = `Total Customer Groups`
            calculateComputedValues = await orgDb.query<ProjectComputeValue>(fetchProjectCostDetailsForUkBasedOnCases(caseRid, accountRid, schemaName, extractConfig.reduction), {type : QueryTypes.SELECT})
        } else {
            dynamicKeyNameForTotalCount = `Total Projects`
            calculateComputedValues = await orgDb.query<ProjectComputeValue>(fetchProjectCostDetailsBasedOnCases(caseRid, accountRid, schemaName, extractConfig.reduction), {type : QueryTypes.SELECT})
        }
        return {
            inputFields : {
                country : this.country,
                credit_type : this.creditType,
                currency : this.currency
            },
            computedFields : calculateComputedValues,
            dynamicKeyNameForTotalCount : dynamicKeyNameForTotalCount
        }
    }
}