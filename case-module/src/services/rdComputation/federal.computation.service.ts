import { QueryTypes, Sequelize } from "sequelize";
import { HttpStatus, STATUS_MESSAGE, rawQueries } from "../../utils/constants";
import { logMessage } from "../../utils/helpers";
import RDCreditSchemaService from "./schemaService";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { federalCalculators } from "../rdFederalProcessors";
import { AnnualGrossReceipt, QRE, StateRDData } from "./rdCreditTypes";
import { fetchCountryData } from "../../utils/rdFinancialWorking.rawQueries";

export class FederalComputationService {
    private rdCreditSchemaService: RDCreditSchemaService;
    private orgDbSequelize: Sequelize | null = null;
    private mainDbSequelize: Sequelize | null = null;
    
    readonly programName = "Federal R&D Credit";
    readonly jurisdictionColumn = "country_rid";

    constructor() {
        this.rdCreditSchemaService = new RDCreditSchemaService();
    }

    private async getOrgDb() {
        if (!this.orgDbSequelize) {
            this.orgDbSequelize = await initOrgSequelize();
        }
        return this.orgDbSequelize;
    }

    private async getMainDb() {
        if (!this.mainDbSequelize) {
            this.mainDbSequelize = await initMainDbSequelize();
        }
        return this.mainDbSequelize;
    }

