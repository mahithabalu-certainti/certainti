import { QueryTypes, Sequelize } from "sequelize";
import { initOrgSequelize } from "../../config/orgDataSource";
import { fetchAssignedProjectIds, fetchProjectCostDetailsBasedOnCases, fetchRequiredPrjDataForCanada } from "../../utils/rdFinancialWorking.rawQueries";
import { ProjectCalculatedDataCanada, ProjectComputeValue, ProjectFiscalIds } from "../../utils/types";
import { Case } from "../../models/caseModel";

type extractConfig = {
    fte_proxy : number,
    contractors_amt : number,
    provincial_oitc : number,
    provincial_ordtc : number,
    fte_qre_adjustment : number,
    federal_itc_percent : number,
    subcon_qre_adjustment : number,
    provincial_oitc_amount : number
}

export class RdCreditCalculatorForCAN {
    country = "CAN";
    creditType = "Federal R&D Credit - CAN";
    currency = "CAD";

    private orgDbSequelize: Sequelize | null = null;

    private async getOrgDb() {
        if (!this.orgDbSequelize) {
            this.orgDbSequelize = await initOrgSequelize();
        }
        return this.orgDbSequelize;
    }

    async computeForCanada(caseRid : string, accountRid : string, schemaName : string, extractConfig : extractConfig, caseDetails : Case, countryInfo : any) {
        const orgDb = await this.getOrgDb();
        const fetchIds = await orgDb.query<ProjectFiscalIds>(fetchAssignedProjectIds(caseRid, schemaName), {type : QueryTypes.SELECT})
        const calculateComputedValues = await orgDb.query<ProjectCalculatedDataCanada>(fetchRequiredPrjDataForCanada(schemaName, fetchIds, accountRid), {type : QueryTypes.SELECT})
        let fteQreAdjustment = extractConfig.fte_qre_adjustment;
        let subconQreAdjustment = extractConfig.subcon_qre_adjustment;
        let fteProxyPercent = `FTE Proxy (${extractConfig.fte_proxy}%)`
        let contractorsAmt = `Contractors Amt (${extractConfig.contractors_amt}%)`
        let calculatedNewComputedValues = calculateComputedValues.map((projectData : ProjectCalculatedDataCanada) => {
            return {
                "Project Code":projectData.project_code,
                "Project Name" : projectData.project_name,
                "Total Hours" : JSON.stringify(parseFloat(Number(projectData.total_effort_prj).toFixed(1))) || "0.00",
                "Project Total Cost": parseFloat(Number(projectData.total_cost_prj).toFixed(1)) || 0.00,
                "FTE Cost": parseFloat(Number(projectData.total_cost_fte_prj).toFixed(1)) || 0.00,
                "SubCon Cost": parseFloat(Number(projectData.total_cost_subcon_prj).toFixed(1)) || 0.00,
                "Other Cost": parseFloat(Number(projectData.total_cost_nonlabor_prj).toFixed(1)) || 0.00,
                "Total Cost": parseFloat(Number(projectData.total_cost_prj).toFixed(1)) || 0.00,
                "Net QRE %": `${projectData.rd_percent_final}%`,
                "FTE QRE Adjustment": `${fteQreAdjustment}%`,
                "Subcon QRE Adjustment": `${subconQreAdjustment}%`,
                "FTE QRE": parseFloat((Number(projectData.total_cost_fte_prj) * (Number(projectData.rd_percent_final)/100) * (fteQreAdjustment/100)).toFixed(1)) || 0.00,
                [fteProxyPercent]: parseFloat(Number((Number(projectData.total_cost_fte_prj) * (Number(projectData.rd_percent_final)/100) * (fteQreAdjustment/100)) * (extractConfig.fte_proxy/100)).toFixed(1)) || 0.00,
                "Subcon QRE": parseFloat(Number(Number(projectData.total_cost_subcon_prj) * (Number(projectData.rd_percent_final)/100) * (subconQreAdjustment/100)).toFixed(1)) || 0.00,
                [contractorsAmt]: parseFloat(Number((Number(projectData.total_cost_subcon_prj) * (Number(projectData.rd_percent_final)/100) * (subconQreAdjustment/100)) * (extractConfig.contractors_amt/100)).toFixed(1)) || 0.00,
                "QRE": parseFloat(Number((Number(projectData.total_cost_fte_prj) * (Number(projectData.rd_percent_final)/100) * (fteQreAdjustment/100)) + ((Number(projectData.total_cost_fte_prj) * (Number(projectData.rd_percent_final)/100) * (fteQreAdjustment/100)) * (extractConfig.fte_proxy/100)) + (Number(projectData.total_cost_subcon_prj) * (Number(projectData.rd_percent_final)/100) * (subconQreAdjustment/100)) + (Number(projectData.total_cost_subcon_prj) * (Number(projectData.rd_percent_final)/100) * (subconQreAdjustment/100)) * (extractConfig.contractors_amt/100)).toFixed(1)) || 0.00
            }
        });
        let provincialOitcPercent = extractConfig.provincial_oitc;
        let totalProvincialOrdtcPercent = extractConfig.provincial_ordtc;
        let federalItcPercent = extractConfig.federal_itc_percent;

        let totalFteCost = 0.00;
        let totalSubconCost = 0.00;
        let totalOtherCost = 0.00;
        let totalCost = 0.00;
        let totalHours = 0.00;
        let totalNetQrePercent = 0.00;
        let totalFteQre = 0.00;
        let totalfteProxy = 0.00;
        let totalSubconQre = 0.00;
        let totalContractorsAmount = 0.00;
        let totalQre = 0.00;
        let totalProvincialOitcAmount = 0.00;
        let totalProvincialOrdtcAmount = 0.00;
        let totalOrdtcClaimed = 0.00;
        let federalItcAmountAfterORDTC = 0.00;
        let federalItcCreditsAfterORDTC = 0.00;
        let federalItcAmountNoORDTC = 0.00;
        let federalItcCreditsNoORDTC = 0.00;
        let totalCreditWithORDTC = 0.00;
        let totalCreditWithNoORDTC = 0.00;

        calculatedNewComputedValues.forEach((projectData : any) => {
            totalFteCost = parseFloat(Number(totalFteCost + projectData["FTE Cost"]).toFixed(1)) || 0.00
            totalSubconCost = parseFloat(Number(totalSubconCost + projectData["SubCon Cost"]).toFixed(1)) || 0.00
            totalOtherCost = parseFloat(Number(totalOtherCost + projectData["Other Cost"]).toFixed(1)) || 0.00
            totalCost = parseFloat(Number(totalCost + projectData["Total Cost"]).toFixed(1)) || 0.00
            totalFteQre = parseFloat(Number(totalFteQre + projectData["FTE QRE"]).toFixed(1)) || 0.00
            totalfteProxy = parseFloat(Number(totalfteProxy + projectData[fteProxyPercent]).toFixed(1)) || 0.00
            totalSubconQre = parseFloat(Number(totalSubconQre + projectData["Subcon QRE"]).toFixed(1)) || 0.00
            totalContractorsAmount = parseFloat(Number(totalContractorsAmount + projectData[contractorsAmt]).toFixed(1)) || 0.00
            totalHours = parseFloat(Number(totalHours + projectData["Total Hours"]).toFixed(1)) || 0.00
        });
        totalQre = parseFloat(Number((totalQre + totalFteQre + totalfteProxy + totalSubconQre) - totalContractorsAmount).toFixed(1)) || 0.00
        if(totalQre < extractConfig.provincial_oitc_amount) {
            totalProvincialOitcAmount = parseFloat((Number(totalQre * extractConfig.provincial_oitc)/100).toFixed(1)) || 0.00
        } else {
            totalProvincialOitcAmount = parseFloat(Number((extractConfig.provincial_oitc_amount * extractConfig.provincial_oitc)/100).toFixed(1)) || 0.00
        }
        totalProvincialOrdtcAmount = parseFloat(Number(totalQre - totalProvincialOitcAmount).toFixed(1)) || 0.00
        totalOrdtcClaimed = parseFloat(Number((totalProvincialOrdtcAmount * extractConfig.provincial_ordtc)/100).toFixed(1)) || 0.00
        federalItcAmountAfterORDTC = parseFloat(Number(totalProvincialOrdtcAmount - totalOrdtcClaimed).toFixed(1)) || 0.00
        federalItcCreditsAfterORDTC = parseFloat(Number((federalItcAmountAfterORDTC * extractConfig.federal_itc_percent)/100).toFixed(1)) || 0.00
        federalItcAmountNoORDTC = totalProvincialOrdtcAmount;
        federalItcCreditsNoORDTC = parseFloat(Number((federalItcAmountNoORDTC * extractConfig.federal_itc_percent)/100).toFixed(1)) || 0.00
        totalCreditWithORDTC = parseFloat(Number(totalProvincialOitcAmount + totalOrdtcClaimed + federalItcCreditsAfterORDTC).toFixed(1)) || 0.00;
        totalCreditWithNoORDTC = parseFloat(Number(totalProvincialOitcAmount + federalItcCreditsNoORDTC).toFixed(1)) || 0.00;
        totalNetQrePercent = parseFloat(Number((totalQre/totalCost) * 100).toFixed(2)) || 0.00;

        const finalData = {
            Title : {
                "Fiscal Year" : `${countryInfo.accountName}-FY-${caseDetails.fiscal_year - 1}-${caseDetails.fiscal_year}`,
                "Descriptions" : "R&D Assessment Workbook"
            },
            Columns : [
                "Project Credit Summary",
                "Project Code",
                "Total Hours",
                "Project Total Cost",
                "FTE Cost",
                "SubCon Cost",
                "Other Cost",
                "Total Cost",
                "Net QRE %",
                "FTE QRE Adjustment",
                "Subcon QRE Adjustment",
                "FTE QRE",
                fteProxyPercent,
                "Subcon QRE",
                contractorsAmt,
                "QRE",
                "Provincial OITC %",
                "Provincial OITC Amount",
                "Provincial ORDTC Amount",
                "Provincial ORDTC %",
                "ORDTC Claimed",
                "Federal ITC Amount after ORDTC",
                "Federal ITC %",
                "Federal ITC Credits after ORDTC",
                "Federal ITC Amount (No ORDTC)",
                "Federal ITC Percent",
                "Federal ITC Credits (No ORDTC)",
                "TOTAL Credit with ORDTC",
                "TOTAL Credit with No ORDTC"
            ],
            "Total" : {
               "Project Code" : "-",
                "Project Name" : "-",
                "Total Hours" : JSON.stringify(totalHours),
                "Project Total Cost" : Math.round(totalCost),
                "FTE Cost" : Math.round(totalFteCost),
                "SubCon Cost" : Math.round(totalSubconCost),
                "Other Cost" : Math.round(totalOtherCost),
                "Total Cost" : Math.round(totalCost),
                "Net QRE %" : `${totalNetQrePercent}%`,
                "FTE QRE Adjustment" : "-",
                "Subcon QRE Adjustment" : "-",
                "FTE QRE" : Math.round(totalFteQre),
                [fteProxyPercent] : Math.round(totalfteProxy),
                "Subcon QRE" : Math.round(totalSubconQre),
                [contractorsAmt] : Math.round(totalContractorsAmount),
                "QRE" : Math.round(totalQre),
                "Provincial OITC %" : `${provincialOitcPercent}%`,
                "Provincial OITC Amount": Math.round(totalProvincialOitcAmount),
                "Provincial ORDTC Amount": Math.round(totalProvincialOrdtcAmount),
                "Provincial ORDTC %": `${totalProvincialOrdtcPercent}%`,
                "ORDTC Claimed" : Math.round(totalOrdtcClaimed),
                "Federal ITC Amount after ORDTC" : Math.round(federalItcAmountAfterORDTC),
                "Federal ITC %": `${federalItcPercent}%`,
                "Federal ITC Credits after ORDTC": Math.round(federalItcCreditsAfterORDTC),
                "Federal ITC Amount (No ORDTC)": Math.round(federalItcAmountNoORDTC),
                "Federal ITC Percent": `${federalItcPercent}%`,
                "Federal ITC Credits (No ORDTC)": Math.round(federalItcCreditsNoORDTC),
                "TOTAL Credit with ORDTC": Math.round(totalCreditWithORDTC),
                "TOTAL Credit with No ORDTC": Math.round(totalCreditWithNoORDTC)
            },
            "Projects" : calculatedNewComputedValues,
            BOLD : ["TOTAL Credit with ORDTC", "TOTAL Credit with No ORDTC", "Total Cost"]
        }
        return {
            inputFields : {
                country : this.country,
                credit_type : this.creditType,
                currency : this.currency
            },
            computedFields : finalData,
            finalCredit : Math.round(totalCreditWithORDTC)
        }
    }
}