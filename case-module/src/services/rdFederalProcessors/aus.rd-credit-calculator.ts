import { QueryTypes, Sequelize } from "sequelize";
import { initOrgSequelize } from "../../config/orgDataSource";
import { calculateRDExpenditureQuery } from "../../utils/rdFinancialWorking.rawQueries";
import { CalculateQreCostType } from "../../utils/types";
import { Case } from "../../models/caseModel";

type extractConfig = {
    tax_rate : number,
    intensity : number,
    tier_1_rd_premium : number,
    tier_2_rd_premium : number,
    excess_amount : number
}

export class RdCreditCalculatorForAus {
    country = "AUS";
    creditType = "Federal R&D Credit - AUS";
    currency = "AUD";

    private orgDbSequelize: Sequelize | null = null;

    private async getOrgDb() {
        if (!this.orgDbSequelize) {
            this.orgDbSequelize = await initOrgSequelize();
        }
        return this.orgDbSequelize;
    }

    async computeForAus(caseRid : string, accountRid : string, schemaName : string, extractConfig : extractConfig, caseDetails : Case) {
      const orgDb = await this.getOrgDb();
      const calculateQreCost = await orgDb.query<CalculateQreCostType>(calculateRDExpenditureQuery(schemaName, caseRid, accountRid), {type : QueryTypes.SELECT});
      if(calculateQreCost.length > 0) {
        let totalFteQreCost = 0.00;
        let totalSubconQreCost = 0.00;
        let totalNonlaborQreCost = 0.00;
        let totalAllocatedNotionalDections = 0.00;
        let totalAccountExpenditure = 0.00;
        let rdTotalExpenses = 0.00;
        let totalNotionalObj : any;
        let rdIntensity = 0.00
        let taxRate = 0.00;

        calculateQreCost.forEach((cost : CalculateQreCostType) => {
          totalFteQreCost = parseFloat(Number(totalFteQreCost + Number(cost.fte_qre_amount)).toFixed(2));
          totalSubconQreCost = parseFloat(Number(totalSubconQreCost + Number(cost.subcon_qre_amount)).toFixed(2))
          totalNonlaborQreCost = parseFloat(Number(totalNonlaborQreCost + Number(cost.nonlabor_qre_amount)).toFixed(2))
        })
        totalAllocatedNotionalDections = totalFteQreCost + totalSubconQreCost + totalNonlaborQreCost;
        totalAccountExpenditure = totalAllocatedNotionalDections;
        let preliminaryCalculation = totalAccountExpenditure;
        taxRate = extractConfig.tax_rate;
        rdTotalExpenses = Number(caseDetails.total_expenses)|| 0.00
        totalNotionalObj = totalAccountExpenditure;
        rdIntensity = parseFloat(Number(totalAccountExpenditure/rdTotalExpenses).toFixed(4))
        let conditionDeduction = extractConfig.intensity/100
        let notionalDeductionApplied = 0.00;
        let notionalDeductionAppliedForTier2 = 0.00;
        if(rdIntensity < conditionDeduction) {
          notionalDeductionApplied = totalAccountExpenditure
        } else {
          notionalDeductionApplied = rdTotalExpenses * conditionDeduction
        }
        if(rdIntensity > conditionDeduction) {
          notionalDeductionAppliedForTier2 = totalAccountExpenditure - notionalDeductionApplied
        } else {
          notionalDeductionAppliedForTier2 = 0.00
        }
        let calculateCredit = [
          {
            name : `Tier 1 (Intensity: 0 to ${extractConfig.intensity}% R&D premium: ${extractConfig.tier_1_rd_premium}%)`,
            "Notional deductions applied": notionalDeductionApplied,
            "offset Amount" : parseFloat(Number(notionalDeductionApplied * ((taxRate/100) + (extractConfig.tier_1_rd_premium/100))).toFixed(2)) || 0.00
          },
          {
            name : `Tier 2 Intensity: > ${extractConfig.intensity}% R&D premium: ${extractConfig.tier_2_rd_premium}%)`,
            "Notional deductions applied" : notionalDeductionAppliedForTier2,
            "offset Amount" : notionalDeductionAppliedForTier2 * ((taxRate/100) + (extractConfig.tier_2_rd_premium/100)) || 0.00
          }
        ]
        let nonRefundableRdTaxOffset = parseFloat(Number(calculateCredit[0]?.["offset Amount"]! + calculateCredit[1]?.["offset Amount"]!).toFixed(2));
        const finalData = {
          "Preliminary Calculation" :{
            "Add-back of R&D accounting expenditure (Item 7D)" : preliminaryCalculation
          },
          "R&D Expenditure" : {
            "R&D expenditure - Research service provider (RSP)" : totalNonlaborQreCost,
            "R&D expenditure - Contract expenditure (not RSP)": totalSubconQreCost,
            "R&D expenditure - Salary expenditure": totalFteQreCost,
            "Total of allocated notional deductions" : totalAllocatedNotionalDections,
            "Total of notional R&D deductions (X plus Y)": totalAccountExpenditure
          },
          "Additional Information" : {
            "Tax rate" : `${taxRate}%`
          },
          "Non-refundable tax offset" : {
            "R&D entity total expenses" : rdTotalExpenses,
            "Total notional R&D deductions" : totalNotionalObj,
            "R&D intensity" : `${rdIntensity}%`
          },
          "Tier of intensity" : calculateCredit,
          "Non-refundable R&D tax offset": {
            "Total Offset Amount" : nonRefundableRdTaxOffset
          }
        }
        return {
          inputFields : {
                country : this.country,
                credit_type : this.creditType,
                currency : this.currency
            },
          computedFields : finalData
        }
      }
    }
}