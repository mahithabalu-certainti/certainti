import { QueryTypes, Sequelize, Op } from "sequelize";
import { CaseModelService } from "../caseModelsService";
import { logMessage } from "../../utils/helpers";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { MAIN_SCHEMA_NAME, rawQueries } from "../../utils/constants";
import { QRE, AnnualGrossReceipt } from "./rdCreditTypes";
import { fetchAvailableConfigLevelQuery, fetchRdCreditConfigQuery, fetchRdCreditConfigStateLevelQuery } from "../../utils/rawQueries";

/**
 * Schema Service for Financial RD Credit
 */
class RDCreditSchemaService {
    private caseModelService: CaseModelService;
    private orgDbSequelize: Sequelize | null = null;
    private mainDbSequelize: Sequelize | null = null;

    constructor() {
        this.caseModelService = new CaseModelService();
    }

    /**
     * Fetches country, region, and account metadata for the given account RID.
     * @param accountRid Unique account record identifier (RID) used to look up country information.
     * @param mainDbSequelize Sequelize instance connected to the main database.
     * @returns An object containing country, region, and account details for the specified account.
     */
    async getCountryByAccountRid(accountRid: string, mainDbSequelize: Sequelize) {
        try {
            if (!this.mainDbSequelize) {
                this.mainDbSequelize = await initMainDbSequelize();
            }

            const [data]: any[] = await this.mainDbSequelize.query(
                `
                    SELECT 
                        ctry.rid,
                        ctry.country_code,
                        ctry.country_name,
                        st.state_name AS region_name,
                        acc.account_name
                    FROM ${MAIN_SCHEMA_NAME}.account acc
                    JOIN ${MAIN_SCHEMA_NAME}.country ctry 
                        ON acc.country_rid = ctry.rid
                    LEFT JOIN ${MAIN_SCHEMA_NAME}.state st
                        ON acc.region_rid = st.rid    
                    WHERE acc.rid = :accountRid
                    LIMIT 1
                `,
                {
                    replacements: { accountRid },
                    type: QueryTypes.SELECT,
                }
            );

            return {
                rid: data?.rid || null,
                countryCode: data?.country_code || null,
                countryName: data?.country_name || null,
                regionName: data?.region_name || null,
                accountName: data?.account_name || null
            };
        } catch (err) {
            logMessage(`Error fetching account: ${err}`);
            throw new Error("Error fetching account : " + (err as Error).message);
        }
    }

    /**
     * Get current year QREs by caseRid and regionRid
     * @param caseRid 
     * @param schemaName 
     * @param orgDbSequelize 
     * @returns 
     */
    async getCurrentYearQREsForState(caseRid: string, regionRid: string, schemaName: string, orgDbSequelize: Sequelize, currentFiscalYear: any): Promise<QRE> {
        try {
            if (!this.orgDbSequelize) {
                this.orgDbSequelize = await initOrgSequelize();
            }

            const [data]: any[] = await this.orgDbSequelize.query(
                `
                    SELECT 
                        CAST(SUM((cpr.total_cost_fte_from_prj_res * pf.rd_percent_final)/100) AS DECIMAL(18,2)) AS total_wages,
                        CAST(SUM((cpr.total_cost_nonlabor_from_prj_res * pf.rd_percent_final)/100) AS DECIMAL(18,2))  AS total_supplies,
                        CAST(SUM((cpr.total_cost_subcon_from_prj_res * pf.rd_percent_final)/100) AS DECIMAL(18,2)) AS total_contract,
                        cs.tax_liability_sc as business_tax_liability_sc, 
                        cs.tax_liability_ct as business_tax_liability_ct,
                        cs.tax_liability_ga as business_tax_liability_ga
                    FROM ${schemaName}.cases cs
                    JOIN ${schemaName}.case_projects cp on cp.case_rid = cs.rid
                    JOIN ${schemaName}.project_fiscal pf ON cp.project_fiscal_rid = pf.rid
                    JOIN ${schemaName}.project_fiscal_region cpr ON cpr.project_fiscal_rid = pf.rid
                    WHERE cs.rid = :caseRid AND cs.fiscal_year = :currentFiscalYear AND cpr.region_rid = :regionRid AND pf.is_qualified = true
                    GROUP BY 
                    cs.tax_liability_sc,
                    cs.tax_liability_ct,
                    cs.tax_liability_ga
                `,
                {
                    replacements: { caseRid, regionRid, currentFiscalYear },
                    type: QueryTypes.SELECT,
                }
            );

            return {
                wages: Number(data?.total_wages || 0),
                supplies: Number(data?.total_supplies || 0),
                contract: Number(data?.total_contract || 0),
                business_tax_liability_sc: Number(data?.business_tax_liability_sc || 0),
                business_tax_liability_ct: Number(data?.business_tax_liability_ct || 0),
                business_tax_liability_ga: Number(data?.business_tax_liability_ga || 0)
            };
        } catch (err) {
            logMessage(`Error fetching account: ${err}`);
            throw new Error("Error fetching account : " + (err as Error).message);
        }
    }