    /**
     * Runs the federal RD credit computation for USA.
     * @param accountRid 
     * @param caseRid 
     * @param effectiveStart 
     * @param effectiveEnd 
     * @returns 
     */
    async runFederalComputation(accountRid: string, caseRid: string, effectiveStart: string, effectiveEnd: string) {
        try {
            const mainDb = await this.getMainDb();
            const orgDb = await this.getOrgDb();
            const fetchParentAccountRnumber: any = await mainDb.query(
                await rawQueries.fetchParentAccount(accountRid, mainDb)
            );
            let schemaName = rawQueries.fetchSchemaName(
                fetchParentAccountRnumber[0][0].r_number
            );
            const currentFiscalYear = this.getCurrentFiscalYear();
            const countryInfo = await this.rdCreditSchemaService.getCountryByAccountRid(accountRid, mainDb);
            logMessage(`Country Info: ${JSON.stringify(countryInfo)}`);
            if(countryInfo.countryCode == "USA") {
                const currentYearQREs = await this.rdCreditSchemaService.getCurrentYearQREsForFederal(caseRid, countryInfo.rid, schemaName, orgDb); //current yer QREs
                logMessage(`CurrentYearQREs: ${JSON.stringify(currentYearQREs)}`);
                const prior3YearsQREs = await this.rdCreditSchemaService.getPrior3YearQREs(accountRid, this.jurisdictionColumn, countryInfo.rid, 3, schemaName, currentFiscalYear, orgDb);// prior 3 years QREs
                logMessage(`Total Prior 3 Years QREs: ${JSON.stringify(prior3YearsQREs)}`);
                const annualGrossReceipts = await this.rdCreditSchemaService.getAnnualGrossReceipts(accountRid, this.jurisdictionColumn, countryInfo.rid, 4, schemaName, orgDb); // prior 4 years gross receipts
                const federalRDData = await this.getFederalRDData(currentYearQREs, prior3YearsQREs, annualGrossReceipts);
                const config = await this.rdCreditSchemaService.getRDCreditConfig(countryInfo.countryCode, mainDb, effectiveStart, effectiveEnd, "", this.programName);
                const extractConfig = this.extractConfigJson(config.config_json);
                const federalComputation = federalCalculators[countryInfo.countryCode];
                if (federalComputation) {
                const result = await federalComputation.compute(extractConfig, federalRDData);
                await this.rdCreditSchemaService.insertRDCreditCalculation(fetchParentAccountRnumber[0][0].r_number, caseRid, config.country_rid, result.inputFields, result.computedFields);
                return {
                    statusCode: HttpStatus.SUCCESS,
                    message: STATUS_MESSAGE.rdCreditPreviewSuccess || "RD credit calculation processed successfully",
                    data: result,
                };
            }
            } else if(countryInfo.countryCode === 'GBR') {
                const [caseDetails] : any = await orgDb.query(rawQueries.fetchCaseById(schemaName), {replacements : {caseId : caseRid}, type : QueryTypes.SELECT})
                const config = await this.rdCreditSchemaService.getRDCreditConfig(countryInfo.countryCode, mainDb, effectiveStart, effectiveEnd, "", this.programName);
                const extractConfig = this.extractConfigJson(config.config_json);
                const federalComputation = federalCalculators[countryInfo.countryCode];
                if(federalComputation) {
                    const result = await federalComputation.computeForUk(caseRid, accountRid, schemaName, extractConfig);
                    if(result.computedFields[0].projects !== null) {
                        let totalEmployees = 0.00
                        let totalEpw = 0.00
                        let totalReduction = 0.00
                        let totalNetEpw = 0.00
                        result.computedFields[0].projects.forEach((d : any) => {
                            totalEmployees = Number((totalEmployees + d.employees).toFixed(2)) || 0.00
                            totalEpw = Number((totalEpw + d.epw).toFixed(2)) || 0.00
                            totalReduction = Number((totalReduction + d.reductions).toFixed(2)) || 0.00
                            totalNetEpw = Number((totalNetEpw + d.net_epw).toFixed(2)) || 0.00
                        });
                        const totalProjectValue = Number((totalNetEpw + totalEmployees).toFixed(2)) || 0.00
                        const materialSoftwareCost = Number(caseDetails?.material_software_cost) || 0.00
                        const heatLightPower = Number(caseDetails?.heat_light_power) || 0.00
                        const totalSalaryAndExpenses = (totalProjectValue + materialSoftwareCost + heatLightPower) || 0.00 
                        const employersPensionContributions = Number(caseDetails?.employers_pension_contribution) || 0.00
                        const qualifyingRdc = parseFloat(Number(totalSalaryAndExpenses + employersPensionContributions).toFixed(2)) || 0.00
                        const grossReduction = Number(((qualifyingRdc * extractConfig.gross_rdec)/100).toFixed(2)) || 0.00
                        const subContracts = Number(caseDetails?.sub_contracts) || 0.00
                        const otherCost = Number(caseDetails?.other) || 0.00
                        let reductionValue = `Reductions (${extractConfig.reduction}%)`
                        let grossReductionValue = `GROSS RDEC @ ${extractConfig.gross_rdec}%`
                        const minProjectResult = this.selectMinimumProjectsCost(qualifyingRdc, 0.5, result.computedFields[0].projects);
                        let projectsMoreOfQre50Percent;
                        let totalProjectSharedWithHmrc = 0.00;
                        let finalPercentage = parseFloat(Number((minProjectResult.selectedSum/qualifyingRdc) * 100).toFixed(2)) === Infinity ? '0.00%' : `${parseFloat(Number((minProjectResult.selectedSum/qualifyingRdc) * 100).toFixed(2))}%`
                        let dynamicKeyNameForTotalCount : string;
                        
                        if(result.computedFields[0].projects.length === 7) {
                            dynamicKeyNameForTotalCount = `Total Projects`
                            projectsMoreOfQre50Percent = result.computedFields[0].projects.map((p : any) => {
                                return {
                                    "Project Name": p.project_name,
                                    "Total Project Value/Labor" : p.total_project_value_labor,
                                }
                            })
                            projectsMoreOfQre50Percent.forEach((f : any) => {
                                totalProjectSharedWithHmrc += f["Total Project Value/Labor"]
                            })
                        } else {
                            dynamicKeyNameForTotalCount = `Total Customer Groups`
                            projectsMoreOfQre50Percent = minProjectResult.selectedProjects.map((p : any, index : number) => {
                                return {
                                    "Project Name": p.project_name,
                                    "Total Project Value/Labor" : p.total_project_value_labor
                                }
                            })
                            projectsMoreOfQre50Percent.forEach((f : any) => {
                                totalProjectSharedWithHmrc += f["Total Project Value/Labor"]
                            })
                        }
                        const saveData = {
                        Title : {
                            "Account ID" : accountRid,
                            "Account Name" : countryInfo.accountName,
                            "Description": "Summary of SR&ED Expenditures",
                            "Fiscal Year" : `04/01/${caseDetails?.fiscal_year - 1} - 03/31/${caseDetails?.fiscal_year}`
                        },
                        Columns : [
                            "Project Credit Summary","Employees","Total Projects","LABOUR", "EPW", reductionValue, 
                            "Net EPW", "Total Project Value/Labor", "Materials/Software", "Subcontracts",
                            "Heat Light Power", "Other", "Total Salary + EPW Expenses", "Total Employers Pension Contribution NIC",
                            "Total Qualifying RDEC", grossReductionValue, "Total Final R&D Claim Credit"
                        ],
                        Total : {
                            "LABOUR" : 0,
                            "Employees" : totalEmployees,
                            "EPW" : totalEpw,
                            [reductionValue] : totalReduction,
                            "Net EPW" : totalNetEpw,
                            "Total Project Value/Labor" : totalProjectValue,
                            "Materials/Software": materialSoftwareCost,
                            "Subcontracts": subContracts,
                            "Heat Light Power": heatLightPower,
                            "Other": otherCost,
                            "Total Salary + EPW Expenses": totalSalaryAndExpenses,
                            "Total Employers Pension Contribution NIC": employersPensionContributions,
                            "Total Qualifying RDEC": qualifyingRdc,
                            [grossReductionValue] : `${extractConfig.gross_rdec}%`,
                            "Total Final R&D Claim Credit" : grossReduction
                        },
                        Projects : result.computedFields[0].projects.map((d: any) => {
                            return {
                                "Project Name": d.project_client_group || d.project_name,
                                "Total Projects" : d.total_projects_count || 0,
                                "Employees" : d.employees,
                                "EPW" : d.epw,
                                [reductionValue] : d.reductions,
                                "Net EPW" : d.net_epw,
                                "Total Project Value/Labor" : d.total_project_value_labor,
                                is_qualified : minProjectResult.selectedProjects.some((t) => t.project_client_group === d.project_client_group)
                            }
                        }),
                        "Percentage Calculation": {
                            [dynamicKeyNameForTotalCount] : result.computedFields[0].projects.length || 0,
                            "Total QRE" : qualifyingRdc,
                            "Total value of customer groups Greater than 50%" : minProjectResult.selectedSum == Infinity ? 0.00 : minProjectResult.selectedSum,
                            "%" : finalPercentage
                        },
                        "Technical Submissions by Cost that are 50% or more of Total QRE" : projectsMoreOfQre50Percent,
                        "Total Project to be shared with HMRC" : {
                            "Total" : totalProjectSharedWithHmrc
                        },
                        BOLD : ["Total Project Value/Labor","LABOUR", "Total Salary + EPW Expenses", 
                            "Technical Submissions by Cost that are 50% or more of Total QRE"
                        ]
                    }
                        await this.rdCreditSchemaService.insertRDCreditCalculation(fetchParentAccountRnumber[0][0].r_number, caseRid, config.country_rid, result.inputFields, saveData); 
                        return {
                            statusCode : HttpStatus.SUCCESS,
                            statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
                            statusMessage : STATUS_MESSAGE.rdCreditPreviewSuccess || "RD credit calculation processed successfully",
                            data : saveData
                        };
                    }
                }
            } else if (countryInfo.countryCode === "IRL") {
                const [caseDetails] : any = await orgDb.query(rawQueries.fetchCaseById(schemaName), {replacements : {caseId : caseRid}, type : QueryTypes.SELECT})
                const config = await this.rdCreditSchemaService.getRDCreditConfig(countryInfo.countryCode, mainDb, effectiveStart, effectiveEnd, "", this.programName);
                const extractConfig = this.extractConfigJson(config.config_json);
                const federalComputation = federalCalculators[countryInfo.countryCode];
                if(federalComputation) {
                    let totalEmployeesCost = 0.00;
                    let totalEpwCost = 0.00;
                    let totalReductionCost = 0.00;
                    let totalNetEpw = 0.00;
                    let unpaidAmountPaid = Number(caseDetails?.unpaid_amounts_paid) || 0.00
                    let paidAmount = Number(caseDetails?.unpaid_amounts) || 0.00
                    let cloudSoftwareCost = Number(caseDetails?.cloud_software) || 0.00
                    let subContracts = Number(caseDetails?.sub_contracts) || 0.00
                    let heatLightPower = Number(caseDetails?.heat_light_power) || 0.00
                    let otherCost = Number(caseDetails?.other) || 0.00
                    let calculatedPaidUnpaidAmount = paidAmount - unpaidAmountPaid
                    const computedResult = await federalComputation.computeForIRL(caseRid, accountRid, schemaName, extractConfig);
                    if(computedResult.computedFields[0].projects !== null) {
                        const uniqueCurrencyId = [...new Set(computedResult.computedFields[0].projects.map((d: any) => d.currency_rid))];
                        let getCurrency : any
                        let mapCurrency;
                        if(uniqueCurrencyId.length > 0) {
                            getCurrency = await mainDb.query(rawQueries.fetchCurrencies(uniqueCurrencyId))
                        } else {
                            getCurrency = []
                        }
                        mapCurrency = new Map(getCurrency[0].map((d : any) => [d.rid, d.currency_symbol]))
                        computedResult.computedFields[0].projects.forEach((data : any) => {
                            totalEmployeesCost = totalEmployeesCost + data.employees
                            totalEpwCost = totalEpwCost + data.epw
                            totalNetEpw = totalNetEpw + data.net_epw
                        })
                        totalReductionCost = totalEpwCost * extractConfig.reduction
                        let totalLabour = totalEmployeesCost + totalNetEpw + calculatedPaidUnpaidAmount 
                        let totalQRE = totalLabour + cloudSoftwareCost + subContracts + heatLightPower + otherCost
                        let researchDevelopmentTaxCredit = Number((totalQRE * extractConfig.research_development_tax_credit)/100).toFixed(2);
                        let dynamicReductionKey = `Reductions (${extractConfig.reduction}%)`
                        let dynamicRdCredit = `Research and Development (R&D) Corporation Tax credit @${extractConfig.research_development_tax_credit}%`
                        const finalData = {
                            Title : {
                                    "Account ID" : accountRid,
                                    "Account Name" : countryInfo.accountName,
                                    "Description": "Summary of R&D Expenditures",
                                    "Expleo" : `FY-${caseDetails?.fiscal_year}`
                                },
                            Columns : [
                                "Project Credit Summary", "LABOUR","Employees", "EPW", `Reductions (${extractConfig.reduction}%)`, "Net EPW", "Unpaid amounts (+)", "Unpaid amounts (-)", 
                                "Total Labour", "Cloud Software", "Subcontracts", "Heat Light Power", "Other", "Total QRE", `Research and Development (R&D) Corporation Tax credit @${extractConfig.research_development_tax_credit}%`
                            ],
                            Total : {
                                "LABOUR" : 0,
                                Employees : totalEmployeesCost,
                                EPW : totalEpwCost,
                                [dynamicReductionKey] : totalReductionCost,
                                "Net EPW" : totalNetEpw,
                                "Unpaid amounts (+)" : unpaidAmountPaid,
                                "Unpaid amounts (-)" : paidAmount,
                                "Total Labour" : totalLabour,
                                "Cloud Software" : cloudSoftwareCost,
                                Subcontracts : subContracts,
                                "Heat Light Power" : heatLightPower,
                                Other : otherCost,
                                "Total QRE": totalQRE,
                                [dynamicRdCredit]: parseFloat(researchDevelopmentTaxCredit)
                            },
                            Projects : computedResult.computedFields[0].projects.map((d : any) => {
                                return {
                                    "Project ID": d.project_fiscal_rid,
                                    "Project Name": d.project_name,
                                    "Currency Symbol": mapCurrency.get(d.currency_rid) || null,
                                    "Employees" : d.employees,
                                    "EPW" : d.epw,
                                    [dynamicReductionKey] : d.reductions,
                                    "Net EPW" : d.net_epw,
                                    "Total Labour" : d.total_project_value_labor,
                                }
                            }),
                            "BOLD" : ["Total Labour", "LABOUR", "Total QRE", dynamicRdCredit]
                        } 
                        await this.rdCreditSchemaService.insertRDCreditCalculation(fetchParentAccountRnumber[0][0].r_number, caseRid, config.country_rid, computedResult.inputFields, finalData); 
                        return {
                            statusCode : HttpStatus.SUCCESS,
                            statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
                            statusMessage : STATUS_MESSAGE.rdCreditPreviewSuccess || "RD credit calculation processed successfully",
                            data : finalData
                        };                       
                    }
                }                
            } else if (countryInfo.countryCode === "AUS") {
                const [caseDetails] : any = await orgDb.query(rawQueries.fetchCaseById(schemaName), {replacements : {caseId : caseRid}, type : QueryTypes.SELECT})
                const config = await this.rdCreditSchemaService.getRDCreditConfig(countryInfo.countryCode, mainDb, effectiveStart, effectiveEnd, "", this.programName);
                const extractConfig = this.extractConfigJson(config.config_json);
                const federalComputation = federalCalculators[countryInfo.countryCode];
                if(federalComputation) {
                    const result = await federalComputation.computeForAus(caseRid, accountRid, schemaName, extractConfig, caseDetails, countryInfo);
                    await this.rdCreditSchemaService.insertRDCreditCalculation(fetchParentAccountRnumber[0][0].r_number, caseRid, config.country_rid, result.inputFields, result.computedFields); 
                    return {
                        statusCode : HttpStatus.SUCCESS,
                        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
                        statusMessage : STATUS_MESSAGE.rdCreditPreviewSuccess || "RD credit calculation processed successfully",
                        data : result
                    };
                }
            } else if (countryInfo.countryCode === "CAN") {
                const [caseDetails] : any = await orgDb.query(rawQueries.fetchCaseById(schemaName), {replacements : {caseId : caseRid}, type : QueryTypes.SELECT})
                const config = await this.rdCreditSchemaService.getRDCreditConfig(countryInfo.countryCode, mainDb, effectiveStart, effectiveEnd, "", this.programName);
                const extractConfig = this.extractConfigJson(config.config_json);
                const federalComputation = federalCalculators[countryInfo.countryCode];
                if(federalComputation) {
                    const result = await federalComputation.computeForCanada(caseRid, accountRid, schemaName, extractConfig, caseDetails);
                    await this.rdCreditSchemaService.insertRDCreditCalculation(fetchParentAccountRnumber[0][0].r_number, caseRid, config.country_rid, result.inputFields, result.computedFields); 
                    return {
                        statusCode : HttpStatus.SUCCESS,
                        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
                        statusMessage : STATUS_MESSAGE.rdCreditPreviewSuccess || "RD credit calculation processed successfully",
                        data : result
                    };
                }
            }
            return {
                statusCode: HttpStatus.FAILED,
                message: "RD credit calculation processed failed",
                data: {},
            };

        } catch (error) {
            logMessage(`Error fetching RD Credit : ${error}`);

            return {
                statusCode: HttpStatus.FAILED,
                message: HttpStatus.FAILED_MESSAGE,
                errorMessage: STATUS_MESSAGE.jurisdictionFetchedFailed || "Failed to fetch",
            };
        }

    }

