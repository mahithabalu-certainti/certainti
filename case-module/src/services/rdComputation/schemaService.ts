import { QueryTypes, Sequelize } from "sequelize";
import { CaseModelService } from "../caseModelsService";
import { logMessage } from "../../utils/helpers";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { MAIN_SCHEMA_NAME } from "../../utils/constants";
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
                accountName : data?.account_name || null
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
    async getCurrentYearQREsForState(caseRid: string, regionRid: string, schemaName: string, orgDbSequelize: Sequelize, currentFiscalYear : any): Promise<QRE> {
        try {
            if (!this.orgDbSequelize) {
                this.orgDbSequelize = await initOrgSequelize();
            }

            const [data]: any[] = await this.orgDbSequelize.query(
                `
                    SELECT 
                        SUM(cpr.total_cost_fte_from_prj_res) AS total_wages,
                        SUM(cpr.total_cost_nonlabor_from_prj_res) AS total_supplies,
                        SUM(cpr.total_cost_subcon_from_prj_res) AS total_contract,
                        cs.tax_liability as business_tax_liability
                    FROM ${schemaName}.case_projects cp
                    JOIN ${schemaName}.project_fiscal pf
                        ON cp.project_fiscal_rid = pf.rid
                    JOIN ${schemaName}.cases cs ON cs.rid = cp.case_rid
                    JOIN ${schemaName}.project_fiscal_region cpr ON cpr.project_fiscal_rid = cp.project_fiscal_rid
                    WHERE cp.case_rid = :caseRid AND cs.fiscal_year = :currentFiscalYear AND cpr.region_rid = :regionRid
                    GROUP BY cs.tax_liability
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
                business_tax_liability: Number(data?.business_tax_liability || 0)
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
    async getCurrentYearQREsForFederal(caseRid: string, countryRid: string, schemaName: string, orgDbSequelize: Sequelize): Promise<QRE> {
        try {
            if (!this.orgDbSequelize) {
                this.orgDbSequelize = await initOrgSequelize();
            }

            const [data]: any[] = await this.orgDbSequelize.query(
                `
                    SELECT 
                        SUM(pf.total_cost_fte_prj) AS total_wages,
                        SUM(pf.total_cost_nonlabor_prj) AS total_supplies,
                        SUM(pf.total_cost_subcon_prj) AS total_contract,
                        cs.tax_liability as business_tax_liability
                    FROM ${schemaName}.case_projects cp
                    JOIN ${schemaName}.project_fiscal pf
                        ON cp.project_fiscal_rid = pf.rid
                    JOIN ${schemaName}.cases cs ON cs.rid = cp.case_rid
                    WHERE cp.case_rid = :caseRid AND cs.fiscal_year = pf.fiscal_year AND pf.country_rid = :countryRid
                    GROUP BY cs.tax_liability
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
                business_tax_liability: Number(data?.business_tax_liability || 0)
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
    async insertRDCreditCalculation(accountNumber: string, case_rid: string, country_rid: string, input_params: any, computed_fields: any) {
        const { RdCreditCountryCalculations } = await this.caseModelService.getModels(accountNumber);
        return await RdCreditCountryCalculations.upsert(
            {
                case_rid,
                country_rid,
                input_params,
                computed_fields
            },
            {
                returning: true
            });
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
    async insertRDStateCreditCalculation(accountNumber: string, case_rid: string, country_rid: string, state_rid: string, input_params: any, computed_fields: any) {
        const { RdCreditStateCalculations } = await this.caseModelService.getModels(accountNumber);
        return await RdCreditStateCalculations.upsert(
            {
                case_rid,
                country_rid,
                input_params,
                computed_fields,
                state_rid
            },
            {
                returning: true
            });
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
            attributes : {
                exclude : ["final_credit"]
            },
            where: {
                case_rid,
                state_rid
            },
            order: [['created_datetime', 'DESC']],
            raw : true

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
    async markAsInitiated(accountNumber: string, case_rid: string): Promise<string> {
        const { RdCreditProcess } = await this.caseModelService.getModels(accountNumber);
        const createdRecord = await RdCreditProcess.create({
            case_rid,
            status: 'INITIATED'
        });
        return createdRecord.rid!;
    }

    /**
     * 
     * @param accountNumber 
     * @param rid 
     * @returns 
     */
    async markAsInProgress(accountNumber: string, rid: string) {
        const { RdCreditProcess } = await this.caseModelService.getModels(accountNumber);

        return await RdCreditProcess.update(
            { status: 'Financial workings are being computed. Refresh the page to check the status' },
            { where: { rid } }
        );
    }

    /**
     * 
     * @param accountNumber 
     * @param rid 
     * @returns 
     */
    async markAsCompleted(accountNumber: string, rid: string) {
        const { RdCreditProcess } = await this.caseModelService.getModels(accountNumber);

        return await RdCreditProcess.update(
            { status: 'COMPLETED' },
            { where: { rid } }
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
            where: { case_rid },
            order: [['created_datetime', 'DESC']],
            attributes: ['status'],
        });
        return result?.status || null;
    }




}

export default RDCreditSchemaService;