    /**
     * Get current year QREs by caseRid and countryRid
     * @param caseRid 
     * @param countryRid 
     * @param schemaName 
     * @param orgDbSequelize 
     * @returns 
     */
    async getCurrentYearQREsForFederal(caseRid: string, countryRid: string, schemaName: string, orgDbSequelize: Sequelize, caseClosed : boolean): Promise<QRE> {
        try {
            if (!this.orgDbSequelize) {
                this.orgDbSequelize = await initOrgSequelize();
            }
            let alias : string;
            alias = caseClosed ? 'cp' : 'pf'
            const [data]: any[] = await this.orgDbSequelize.query(
                `
                    SELECT 
                        CAST(SUM((${alias}.total_cost_fte_prj * ${alias}.rd_percent_final)/100) AS DECIMAL(18,2)) AS total_wages,
                        CAST(SUM((${alias}.total_cost_nonlabor_prj * ${alias}.rd_percent_final)/100) AS DECIMAL(18,2)) AS total_supplies,
                        CAST(SUM((${alias}.total_cost_subcon_prj * ${alias}.rd_percent_final)/100) AS DECIMAL(18,2)) AS total_contract,
                        cs.tax_liability_sc as business_tax_liability_sc, 
                        cs.tax_liability_ct as business_tax_liability_ct,
                        cs.tax_liability_ga as business_tax_liability_ga
                    FROM ${schemaName}.case_projects cp
                    JOIN ${schemaName}.project_fiscal pf
                        ON cp.project_fiscal_rid = pf.rid
                    JOIN ${schemaName}.cases cs ON cs.rid = cp.case_rid
                    WHERE cp.case_rid = :caseRid AND cs.fiscal_year = pf.fiscal_year AND pf.country_rid = :countryRid AND pf.is_qualified = true
                    GROUP BY 
                    cs.tax_liability_sc,
                    cs.tax_liability_ct,
                    cs.tax_liability_ga
                `,
                {
                    replacements: { caseRid, countryRid },
                    type: QueryTypes.SELECT,
                }
            );


            return {
                wages: Number(data?.total_wages || 0),
                supplies: Number(data?.total_supplies || 0),
                contract: Number(data?.total_contract || 0),
                business_tax_liability_sc: Number(data?.business_tax_liability_sc || 0),
                business_tax_liability_ct: Number(data?.business_tax_liability_ct || 0),
                business_tax_liability_ga: Number(data?.business_tax_liability_ga || 0)
            };
        } catch (err) {
            logMessage(`Error fetching account: ${err}`);
            throw new Error("Error fetching account : " + (err as Error).message);
        }
    }

