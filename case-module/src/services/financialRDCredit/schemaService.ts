import { QueryTypes, Sequelize } from "sequelize";
import { CaseModelService } from "../caseModelsService";
import { logMessage } from "../../utils/helpers";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import {
    MAIN_SCHEMA_NAME,
} from "../../utils/constants";

class RDCreditSchemaService {
    private caseModelService: CaseModelService;
    private orgDbSequelize: Sequelize | null = null;
    private mainDbSequelize: Sequelize | null = null;

    constructor() {
        this.caseModelService = new CaseModelService();
    }

    /**
     * 
     * @param accountRid 
     * @param mainDbSequelize 
     * @returns 
     */
    async getCountryByAccountRid(accountRid: string, mainDbSequelize: Sequelize) {
        try {
            if (!this.mainDbSequelize) {
                this.mainDbSequelize = await initMainDbSequelize();
            }

            const [data]: any[] = await this.mainDbSequelize.query(
                `
                    SELECT 
                        ctry.country_code,
                        ctry.country_name,
                        st.state_name AS region_name
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
                countryCode: data?.country_code || null,
                countryName: data?.country_name || null,
                regionName: data?.region_name || null
            };
        } catch (err) {
            logMessage(`Error fetching account: ${err}`);
            throw new Error("Error fetching account : " + (err as Error).message);
        }
    }

    async getCurrentYearQREs(caseRid: string, schemaName: string, orgDbSequelize: Sequelize) {
        try {
            if (!this.orgDbSequelize) {
                this.orgDbSequelize = await initOrgSequelize();
            }

            const [data]: any[] = await this.orgDbSequelize.query(
                `
                    SELECT 
                        SUM(pf.total_cost_fte_prj) AS total_wages,
                        SUM(pf.total_cost_nonlabor_prj) AS total_supplies,
                        SUM(pf.total_cost_subcon_prj) AS total_contract
                    FROM ${schemaName}.case_projects cp
                    JOIN ${schemaName}.project_fiscal pf
                        ON cp.project_fiscal_rid = pf.rid
                    WHERE cp.case_rid = :caseRid
                `,
                {
                    replacements: { caseRid },
                    type: QueryTypes.SELECT,
                }
            );


            return {
                wages: Number(data?.total_wages || 0),
                supplies: Number(data?.total_supplies || 0),
                contract: Number(data?.total_contract || 0),
            };
        } catch (err) {
            logMessage(`Error fetching account: ${err}`);
            throw new Error("Error fetching account : " + (err as Error).message);
        }
    }

    async getAnnualGrossReceipts(accountRid: string, prior: number = 4, schemaName: string, orgDbSequelize: Sequelize) {
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
                WHERE account_rid = :accountRid
                GROUP BY fiscal_year
                ORDER BY fiscal_year DESC
                LIMIT :prior
            `,
                {
                    replacements: { accountRid, prior: 4 },
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

    async getPrior3YearQREs(accountRid: string, prior: number = 3, schemaName: string, orgDbSequelize: Sequelize) {
        try {
            if (!this.orgDbSequelize) {
                this.orgDbSequelize = await initOrgSequelize();
            }
            const result: any[] = await this.orgDbSequelize.query(
                `
                SELECT 
                    fiscal_year,
                    SUM(total_qre) AS total_qre
                FROM ${schemaName}.case_history_submission
                WHERE account_rid = :accountRid
                GROUP BY fiscal_year
                ORDER BY fiscal_year DESC
                LIMIT :prior
            `,
                {
                    replacements: { accountRid, prior: 3 },
                    type: QueryTypes.SELECT,
                }
            );

            return result.map(r => ({
                fiscalYear: r.fiscal_year,
                qre: Number(r.total_qre || 0)
            }));
        } catch (err) {
            logMessage(`Error fetching gross receipts: ${err}`);
            throw new Error("Error fetching gross receipts: " + (err as Error).message);
        }
    }


    async getRDCreditConfig(countryName: string, mainDbSequelize: Sequelize, effectiveStart: string, effectiveEnd: string, regionName?: string, programName?: string) {
        try {
            if (!this.mainDbSequelize) {
                this.mainDbSequelize = await initMainDbSequelize();
            }
            const results: any[] = await this.mainDbSequelize.query(
                `
                SELECT 
                    country_name,
                    region_name,
                    credit_program_name,
                    credit_rate,
                    sub_con_percent,
                    fixed_base_percentage,
                    elect_280c_yes,
                    elect_280c_no
                FROM ${MAIN_SCHEMA_NAME}.rd_credit_config
                WHERE LOWER(country_name) = LOWER(:countryName)

                -- State filter
                AND (
                    (:regionName IS NOT NULL AND LOWER(region_name) = LOWER(:regionName))
                    OR (:regionName IS NULL AND region_name IS NULL)
                )

                -- ProgramName filter (RRC vs ASC for USA Federal)
                AND (
                    (:programName IS NOT NULL AND LOWER(credit_program_name) = LOWER(:programName))
                    OR (:programName IS NULL)
                )
                
                -- Effective date filter
                AND (:effectiveStart IS NULL OR effective_start >= CAST(:effectiveStart AS timestamptz))
                AND (:effectiveEnd IS NULL OR effective_end <= CAST(:effectiveEnd AS timestamptz))

                LIMIT 1
            `,
                {
                    replacements: {
                        countryName: countryName,
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

    async insertRDCreditCalculation(accountNumber: string, case_rid: string, country_code: string, input_params: any, computed_fields: any) {
        const { RdCreditCountryCalculations } = await this.caseModelService.getModels(accountNumber);
        return await RdCreditCountryCalculations.create({
            case_rid,
            country_code,
            input_params,
            computed_fields
        });
    }

    async insertRDStateCreditCalculation(accountNumber: string, case_rid: string, country_code: string, region_name: string, input_params: any, computed_fields: any) {
        const { RdCreditStateCalculations } = await this.caseModelService.getModels(accountNumber);
        return await RdCreditStateCalculations.create({
            case_rid,
            country_code,
            input_params,
            computed_fields
        });
    }


    async getRDCreditConfigStateLevel(countryName: string, mainDbSequelize: Sequelize, effectiveStart: string, effectiveEnd: string, regionName?: string, programName?: string) {
        try {
            if (!this.mainDbSequelize) {
                this.mainDbSequelize = await initMainDbSequelize();
            }
            const results: any[] = await this.mainDbSequelize.query(
                `
                SELECT 
                    country_name,
                    region_name,
                    credit_program_name,
                    credit_rate,
                    sub_con_percent,
                    fixed_base_percentage,
                    elect_280c_yes,
                    elect_280c_no,
                    threshold_amount,
                    tier1_rate,
                    tier2_rate,
                    tier2_base_add,
                    qre_cap_rate
                FROM ${MAIN_SCHEMA_NAME}.rd_credit_config
                WHERE LOWER(country_name) = LOWER(:countryName)

                -- ProgramName filter
                AND (
                    (:programName IS NOT NULL AND LOWER(credit_program_name) = LOWER(:programName))
                    OR (:programName IS NULL)
                )
                
                -- Effective date filter
                AND (:effectiveStart IS NULL OR effective_start >= CAST(:effectiveStart AS timestamptz))
                AND (:effectiveEnd IS NULL OR effective_end <= CAST(:effectiveEnd AS timestamptz))
            `,
                {
                    replacements: {
                        countryName: countryName,
                        regionName: regionName || null,
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


}

export default RDCreditSchemaService;