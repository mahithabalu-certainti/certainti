import { QueryTypes, Sequelize } from "sequelize";
import { initOrgSequelize } from "../../config/orgDataSource";
import { fetchProjectCostDetailsBasedOnCases } from "../../utils/rdFinancialWorking.rawQueries";
import { ProjectComputeValueForIreland } from "../../utils/types";

type extractConfig = {
    reduction : number,
    research_development_tax_credit : number
}

export class RdCreditCalculatorForIRL {
    country = "IRL";
    creditType = "Federal R&D Credit - IRL";
    currency = "EUR";

    private orgDbSequelize: Sequelize | null = null;

    private async getOrgDb() {
        if (!this.orgDbSequelize) {
            this.orgDbSequelize = await initOrgSequelize();
        }
        return this.orgDbSequelize;
    }

    async computeForIRL(caseRid : string, accountRid : string, schemaName : string, extractConfig : extractConfig) {
        const orgDb = await this.getOrgDb();
        const calculateComputedValues = await orgDb.query<ProjectComputeValueForIreland>(fetchProjectCostDetailsBasedOnCases(caseRid, accountRid, schemaName, extractConfig.reduction), {type : QueryTypes.SELECT})
        return {
            inputFields : {
                country : this.country,
                credit_type : this.creditType,
                currency : this.currency
            },
            computedFields : calculateComputedValues
        }
    }
}