    /**
     * Get annual gross receipts by accountRid
     * @param accountRid 
     * @param prior 
     * @param schemaName 
     * @param jurisdictionColumn //  "country_rid" or "state_rid"
     * @param jurisdictionRid // countryRid or stateRid
     * @param orgDbSequelize 
     * @returns 
     */
    async getAnnualGrossReceipts(accountRid: string, jurisdictionColumn: string, jurisdictionRid: string, prior: number, schemaName: string, orgDbSequelize: Sequelize): Promise<AnnualGrossReceipt[]> {
        try {
            if (!this.orgDbSequelize) {
                this.orgDbSequelize = await initOrgSequelize();
            }

            const result: any[] = await this.orgDbSequelize.query(
                `
                SELECT 
                    fiscal_year,
                    SUM(annual_gross_receipts) AS total_gross_receipts
                FROM ${schemaName}.case_history_submission
                WHERE account_rid = :accountRid AND ${jurisdictionColumn} = :jurisdictionRid
                GROUP BY fiscal_year
                ORDER BY fiscal_year DESC
                LIMIT :prior
            `,
                {
                    replacements: { accountRid, prior, jurisdictionRid },
                    type: QueryTypes.SELECT,
                }
            );

            return result.map(r => ({
                fiscalYear: r.fiscal_year,
                grossReceipts: Number(r.total_gross_receipts || 0)
            }));
        } catch (err) {
            logMessage(`Error fetching gross receipts: ${err}`);
            throw new Error("Error fetching gross receipts: " + (err as Error).message);
        }
    }

    async getAnnualGrossReceiptsForFederal(accountRid: string, jurisdictionColumn: string, jurisdictionRid: string, prior: number, schemaName: string, orgDbSequelize: Sequelize): Promise<AnnualGrossReceipt[]> {
        try {
            if (!this.orgDbSequelize) {
                this.orgDbSequelize = await initOrgSequelize();
            }

            const result: any[] = await this.orgDbSequelize.query(
                `
                SELECT 
                    fiscal_year,
                    SUM(annual_gross_receipts) AS total_gross_receipts
                FROM ${schemaName}.case_history_submission
                WHERE account_rid = :accountRid AND ${jurisdictionColumn} = :jurisdictionRid AND (state_rid IS NULL OR state_rid = '')
                GROUP BY fiscal_year
                ORDER BY fiscal_year DESC
                LIMIT :prior
            `,
                {
                    replacements: { accountRid, prior, jurisdictionRid },
                    type: QueryTypes.SELECT,
                }
            );

            return result.map(r => ({
                fiscalYear: r.fiscal_year,
                grossReceipts: Number(r.total_gross_receipts || 0)
            }));
        } catch (err) {
            logMessage(`Error fetching gross receipts: ${err}`);
            throw new Error("Error fetching gross receipts: " + (err as Error).message);
        }
    }


    /**
     * Get prior 3 years QREs
     * @param accountRid 
     * @param prior 
     * @param schemaName 
     * @param orgDbSequelize 
     * @returns 
     */
    async getPrior3YearQREs(accountRid: string, jurisdictionColumn: string, jurisdictionRid: string, prior: number = 3, schemaName: string, currentFiscalYear: number, orgDbSequelize: Sequelize): Promise<QRE[]> {
        try {
            if (!this.orgDbSequelize) {
                this.orgDbSequelize = await initOrgSequelize();
            }
            const result: any[] = await this.orgDbSequelize.query(
                `
                SELECT 
                    fiscal_year,
                    SUM(total_qre) AS total_qre,
                    SUM(total_fte_cost) AS total_wages,
                    SUM(total_nonlabor_cost) AS total_supplies,
                    SUM(total_subcon_cost) AS total_contract
                FROM ${schemaName}.case_history_submission
                WHERE account_rid = :accountRid AND fiscal_year < :currentFiscalYear AND ${jurisdictionColumn} = :jurisdictionRid
                GROUP BY fiscal_year
                ORDER BY fiscal_year DESC
                LIMIT :prior
            `,
                {
                    replacements: { accountRid, prior: 3, currentFiscalYear, jurisdictionRid },
                    type: QueryTypes.SELECT,
                }
            );

            return result.map(r => ({
                fiscalYear: r.fiscal_year,
                qre: Number(r.total_qre || 0),
                wages: Number(r.total_wages || 0),
                supplies: Number(r.total_supplies || 0),
                contract: Number(r.total_contract || 0)
            }));
        } catch (err) {
            logMessage(`Error fetching gross receipts: ${err}`);
            throw new Error("Error fetching gross receipts: " + (err as Error).message);
        }
    }