    /**
     * Gets the federal RD data structure.
     * @param currentYearQREs 
     * @param prior3YearsQREs 
     * @param annualGrossReceipts 
     * @returns 
     */
    async getFederalRDData(currentYearQREs: QRE, prior3YearsQREs: QRE[], annualGrossReceipts: AnnualGrossReceipt[]): Promise<StateRDData> {
        return {
            currentYearQREs,
            prior3YearsQREs,
            annualGrossReceipts
        }
    }

    /**
     * Get current fiscal year based on date.
     * @param date 
     * @returns 
     */
    getCurrentFiscalYear(date: Date = new Date()): number {
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 1-12

        // Fiscal year starts in April
        return month >= 4 ? year : year - 1;
    }

    /**
     * Extracts and parses the config_json field.
     * @param configJson 
     * @returns 
     */
    extractConfigJson(configJson: any) {
        // If it's already an object, just return it
        if (typeof configJson === 'object') {
            return configJson;
        }

        // If it's a string, parse it
        try {
            return JSON.parse(configJson);
        } catch (error) {
            console.error('Failed to parse config_json:', error);
            return {}; // fallback
        }
    }
    async fetchFederalCalculatedData (data : any) {
        const mainDb = await this.getMainDb();
        const orgDb = await this.getOrgDb();
        const fetchParentAccountRnumber: any = await mainDb.query(
            await rawQueries.fetchParentAccount(data.account_rid, mainDb)
        );
        let schemaName = rawQueries.fetchSchemaName(
            fetchParentAccountRnumber[0][0].r_number
        ); 
        const [result] : any= await orgDb.query(fetchCountryData(schemaName, data.case_rid));
        if(result.length > 0) {
            const fetchCountryDetails : any = await mainDb.query(rawQueries.getCountryDetails(result[0].country_rid));
            if(fetchCountryDetails[0][0].country_code === 'AUS') {
                const finalAusData = result.map((d : any) => {
                    return {
                    ...d,
                    computed_fields : {
                        "Title" : {
                            "Account ID" : d.computed_fields["Title"]["Account ID"],
                            "Account Name": d.computed_fields["Title"]["Account Name"],
                            "Description" : d.computed_fields["Title"]["Description"],
                            "Fiscal Year" : d.computed_fields["Title"]["Fiscal Year"]
                        },
                        "Preliminary Calculation" : d.computed_fields["Preliminary Calculation"],
                        "R&D Expenditure" : {
                            'R&D expenditure - Contract expenditure (not RSP)' : d.computed_fields["R&D Expenditure"]["R&D expenditure - Contract expenditure (not RSP)"],
                            'R&D expenditure - Salary expenditure' : d.computed_fields["R&D Expenditure"]['R&D expenditure - Salary expenditure'],
                            'Total of allocated notional deductions': d.computed_fields["R&D Expenditure"]['Total of allocated notional deductions'],
                            'Total of notional R&D deductions (X plus Y)':d.computed_fields["R&D Expenditure"]['Total of notional R&D deductions (X plus Y)']
                        },
                        "Additional Information" : d.computed_fields["Additional Information"],
                        "Non-refundable tax offset": {
                           'R&D entity total expenses' : d.computed_fields["Non-refundable tax offset"]['R&D entity total expenses'],
                           'Total notional R&D deductions': d.computed_fields["Non-refundable tax offset"]['Total notional R&D deductions'],
                           'R&D intensity' : d.computed_fields["Non-refundable tax offset"]['R&D intensity']
                        },
                        "Tier of intensity" : d.computed_fields["Tier of intensity"],
                        "Non-refundable R&D tax offset" : d.computed_fields["Non-refundable R&D tax offset"]
                        }
                    }
                })
                return finalAusData[0]
            } else if(fetchCountryDetails[0][0].country_code === "GBR") {
                const finalUkData = result.map((u : any) => {
                    return {
                        ...u,
                        computed_fields : {
                            "Title" : u.computed_fields["Title"],
                            "Total" : u.computed_fields["Total"],
                            "Columns" : u.computed_fields["Columns"],
                            "Projects" : u.computed_fields["Projects"],
                            "Technical Submissions by Cost that are 50% or more of Total QRE":u.computed_fields["Technical Submissions by Cost that are 50% or more of Total QRE"],
                            "Total Project to be shared with HMRC" : u.computed_fields["Total Project to be shared with HMRC"],
                            "Percentage Calculation": {
                                "Total Customer Groups" : u.computed_fields["Percentage Calculation"]["Total Customer Groups"],
                                "Total QRE" : u.computed_fields["Percentage Calculation"]["Total QRE"],
                                "Total value of customer groups Greater than 50%" : u.computed_fields["Percentage Calculation"]["Total value of customer groups Greater than 50%"],
                                "%" : u.computed_fields["Percentage Calculation"]["%"]
                            }
                        }
                    }
                })
                return finalUkData[0];
            } else if(fetchCountryDetails[0][0].country_code === "USA") {
                const finalUSAData = result.map((u : any) => {
                    let creditRRC = u["computed_fields"]["Regular Credit"]["creditRRC"]
                    let creditASC = u["computed_fields"]["ASC Credit"]["creditASC"]
                    let creditASCKey = Object.keys(creditASC).find((v : string) => v.startsWith("Enter"))
                    
                    return {
                        ...u,
                        "computed_fields" : {
                            "Regular Credit" : {
                                "creditRRC" : {
                                    "5 Total Qualified Research Expenses" : creditRRC["5 Total Qualified Research Expenses"],
                                    "6 Fixed-base percentage" : creditRRC["6 Fixed-base percentage"],
                                    "7 Average Annual Gross Receipts" : creditRRC["7 Average Annual Gross Receipts"],
                                    "8 Multiply line 7 by percentage on line 6" : creditRRC["8 Multiply line 7 by percentage on line 6"],
                                    "9 Subtract line 8 from line 5" : creditRRC["9 Subtract line 8 from line 5"],
                                    "10 Multiply line 5 by 10" : creditRRC["10 Multiply line 5 by 10"],
                                    "11 Enter smaller of line 9 or line 10" : creditRRC["11 Enter smaller of line 9 or line 10"]
                                },
                                "rrc280C" : u["computed_fields"]["Regular Credit"]["rrc280C"]
                            },
                            "ASC Credit" : {
                                "creditASC": {
                                    "20 Total Qualified Research Expenses" : creditASC["20 Total Qualified Research Expenses"],
                                    "21 Total QREs for prior 3 tax years" : creditASC["21 Total QREs for prior 3 tax years"],
                                    "22 Divide line 21 by 6.0" : creditASC["22 Divide line 21 by 6.0"],
                                    "23 Subtract line 22 from line 20" : creditASC["23 Subtract line 22 from line 20"],
                                    [creditASCKey!] : creditASC[creditASCKey!],
                                    "24 Multiply line 23 by the percentage above" : creditASC["24 Multiply line 23 by the percentage above"],
                                    "25 Add lines 19 and 24": creditASC["25 Add lines 19 and 24"],
                                },
                                "asc280C": u["computed_fields"]["ASC Credit"]["asc280C"]
                            },
                            "Research and Development Tax Credit": u["computed_fields"]['Research and Development Tax Credit']
                        }
                    }
                })
                return finalUSAData[0];
            }
            else {
                return result[0]
            }
        }
    }
    
    selectMinimumProjectsCost(totalCost : number, percentage : number, projects : any) {
        const threshold = totalCost * percentage;
        projects.sort((a : any, b : any) => {return b.total_project_value_labor - a.total_project_value_labor});
        let bestSum = Infinity;
        let bestCombination : any[] = [];

        function choosebestComboCost(index : number, currentSum : number, currenctCombo : any) {
            if(currentSum >= bestSum) return;
            if(currentSum >= threshold) {
                bestSum = currentSum;
                bestCombination = [...currenctCombo];
                return;
            }
            if(index === projects.length) return;

            choosebestComboCost(index + 1, currentSum + projects[index].total_project_value_labor, [...currenctCombo, projects[index]]);
            choosebestComboCost(index + 1, currentSum, currenctCombo)
        }
        choosebestComboCost(0, 0, []);
        return {
            selectedProjects : bestCombination,
            selectedSum : bestSum
        }
    }
}
export default FederalComputationService;