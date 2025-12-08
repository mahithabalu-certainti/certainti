import { QueryTypes, Sequelize } from "sequelize";
import { CaseModelService } from "../caseModelsService";
import { logMessage } from "../../utils/helpers";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { MAIN_SCHEMA_NAME } from "../../utils/constants";
import { QRE, AnnualGrossReceipt } from "./rdCreditTypes";

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

    /**
     * 
     * @param caseRid 
     * @param schemaName 
     * @param orgDbSequelize 
     * @returns 
     */
    async getCurrentYearQREs(caseRid: string, schemaName: string, orgDbSequelize: Sequelize): Promise<QRE> {
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
                    WHERE cp.case_rid = :caseRid AND cs.fiscal_year = pf.fiscal_year
                    GROUP BY cs.tax_liability
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
                business_tax_liability: Number(data?.business_tax_liability || 0)
            };
        } catch (err) {
            logMessage(`Error fetching account: ${err}`);
            throw new Error("Error fetching account : " + (err as Error).message);
        }
    }

    /**
     * 
     * @param accountRid 
     * @param prior 
     * @param schemaName 
     * @param orgDbSequelize 
     * @returns 
     */
    async getAnnualGrossReceipts(accountRid: string, prior: number, schemaName: string, orgDbSequelize: Sequelize): Promise<AnnualGrossReceipt[]> {
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
                    replacements: { accountRid, prior },
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
    async getPrior3YearQREs(accountRid: string, prior: number = 3, schemaName: string, currentFiscalYear: number, orgDbSequelize: Sequelize): Promise<QRE[]> {
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
                WHERE account_rid = :accountRid AND fiscal_year < :currentFiscalYear
                GROUP BY fiscal_year
                ORDER BY fiscal_year DESC
                LIMIT :prior
            `,
                {
                    replacements: { accountRid, prior: 3, currentFiscalYear },
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
            const results: any[] = await this.mainDbSequelize.query(
                `
                SELECT ctry.country_code, rdcg.is_federal
                FROM ${MAIN_SCHEMA_NAME}.rd_credit_config_group rdcg
                JOIN ${MAIN_SCHEMA_NAME}.rd_credit_parameter_key rdkey ON rdkey.credit_config_group_rid = rdcg.rid
                JOIN ${MAIN_SCHEMA_NAME}.rd_credit_parameter_values rdval ON rdval.credit_config_group_rid = rdcg.rid
                JOIN ${MAIN_SCHEMA_NAME}.country ctry ON ctry.rid = rdcg.country_rid
                LEFT JOIN ${MAIN_SCHEMA_NAME}.state st ON st.rid = rdcg.state_rid AND st.country_rid = ctry.rid
                WHERE LOWER(ctry.country_code) = LOWER(:countryCode)
                
                -- Effective date filter
                AND (:effectiveStart IS NULL OR rdval.effective_start >= CAST(:effectiveStart AS timestamptz))
                AND (:effectiveEnd IS NULL OR rdval.effective_end <= CAST(:effectiveEnd AS timestamptz))
            
            `,
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
            const results: any[] = await this.mainDbSequelize.query(
                `
                SELECT rdval.config_json
                FROM ${MAIN_SCHEMA_NAME}.rd_credit_config_group rdcg
                JOIN ${MAIN_SCHEMA_NAME}.rd_credit_parameter_key rdkey ON rdkey.credit_config_group_rid = rdcg.rid
                JOIN ${MAIN_SCHEMA_NAME}.rd_credit_parameter_values rdval ON rdval.credit_config_group_rid = rdcg.rid
                JOIN ${MAIN_SCHEMA_NAME}.country ctry ON ctry.rid = rdcg.country_rid
                LEFT JOIN ${MAIN_SCHEMA_NAME}.state st ON st.rid = rdcg.state_rid AND st.country_rid = ctry.rid
                WHERE LOWER(ctry.country_code) = LOWER(:countryCode)

                -- State filter
                AND (
                    (:regionName IS NOT NULL AND LOWER(st.state_code) = LOWER(:regionName))
                    OR (:regionName IS NULL AND st.state_code IS NULL)
                )

                -- ProgramName filter (RRC vs ASC for USA Federal)
                AND (
                    (:programName IS NOT NULL AND LOWER(rdcg.credit_program_name) = LOWER(:programName))
                    OR (:programName IS NULL)
                )
                
                -- Effective date filter
                AND (:effectiveStart IS NULL OR rdval.effective_start >= CAST(:effectiveStart AS timestamptz))
                AND (:effectiveEnd IS NULL OR rdval.effective_end <= CAST(:effectiveEnd AS timestamptz))
                group by rdcg.rid, rdval.config_json, st.state_code
                LIMIT 1
            `,
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
    async insertRDCreditCalculation(accountNumber: string, case_rid: string, country_code: string, input_params: any, computed_fields: any) {
        const { RdCreditCountryCalculations } = await this.caseModelService.getModels(accountNumber);
        return await RdCreditCountryCalculations.create({
            case_rid,
            country_code,
            input_params,
            computed_fields
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
    async insertRDStateCreditCalculation(accountNumber: string, case_rid: string, country_code: string, region_name: string, input_params: any, computed_fields: any) {
        const { RdCreditStateCalculations } = await this.caseModelService.getModels(accountNumber);
        return await RdCreditStateCalculations.create({
            case_rid,
            country_code,
            input_params,
            computed_fields,
            region_name
        });
    }

    /**
     * 
     * @param accountNumber 
     * @param case_rid 
     * @param region_name 
     * @returns 
     */
    async getRDStateCreditCalculation(
        accountNumber: string,
        case_rid: string,
        region_name: string
    ) {
        const { RdCreditStateCalculations } = await this.caseModelService.getModels(accountNumber);

        return await RdCreditStateCalculations.findOne({
            where: {
                case_rid,
                region_name
            },
            order: [['created_datetime', 'DESC']]

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
            const results: any[] = await this.mainDbSequelize.query(
                `
                SELECT rdval.config_json, st.state_code
                FROM ${MAIN_SCHEMA_NAME}.rd_credit_config_group rdcg
                JOIN ${MAIN_SCHEMA_NAME}.rd_credit_parameter_key rdkey ON rdkey.credit_config_group_rid = rdcg.rid
                JOIN ${MAIN_SCHEMA_NAME}.rd_credit_parameter_values rdval ON rdval.credit_config_group_rid = rdcg.rid
                JOIN ${MAIN_SCHEMA_NAME}.country ctry ON ctry.rid = rdcg.country_rid
                JOIN ${MAIN_SCHEMA_NAME}.state st ON st.rid = rdcg.state_rid AND st.country_rid = ctry.rid
                WHERE LOWER(ctry.country_code) = LOWER(:countryCode)
                AND is_federal IS FALSE
                -- ProgramName filter
                AND (
                    (:programName IS NOT NULL AND LOWER(rdcg.credit_program_name) = LOWER(:programName))
                    OR (:programName IS NULL)
                )
                
                -- Effective date filter
                AND (:effectiveStart IS NULL OR rdval.effective_start >= CAST(:effectiveStart AS timestamptz))
                AND (:effectiveEnd IS NULL OR rdval.effective_end <= CAST(:effectiveEnd AS timestamptz))

                group by rdcg.rid, rdval.config_json, st.state_code
            `,
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
            { status: 'INPROGRESS' },
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

        const result =  await RdCreditProcess.findOne({
            where: { case_rid },
            order: [['created_datetime', 'DESC']],
            attributes: ['status'],
        });
        return result?.status || null;
    }




}

export default RDCreditSchemaService;