    async getPrior3YearQREsForFederal(accountRid: string, jurisdictionColumn: string, jurisdictionRid: string, prior: number = 3, schemaName: string, currentFiscalYear: number, orgDbSequelize: Sequelize): Promise<QRE[]> {
        try {
            if (!this.orgDbSequelize) {
                this.orgDbSequelize = await initOrgSequelize();
            }
            const result: any[] = await this.orgDbSequelize.query(
                `
                SELECT 
                    fiscal_year,
                    SUM(total_qre) AS total_qre,
                    SUM(total_fte_cost) AS total_wages,
                    SUM(total_nonlabor_cost) AS total_supplies,
                    SUM(total_subcon_cost) AS total_contract
                FROM ${schemaName}.case_history_submission
                WHERE 
                account_rid = :accountRid AND fiscal_year < :currentFiscalYear AND ${jurisdictionColumn} = :jurisdictionRid AND (state_rid IS NULL OR state_rid = '')
                GROUP BY fiscal_year
                ORDER BY fiscal_year DESC
                LIMIT :prior
            `,
                {
                    replacements: { accountRid, prior: 3, currentFiscalYear, jurisdictionRid },
                    type: QueryTypes.SELECT,
                }
            );

            return result.map(r => ({
                fiscalYear: r.fiscal_year,
                qre: Number(r.total_qre || 0),
                wages: Number(r.total_wages || 0),
                supplies: Number(r.total_supplies || 0),
                contract: Number(r.total_contract || 0)
            }));
        } catch (err) {
            logMessage(`Error fetching gross receipts: ${err}`);
            throw new Error("Error fetching gross receipts: " + (err as Error).message);
        }
    }

    /**
     * Get RD Credit Config
     * @param countryCode 
     * @param mainDbSequelize 
     * @param effectiveStart 
     * @param effectiveEnd 
     * @param regionName 
     * @param programName 
     * @returns 
     */
    async findAvailableConfigLevels(countryCode: string, mainDbSequelize: Sequelize, effectiveStart: string, effectiveEnd: string) {
        try {
            if (!this.mainDbSequelize) {
                this.mainDbSequelize = await initMainDbSequelize();
            }
            const results: any[] = await this.mainDbSequelize.query(fetchAvailableConfigLevelQuery(),
                {
                    replacements: {
                        countryCode: countryCode,
                        effectiveStart: effectiveStart || null,
                        effectiveEnd: effectiveEnd || null
                    },
                    type: QueryTypes.SELECT,
                }
            );

            const config = results?.[0] || null;
            logMessage(`Find Available Config Levels: ${JSON.stringify(config, null, 2)}`);

            const flags = results.map(r => r.is_federal);
            return flags || [];
        } catch (err) {
            logMessage(`Error fetching credit config: ${err}`);
            throw new Error("Error fetching credit config: " + (err as Error).message);
        }
    }

    /**
     * Get RD Credit Config
     * @param countryCode 
     * @param mainDbSequelize 
     * @param effectiveStart 
     * @param effectiveEnd 
     * @param regionName 
     * @param programName 
     * @returns 
     */
    async getRDCreditConfig(countryCode: string, mainDbSequelize: Sequelize, effectiveStart: string, effectiveEnd: string, regionName?: string, programName?: string) {
        try {
            if (!this.mainDbSequelize) {
                this.mainDbSequelize = await initMainDbSequelize();
            }
            const results: any[] = await this.mainDbSequelize.query(fetchRdCreditConfigQuery(),
                {
                    replacements: {
                        countryCode: countryCode,
                        regionName: regionName || null,
                        programName: programName || null,
                        effectiveStart: effectiveStart || null,
                        effectiveEnd: effectiveEnd || null
                    },
                    type: QueryTypes.SELECT,
                }
            );

            const config = results?.[0] || null;
            logMessage(`Credit config: ${JSON.stringify(config, null, 2)}`);
            return config || null;
        } catch (err) {
            logMessage(`Error fetching credit config: ${err}`);
            throw new Error("Error fetching credit config: " + (err as Error).message);
        }
    }

    /**
     * Insert RD Country Credit Calculation
     * @param accountNumber 
     * @param case_rid 
     * @param country_code 
     * @param input_params 
     * @param computed_fields 
     * @returns 
     */
    async insertRDCreditCalculation(accountNumber: string, case_rid: string, country_rid: string, input_params: any, computed_fields: any, finalCredit: number, result: any,config : JSON) {
        const { RdCreditCountryCalculations, Case } = await this.caseModelService.getModels(accountNumber);
        const [calculationEntry] = await RdCreditCountryCalculations.upsert(
            {
                case_rid,
                country_rid,
                input_params,
                computed_fields,
                final_credit: finalCredit,
                total_qre: result.totalQRE,
                average_annual_gross_receipts: result.averageAnnualGrossReceipts,
                prev_year1_qre: result.prev1yearQRE,
                prev_year2_qre: result.prev2yearQRE,
                prev_year3_qre: result.prev3yearQRE,
                total_wages: result?.totalFTE,
                total_supplies: result?.totalSubCon,
                total_subcontract: result?.totalSubCon,
                config_json: config
            },
            {
                returning: true
            });
        const { RdCreditCalculationsSummary } = await this.caseModelService.getModels(accountNumber);

        // Re-implementation with finding existing record
        const existingSummary = await RdCreditCalculationsSummary.findOne({
            where: {
                credit_calculation_rid: calculationEntry.rid,
            }
        });

        if (existingSummary) {
            await existingSummary.update({
                final_credit: finalCredit,
                modified_datetime: new Date()
            });
        } else {
            await RdCreditCalculationsSummary.create({
                credit_calculation_rid: calculationEntry.rid,
                case_rid,
                country_rid,
                state_rid: null,
                final_credit: finalCredit
            });
        }
        await Case.update({
            case_total_rd_cost : finalCredit
        }, {
            where : {
                rid : case_rid
            }
        })
        return calculationEntry;
    }

    /**
     * Insert RD State Credit Calculation
     * @param accountNumber 
     * @param case_rid 
     * @param country_code 
     * @param region_name 
     * @param input_params 
     * @param computed_fields 
     * @returns 
     */
    async insertRDStateCreditCalculation(accountNumber: string, case_rid: string, country_rid: string, state_rid: string,state_code:string, input_params: any, computed_fields: any, final_credit: number, total_qre: number, stateRdData: any,config:any, result?: any,) {
        const { RdCreditStateCalculations } = await this.caseModelService.getModels(accountNumber);
        const [calculationEntry] = await RdCreditStateCalculations.upsert(
            {
                case_rid,
                country_rid,
                input_params,
                computed_fields,
                state_rid,
                final_credit,
                total_qre: result?.totalQRE,
                average_annual_gross_receipts: result?.averageAnnualGrossReceipts,
                prev_year1_qre: (state_code === 'NJ' || state_code === 'TX') ? (result?.prev1yearQRE || 0) : (stateRdData.prior3YearsQREs[0]?.qre || 0),
                prev_year2_qre: (state_code === 'NJ' || state_code === 'TX') ? (result?.prev2yearQRE || 0) : (stateRdData.prior3YearsQREs[1]?.qre || 0),
                prev_year3_qre: (state_code === 'NJ' || state_code === 'TX') ? (result?.prev3yearQRE || 0) : (stateRdData.prior3YearsQREs[2]?.qre || 0),
                total_wages: result?.totalWages,
                total_supplies: result?.totalSupplies,
                total_subcontract: result?.totalContract,
                config_json: config
                
            },
            {
                returning: true
            });

        const { RdCreditCalculationsSummary } = await this.caseModelService.getModels(accountNumber);

        const existingSummary = await RdCreditCalculationsSummary.findOne({
            where: {
                credit_calculation_rid: calculationEntry.rid,
            }
        });

        if (existingSummary) {
            await existingSummary.update({
                final_credit: final_credit,
                modified_datetime: new Date()
            });
        } else {
            await RdCreditCalculationsSummary.create({
                credit_calculation_rid: calculationEntry.rid,
                case_rid,
                country_rid,
                state_rid,
                final_credit: final_credit
            });
        }
        return calculationEntry;
    }

    /**
     * 
     * @param accountNumber 
     * @param case_rid 
     * @param region_name 
     * @returns 
     */
    async findRdCreditResultsByCaseIdAndState(accountNumber: string, case_rid: string, state_rid: string) {
        const { RdCreditStateCalculations } = await this.caseModelService.getModels(accountNumber);

        return await RdCreditStateCalculations.findOne({
            attributes: {
                exclude: ["final_credit"]
            },
            where: {
                case_rid,
                state_rid
            },
            order: [['created_datetime', 'DESC']],
            raw: true

        });
    }

    /**
     * 
     * @param countryCode 
     * @param mainDbSequelize 
     * @param effectiveStart 
     * @param effectiveEnd 
     * @param regionName 
     * @param programName 
     * @returns 
     */
    async getRDCreditConfigStateLevel(countryCode: string, mainDbSequelize: Sequelize, effectiveStart: string, effectiveEnd: string, regionName?: string, programName?: string) {
        try {
            if (!this.mainDbSequelize) {
                this.mainDbSequelize = await initMainDbSequelize();
            }
            const results: any[] = await this.mainDbSequelize.query(fetchRdCreditConfigStateLevelQuery(),
                {
                    replacements: {
                        countryCode: countryCode,
                        programName: programName || null,
                        effectiveStart: effectiveStart || null,
                        effectiveEnd: effectiveEnd || null
                    },
                    type: QueryTypes.SELECT,
                }
            );

            logMessage(`Credit config: ${JSON.stringify(results, null, 2)}`);
            return results || null;
        } catch (err) {
            logMessage(`Error fetching credit config: ${err}`);
            throw new Error("Error fetching credit config: " + (err as Error).message);
        }
    }

    /**
     * 
     * @param accountNumber 
     * @param case_rid 
     * @returns 
     */
    async markAsInitiated(accountNumber: string, case_rid: string, type: string): Promise<string> {
        const { RdCreditProcess } = await this.caseModelService.getModels(accountNumber);
        const createdRecord = await RdCreditProcess.create({
            case_rid,
            status: 'INITIATED',
            request_type: type
        });
        return createdRecord.rid!;
    }

    /**
     * 
     * @param accountNumber 
     * @param rid 
     * @returns 
     */
    async markAsInProgress(accountNumber: string, rid: string, type: string) {
        const { RdCreditProcess } = await this.caseModelService.getModels(accountNumber);

        return await RdCreditProcess.update(
            { status: 'The dossier package is in progress. Please refresh the page and wait a few seconds for the download to complete.' },
            { where: { rid, request_type: type } }
        );
    }

    /**
     * 
     * @param accountNumber 
     * @param rid 
     * @returns 
     */
    async markAsCompleted(accountNumber: string, rid: string, type: string) {
        const { RdCreditProcess } = await this.caseModelService.getModels(accountNumber);

        return await RdCreditProcess.update(
            { status: 'COMPLETED' },
            { where: { rid, request_type: type } }
        );
    }

    /**
     * 
     * @param accountNumber 
     * @param case_rid 
     * @returns 
     */
    async findProcessStatusByCaseRid(accountNumber: string, case_rid: string) {
        const { RdCreditProcess } = await this.caseModelService.getModels(accountNumber);

        const result = await RdCreditProcess.findOne({
            where: {
                case_rid,
                request_type: "dossier-form"
            },
            order: [['created_datetime', 'DESC']],
            attributes: ['status'],
        });
        return result?.status || null;
    }

    async getStateSummaryResults(accountNumber: string, case_rid: string, schemaName: string): Promise<{ [key: string]: any }> {
        const { RdCreditStateCalculations } = await this.caseModelService.getModels(accountNumber);
        if (!this.orgDbSequelize) {
            this.orgDbSequelize = await initOrgSequelize();
        }
        const [stateConfig]: any = await this.orgDbSequelize.query(
                  rawQueries.fetchConfiguration(schemaName, case_rid),
                  { raw: true },
                );
        const stateInfo =
                  Array.isArray(stateConfig) && stateConfig.length > 0 ? stateConfig[0] : {};
        // Get state calculations with state_rid and final_credit
        const stateCalculations = await RdCreditStateCalculations.findAll({
            attributes: ['state_rid', 'final_credit', 'total_qre'],
            where: {
                case_rid,
                state_rid: { [Op.in]: stateInfo.states }
            },
            order: [['created_datetime', 'DESC']],
            raw: true
        });

        // Initialize databases
        if (!this.mainDbSequelize) {
            this.mainDbSequelize = await initMainDbSequelize();
        }
       

        // Get unique state_rids
        const stateRids = [...new Set(stateCalculations.map(calc => calc.state_rid))];

        if (stateRids.length === 0) {
            return {};
        }

        // Fetch state codes from main database
        const stateData: any[] = await this.mainDbSequelize.query(
            rawQueries.fetchStatesByIds(),
            {
                replacements: { ids: stateRids },
                type: QueryTypes.SELECT,
            }
        );
        // Get project counts, QRE totals, and resource counts by state
        const projectData: any[] = await this.orgDbSequelize.query(
            rawQueries.fetchProjectCountsAndQreByState(schemaName),
            {
                replacements: { case_rid, stateRids },
                type: QueryTypes.SELECT,
            }
        );

        // Create maps
        const stateInfoMap = new Map();
        stateData.forEach(state => {
            stateInfoMap.set(state.rid, {
                state_code: state.state_code,
                state_name: state.state_name
            });
        });

        const projectMap = new Map();
        projectData.forEach(data => {
            projectMap.set(data.state_rid, {
                total_projects: Number(data.total_projects || 0),
                total_resources: Number(data.total_resources || 0),
                total_qre: Number(data.total_qre || 0)
            });
        });


        // Build result object: { state_name: { state_code, final_credit, total_projects, total_resources, total_qre } }
        const result: { [key: string]: any } = {};
        let totalCredit = 0;

        const sortedStateRows = stateCalculations
            .map(calc => ({
                calc,
                stateInfo: stateInfoMap.get(calc.state_rid)
            }))
            .filter(item => item.stateInfo)
            .sort((a, b) => a.stateInfo.state_name.localeCompare(b.stateInfo.state_name));

        sortedStateRows.forEach(({ calc, stateInfo }) => {
            const projectInfo = projectMap.get(calc.state_rid) || { total_projects: 0, total_resources: 0, total_qre: 0 };
            
            // Only add state if it has project resources
            if (projectInfo.total_resources > 0) {
                const totalQreValue = Number(calc.total_qre || 0);
                const finalCredit = Number(calc.final_credit) || 0;
                result[stateInfo.state_name] = {
                    state_code: stateInfo.state_code,
                    total_projects: projectInfo.total_projects.toString(),
                    total_resources: projectInfo.total_resources.toString(),
                    total_QRE: totalQreValue,
                    RD_credits: finalCredit
                };
                totalCredit += finalCredit;
            }
        });

        // Add total as a state-like structure
        result['Total'] = {
            RD_credits: Number(totalCredit.toFixed(2))
        };

        return {
            federal: result
        };
    }




}

export default RDCreditSchemaService;