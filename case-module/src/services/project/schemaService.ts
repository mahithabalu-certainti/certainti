import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { rawQueries, SCHEMANAME_PREFIX } from "../../utils/constants";
import {
    fetchIsRdQualifiedProjectQuery,
    fetchProjectFiscalCountQuery,
    fetchProjetFiscalForFinancialHighlights,
    summaryHighlightsQuery,
    fetchQueryForReferenceMap
} from "../../utils/rawQueries";
import moment from "moment";
import currency from "currency.js";
import Decimal from "decimal.js";
import { errorLog } from "../../utils/helpers";
import { Sequelize } from "sequelize";
import { MAIN_SCHEMA_NAME } from "../../utils/constants";
import { CaseModelService } from "../caseModelsService";

class SchemaService {
    private caseModelService: CaseModelService;

    constructor() {
        this.caseModelService = new CaseModelService();
    }

    async fetchAccountById(accountId: string): Promise<any> {
        try {
            const sequelize = await initMainDbSequelize();

            const [accountResult]: any = await sequelize.query(
                rawQueries.getAccountWithStatusByRidQuery(),
                {
                    replacements: { rid: accountId },
                    type: "SELECT",
                }
            );

            return accountResult;
        } catch (err: any) {
            errorLog("Error fetching account by ID : " + err.message);
            throw new Error("Error fetching account by ID : " + err.message);
        }
    }

    async fetchParentAccount(parentAccountId: string): Promise<string> {
        try {
            const sequelize = await initMainDbSequelize();

            const [account]: any[] = await sequelize.query(
                rawQueries.fetchAccountDetailsByRid(parentAccountId),
                {
                    type: "SELECT",
                }
            );

            return account?.r_number;
        } catch (err: any) {
            errorLog("Error fetching parent account : " + err.message);
            throw new Error("Error fetching parent account : " + err.message);
        }
    }

    async checkIfSchemaAndTableExists(accountNumber: string): Promise<any> {
        try {
            const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(
                "ACC-",
                ""
            )}`;
            const sequelize = await initOrgSequelize();
            const [result]: any = await sequelize.query(
                rawQueries.getCheckTableExistsQuery(),
                {
                    replacements: { schemaName: schemaName },
                    type: "SELECT",
                }
            );
            if (result) {
                return result.exists;
            }
            return false;
        } catch (err: any) {
            errorLog("Error checking schema and table existence : " + err.message);
            return false;
        }
    }

    async getSubscriptionDetailsByProjectId(
        parentaccountId: string,
        schemaName: string,
        accountId: string
    ) {
        try {
            let schemaNameParent = `trd365_${schemaName.replace(/\D/g, "")}`;
            const query = rawQueries.fetchAccountDetailsInfo(
                schemaNameParent,
                accountId
            );
            const sequelize = await initOrgSequelize();
            const users: any = await sequelize.query(query, {
                replacements: { account_rid: accountId },
                type: "SELECT",
            });
            const parentquery = rawQueries.fetchAccountDetailsInfo(
                schemaNameParent,
                parentaccountId
            );
            const parentSubscriptioninfo: any = await sequelize.query(parentquery, {
                replacements: { accountId: parentaccountId },
                type: "SELECT",
            });
            if (parentSubscriptioninfo && parentSubscriptioninfo.length > 0) {
                const parentDetails = parentSubscriptioninfo[0];
                const isSubscriptionCreated = Boolean(
                    parentDetails.subscription_created &&
                    parentDetails.tenant_id &&
                    parentDetails.client_id &&
                    parentDetails.client_secret
                );
                return isSubscriptionCreated;
            } else {
                return false;
            }
        } catch (err) {
            return false;
        }
    }

    async insertProjectGeoData(project: any, mainDdSequilze: Sequelize) {
        try {
            if (project.country_rid) {
                const countryResult: any = await mainDdSequilze.query(
                    rawQueries.fetchCountryById(),
                    {
                        replacements: { id: project.country_rid },
                        type: "SELECT",
                    }
                );
                const country = countryResult[0];
                project.country_name = country?.country_name;
                project.country_code = country?.country_code;
            }

            if (project.region_rid) {
                const stateResult: any = await mainDdSequilze.query(
                    rawQueries.fetchStateById(),
                    {
                        replacements: { id: project.region_rid },
                        type: "SELECT",
                    }
                );
                const state = stateResult[0];
                project.region_name = state?.state_name;
            }

            if (project.currency_rid) {
                const currencyResult: any = await mainDdSequilze.query(
                    rawQueries.fetchCurrencyById(),
                    {
                        replacements: { id: project.currency_rid },
                        type: "SELECT",
                    }
                );
                const currency = currencyResult[0];
                project.currency_name = currency?.currency_name;
                project.currency_code = currency?.currency_code;
                project.currency_symbol = currency?.currency_symbol;
            }

            return project;
        } catch (err: any) {
            errorLog("Error inserting project geo data : " + err.message);
        }
    }

    async insertIndustyName(project: any, mainDdSequilze: Sequelize) {
        try {
            if (project.industry_rid) {
                const industryResult: any = await mainDdSequilze.query(
                    rawQueries.getIndustryById(),
                    {
                        replacements: { id: project.industry_rid },
                        type: "SELECT",
                    }
                );
                const industry = industryResult[0];
                project.industry_name = industry?.industry_name;
            }

            return project;
        } catch (err: any) {
            errorLog("Error inserting industry name : " + err.message);
        }
    }

    async insertProjectTypeAndStatus(project: any, mainDdSequilze: Sequelize) {
        try {
            if (project.status_rid) {
                const statusResult: any = await mainDdSequilze.query(
                    rawQueries.fetchStatusById(),
                    {
                        replacements: { rid: project.status_rid },
                        type: "SELECT",
                    }
                );
                const status = statusResult[0];
                project.status_name = status?.status_name;
            }

            if (project.project_type_rid) {
                const projectTypeResult: any = await mainDdSequilze.query(
                    rawQueries.getProjectTypeByIdQuery(),
                    {
                        replacements: { id: project.project_type_rid },
                        type: "SELECT",
                    }
                );
                const projectType = projectTypeResult[0];
                project.project_type_name = projectType?.project_type_name;
            }

            return project;
        } catch (err: any) {
            errorLog("Error inserting project type and status : " + err.message);
        }
    }

    async projectKeyContactData(project: any, mainDdSequilze: Sequelize) {
        try {
            const plainProject =
                typeof project.toJSON === "function" ? project.toJSON() : project;

            const keyContacts = plainProject.keyContact || [];

            const keyContactIds = [
                ...new Set(keyContacts.map((r: any) => r.key_contact_role)),
            ].filter(Boolean);

            const statusIds = [
                ...new Set(keyContacts.map((r: any) => r.status_rid)),
            ].filter(Boolean);

            let keyContactMap: Record<string, string> = {};
            let statusMap: Record<string, string> = {};

            if (keyContactIds.length > 0) {
                const keyContactRows = await mainDdSequilze.query(
                    rawQueries.fetchKeyContactsByIds(),
                    {
                        replacements: { ids: keyContactIds },
                        type: "SELECT",
                    }
                );

                keyContactMap = Object.fromEntries(
                    keyContactRows.map((c: any) => [c.rid, c.role_name])
                );
            }

            if (statusIds.length > 0) {
                const statusRows = await mainDdSequilze.query(
                    rawQueries.fetchStatusByIds(),
                    {
                        replacements: { ids: statusIds },
                        type: "SELECT",
                    }
                );

                statusMap = Object.fromEntries(
                    statusRows.map((c: any) => [c.rid, c.status_name])
                );
            }

            const enrichedKeyContacts = keyContacts.map((kc: any) => ({
                ...kc,
                role_name: keyContactMap[kc.key_contact_role] || null,
                status_name: statusMap[kc.status_rid] || null,
            }));

            return {
                ...project,
                keyContact: enrichedKeyContacts,
            };
        } catch (err: any) {
            errorLog("Error inserting project key contact data : " + err.message);
        }
    }

    async projectClassificationData(project: any, mainDdSequilze: Sequelize) {
        try {
            if (project.project_classification_rid) {
                const classificationResult: any = await mainDdSequilze.query(
                    rawQueries.getProjectClassificationByIdQuery(),
                    {
                        replacements: { rid: project.project_classification_rid },
                        type: "SELECT",
                    }
                );
                const classification = classificationResult[0];
                project.classification_name = classification?.classification_name;
            }

            return project;
        } catch (err: any) {
            errorLog("Error inserting project classification data : " + err.message);
        }
    }

    async insertUserDetails(projectData: any) {
        try {
            const sequelize = await initMainDbSequelize();
            if (projectData.created_by) {
                const [user]: any = await sequelize.query(rawQueries.fetchUserById(), {
                    replacements: { userId: projectData.created_by },
                    type: "SELECT",
                });
                projectData.created_name =
                    user?.first_name + " " + user?.last_name || "";
            }
            if (projectData.modified_by) {
                const [user]: any = await sequelize.query(rawQueries.fetchUserById(), {
                    replacements: { userId: projectData.modified_by },
                    type: "SELECT",
                });
                projectData.modified_name =
                    user?.first_name + " " + user?.last_name || "";
            }

            return projectData;
        } catch (err: any) {
            errorLog("Error inserting user details : " + err.message);
        }
    }

    async fetchAttachmentsByProjectId(projectId: string): Promise<any> {
        try {
            const sequelize = await initMainDbSequelize();
            const attachments: any = await sequelize.query(
                rawQueries.getAttachmentsByProjectRidQuery(),
                {
                    replacements: { project_rid: projectId },
                    type: "SELECT",
                }
            );
            return attachments;
        } catch (err: any) {
            errorLog("Error fetching attachments by project ID : " + err.message);
            throw new Error(
                "Error fetching attachments by project ID : " + err.message
            );
        }
    }

    async fetchAccountDetailsById(accountNumber: string, accountId: string) {
        const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
            /\D/g,
            ""
        )}`;

        const sequelize = await initOrgSequelize();

        const accountDetails = await sequelize.query(
            rawQueries.fetchAccountDetailsInfo(schemaName, accountId),
            {
                type: "SELECT",
            }
        );

        return accountDetails;
    }

    async fetchProjectById(accountNumber: string, projectId: string, caseId: string) {
        const { CaseProject, ProjectFiscal } = await this.caseModelService.getModels(accountNumber);

        let projectData = await CaseProject.findOne({
            where: {
                project_fiscal_rid: projectId,
                case_rid: caseId,
            },
            attributes: {
                include: [
                    ["total_fte_prj", "total_fte"],
                    ["total_subcon_prj", "total_subcon"],
                    ["total_cost_prj", "total_cost"],
                    ["total_effort_prj", "total_effort"],
                    ["total_effort_fte_prj", "total_effort_fte"],
                    ["total_effort_subcon_prj", "total_effort_subcon"],
                    ["total_cost_fte_prj", "total_cost_fte"],
                    ["total_cost_subcon_prj", "total_cost_subcon"],
                    ["total_cost_nonlabor_prj", "total_cost_nonlabor"],
                    ["country_rid", "country"],
                    ["region_rid", "region"],
                    ["currency_rid", "currency"],
                    [Sequelize.col("case_project_project_fiscal.r_number"), "r_number"],
                    [Sequelize.col("case_project_project_fiscal.rid"), "rid"],
                    [Sequelize.col("case_project_project_fiscal.created_by"), "created_by"],
                    [Sequelize.col("case_project_project_fiscal.modified_by"), "modified_by"],
                    [Sequelize.col("case_project_project_fiscal.created_datetime"), "created_datetime"],
                    [Sequelize.col("case_project_project_fiscal.modified_datetime"), "modified_datetime"],
                ],
            },
            include: [
                {
                    model: ProjectFiscal,
                    as: "case_project_project_fiscal",
                    attributes: [],
                },
            ],
        });

        return projectData;
    }

    async enrichKeyContactsByProjectId(project: any, accountNumber: string, caseId: string) {
        const { CaseKeyContactDetails } = await this.caseModelService.getModels(accountNumber);

        const projectId = project.project_fiscal_rid;

        const allIds = [...new Set([projectId])];
        if (allIds.length === 0) return project;

        const keyContacts: any[] = await CaseKeyContactDetails.findAll({
            where: {
                entity_rid: allIds,
                case_rid: caseId,
            },
            raw: true,
        });

        const contactMap: Record<string, any[]> = {};
        for (const kc of keyContacts) {
            const refId = kc.entity_rid;
            if (!contactMap[refId]) contactMap[refId] = [];
            contactMap[refId].push(kc);
        }

        const enrichedProject = {
            ...project.dataValues,
            keyContact: contactMap[projectId] || [],
        };

        return enrichedProject;
    }
    async getSortParametersForFinancialHighlights(sortBy: string, sortOrder: string): Promise<[string, string]> {
        const validSortColumns = [
            "project_code",
            "fiscal_year",
            "r_number",
            "project_name",
            "resource_code",
            "resource_name",
            "resource_type_name",
            "country_code",
            "total_cost_pro_res",
            "rd_percent_final",
            "qre_final",
            "rd_credits_total",
        ];
        if (!validSortColumns.includes(sortBy)) {
            sortBy = "created_datetime";
        }

        sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
        return [sortBy, sortOrder];
    }

    buildSearchConditionForFinancialHighlights(search: string): string {
        if (!search) return "";

        return `
      AND (
        r.resource_code ILIKE :searchTerm 
        OR r.resource_name ILIKE :searchTerm
      )
    `;
    }

    processSimpleEqualityFilter(key: string, value: any): string {
        if (typeof value === "string") {
            return ` AND LOWER(rc."${key}") = LOWER('${value}')`;
        } else {
            return ` AND rc."${key}" = ${value}`;
        }
    }

    processAlphanumericFilterForFinancialHighlights(key: string, value: any): string {
        let condition = "";
        const table =
            ["resource_code", "resource_name"].includes(key)
                ? "r"
                : ["project_code", "r_number", "project_name"].includes(key)
                    ? "pf"
                    : "prf";

        if (value.equals) {
            condition += ` AND LOWER(${table}."${key}") = LOWER('${value.equals}')`;
        } else if (value.not_equals) {
            condition += ` AND (LOWER(${table}."${key}") != LOWER('${value.not_equals}') OR ${table}."${key}" IS NULL)`;
        } else if (value.contains) {
            condition += ` AND LOWER(${table}."${key}") LIKE LOWER('%${value.contains}%')`;
        } else if (value.not_contains) {
            condition += ` AND LOWER(${table}."${key}") NOT LIKE LOWER('%${value.not_contains}%')`;
        } else if (value.starts_with) {
            condition += ` AND LOWER(${table}."${key}") LIKE LOWER('${value.starts_with}%')`;
        } else if (value.ends_with) {
            condition += ` AND LOWER(${table}."${key}") LIKE LOWER('%${value.ends_with}')`;
        } else if (value.is_empty !== undefined) {
            if (value.is_empty) {
                condition += ` AND (${table}."${key}" IS NULL OR ${table}."${key}" = '')`;
            }
        } else if (value.is_not_empty !== undefined) {
            if (value.is_not_empty) {
                condition += ` AND ${table}."${key}" IS NOT NULL AND ${table}."${key}" != ''`;
            }
        } else if (value.in && Array.isArray(value.in) && value.in.length > 0) {
            const values = value.in
                .map((item: string) => `'${item.toLowerCase()}'`)
                .join(",");
            condition += ` AND LOWER(${table}."${key}") IN (${values})`;
        } else if (
            value.not_in &&
            Array.isArray(value.not_in) &&
            value.not_in.length > 0
        ) {
            const values = value.not_in
                .map((item: string) => `'${item.toLowerCase()}'`)
                .join(",");
            condition += ` AND LOWER(${table}."${key}") NOT IN (${values})`;
        }

        return condition;
    }

    processNumericFilterForFinancialHighlights(key: string, value: any): string {
        let condition = "";
        if (value.equals !== undefined) {
            condition += ` AND prf."${key}" = ${value.equals}`;
        } else if (value.not_equals !== undefined) {
            condition += ` AND (prf."${key}" != ${value.not_equals} OR prf."${key}" IS NULL)`;
        } else if (value.greater_than !== undefined) {
            condition += ` AND prf."${key}" > ${value.greater_than}`;
        } else if (value.less_than !== undefined) {
            condition += ` AND prf."${key}" < ${value.less_than}`;
        } else if (
            value.between &&
            Array.isArray(value.between) &&
            value.between.length === 2
        ) {
            condition += ` AND prf."${key}" BETWEEN ${value.between[0]} AND ${value.between[1]}`;
        } else if (value.is_empty !== undefined) {
            if (value.is_empty) {
                condition += ` AND prf."${key}" IS NULL`;
            }
        } else if (value.is_not_empty !== undefined) {
            if (value.is_not_empty) {
                condition += ` AND prf."${key}" IS NOT NULL`;
            }
        } else if (value.in && Array.isArray(value.in) && value.in.length > 0) {
            const values = value.in.join(",");
            condition += ` AND prf."${key}" IN (${values})`;
        } else if (
            value.not_in &&
            Array.isArray(value.not_in) &&
            value.not_in.length > 0
        ) {
            const values = value.not_in.join(",");
            condition += ` AND prf."${key}" NOT IN (${values})`;
        }

        return condition;
    }

    processDefaultFilterForFinancialHighlights(key: string, value: any): string {
        let tableAlias = "prf";

        const aliasMapR = ["resource_code", "resource_name", "resource_type_rid"];
        const aliasMapAD = ["project_name", "project_code", "r_number"];

        if (aliasMapR.includes(key)) {
            tableAlias = "r";
        } else if (aliasMapAD.includes(key)) {
            tableAlias = "pf";
        }
        let condition = "";
        const isUuidField = key.toLowerCase().includes("rid");

        if (value.equals !== undefined) {
            if (typeof value.equals === "string") {
                if (isUuidField) {
                    condition += ` AND ${tableAlias}."${key}" = '${value.equals}'`;
                } else {
                    condition += ` AND LOWER(${tableAlias}."${key}") = LOWER('${value.equals}')`;
                }
            } else {
                condition += ` AND ${tableAlias}."${key}" = ${value.equals}`;
            }
        } else if (value.not_equals !== undefined) {
            if (typeof value.not_equals === "string") {
                if (isUuidField) {
                    condition += ` AND (${tableAlias}."${key}" != '${value.not_equals}' OR ${tableAlias}."${key}" IS NULL)`;
                } else {
                    condition += ` AND LOWER(${tableAlias}."${key}") != LOWER('${value.not_equals}') OR ${tableAlias}."${key}" IS NULL`;
                }
            } else {
                condition += ` AND (${tableAlias}."${key}" != ${value.not_equals} OR ${tableAlias}."${key}" IS NULL)`;
            }
        } else if (value.contains !== undefined) {
            condition += ` AND LOWER(${tableAlias}."${key}") LIKE LOWER('%${value.contains}%')`;
        } else if (value.not_contains !== undefined) {
            condition += ` AND LOWER(${tableAlias}."${key}") NOT LIKE LOWER('%${value.not_contains}%')`;
        } else if (value.is_empty !== undefined) {
            if (value.is_empty) {
                if (isUuidField) {
                    condition += ` AND ${tableAlias}."${key}" IS NULL`;
                } else {
                    condition += ` AND (${tableAlias}."${key}" IS NULL OR ${tableAlias}."${key}" = '')`;
                }
            }
        } else if (value.is_not_empty !== undefined) {
            if (value.is_not_empty) {
                if (isUuidField) {
                    condition += ` AND ${tableAlias}."${key}" IS NOT NULL`;
                } else {
                    condition += ` AND ${tableAlias}."${key}" IS NOT NULL AND ${tableAlias}."${key}" != ''`;
                }
            }
        } else if (value.in && Array.isArray(value.in) && value.in.length > 0) {
            if (typeof value.in[0] === "string") {
                if (isUuidField) {
                    const values = value.in.map((item: string) => `'${item}'`).join(",");
                    condition += ` AND ${tableAlias}."${key}" IN (${values})`;
                } else {
                    const values = value.in
                        .map((item: string) => `LOWER('${item}')`)
                        .join(",");
                    condition += ` AND LOWER(${tableAlias}."${key}") IN (${values})`;
                }
            } else {
                const values = value.in.join(",");
                condition += ` AND ${tableAlias}."${key}" IN (${values})`;
            }
        } else if (
            value.not_in &&
            Array.isArray(value.not_in) &&
            value.not_in.length > 0
        ) {
            if (typeof value.not_in[0] === "string") {
                if (isUuidField) {
                    const values = value.not_in
                        .map((item: string) => `'${item}'`)
                        .join(",");
                    condition += ` AND ${tableAlias}."${key}" NOT IN (${values})`;
                } else {
                    const values = value.not_in
                        .map((item: string) => `LOWER('${item}')`)
                        .join(",");
                    condition += ` AND LOWER(${tableAlias}."${key}") NOT IN (${values})`;
                }
            } else {
                const values = value.not_in.join(",");
                condition += ` AND ${tableAlias}."${key}" NOT IN (${values})`;
            }
        }

        return condition;
    }

    processFiltersForRawQueryForFinancialHighlights(filters: Record<string, any>): string {
        let filterConditions = "";
        const alphanumericFields = [
            "project_code",
            "r_number",
            "project_name",
            "resource_code",
            "resource_name",
        ];
        const numericFields = [
            "fiscal_year",
            "total_cost_pro_res",
            "rd_percent_final",
            "qre_final",
            "rd_credits_total"
        ];

        Object.entries(filters).forEach(([key, value]) => {
            if (typeof value === "object") {
                if (alphanumericFields.includes(key)) {
                    filterConditions += this.processAlphanumericFilterForFinancialHighlights(key, value);
                } else if (numericFields.includes(key)) {
                    filterConditions += this.processNumericFilterForFinancialHighlights(key, value);
                } else {
                    filterConditions += this.processDefaultFilterForFinancialHighlights(key, value);
                }
            } else if (value !== undefined && value !== null) {
                filterConditions += this.processSimpleEqualityFilter(key, value);
            }
        });

        return filterConditions;
    }

    buildFilterConditionsForFinancialHighlights(
        filters: Record<string, any>,
        fiscalYear: number
    ): string {
        let filterConditions = "";

        if (filters && Object.keys(filters).length > 0) {
            filterConditions = this.processFiltersForRawQueryForFinancialHighlights(filters);
        }

        if (fiscalYear === 0 || fiscalYear === undefined) {
            return filterConditions;
        }

        const fiscalYearCondition = `
      AND prf.fiscal_year = ${fiscalYear}`;

        filterConditions += fiscalYearCondition;

        return filterConditions;
    }

    async getCurrencyRidByAccountRidRaw(accountRid: string): Promise<string | null> {
        const query = rawQueries.fetchAccountCurrencyRid(accountRid);
        try {
            const mainDb = await initMainDbSequelize();
            const result: any = await mainDb.query(query, {
                replacements: { accountRid },
                type: 'SELECT'
            });
            return result ? (result[0] as any).currency_rid : null;
        } catch (err: any) {
            errorLog('Error getting currency symbol:', err.message);
            return null;
        }
    }

    async assignCurrencyRid(result: any, mainDbSequelize: any): Promise<void> {
        if (!result.currency_rid) {
            const currencyRid = await this.getCurrencyRidByAccountRidRaw(result.account_rid);
            if (currencyRid) {
                result.currency_rid = currencyRid;
            } else {
                try {
                    const usdCurrencyId: any = await mainDbSequelize.query(
                        rawQueries.fetchDefaultCurrency(),
                        { type: 'SELECT' }
                    );
                    result.currency_rid = usdCurrencyId[0]?.rid;
                } catch (err: any) {
                    errorLog('Error getting USD currency rid:', err.message);
                }
            }
        }
    }

    async executeQueriesForFinancialHighlights(
        schemaName: string,
        accountFilter: string,
        projectFilter: string,
        filterConditions: string,
        searchCondition: string,
        sortBy: string,
        sortOrder: string,
        limit: number | undefined,
        offset: number | undefined,
        search: string,
        case_rid: string
    ) {
        try {
            const sequelize = await initOrgSequelize();

            let query = fetchProjetFiscalForFinancialHighlights(
                schemaName,
                accountFilter,
                projectFilter,
                filterConditions,
                searchCondition,
                case_rid
            );

            const countQuery = fetchProjectFiscalCountQuery(
                schemaName,
                accountFilter,
                projectFilter,
                filterConditions,
                searchCondition,
                case_rid
            );

            const replacements = {
                searchTerm: search ? `%${search}%` : null,
            };

            const [countResult]: any = await sequelize.query(countQuery, {
                replacements,
                type: "SELECT",
            });

            let results: any = await sequelize.query(query, {
                replacements,
                type: "SELECT",
            });

            const mainDbSequelize = await initMainDbSequelize();
            const fetchReferenceMap = async (table: string, idField: string, nameField: string, ids?: string[]) => {
                const query = fetchQueryForReferenceMap(idField, nameField, table, ids);
                const items: any = await mainDbSequelize.query(query, { type: "SELECT" });
                return new Map(items.map((item: any) => [item[idField], item[nameField]]));
            };

            const [statusMap, resourceTypeMap] = await Promise.all([
                fetchReferenceMap('resource_status', 'rid', 'resource_status_name'),
                fetchReferenceMap('resource_type', 'rid', 'resource_type_name')
            ]);

            const countryIds = [...new Set(results.map((r: any) => r.country_rid).filter(Boolean))] as string[];
            const regionIds = [...new Set(results.map((r: any) => r.region_rid).filter(Boolean))] as string[];

            let countryMap: any = new Map();
            let countryCodeMap: any = new Map();
            let regionMap: any = new Map();

            if (countryIds.length > 0) {
                countryMap = await fetchReferenceMap('country', 'rid', 'country_name', countryIds);
                countryCodeMap = await fetchReferenceMap('country', 'rid', 'country_code', countryIds);
            }

            if (regionIds.length > 0) {
                regionMap = await fetchReferenceMap('state', 'rid', 'state_name', regionIds);
            }

            if (sortBy === "status_name") {
                results.sort((a: any, b: any) => {
                    const aStatus = a.status_name;
                    const bStatus = b.status_name;

                    if (!aStatus && !bStatus) return 0;
                    if (!aStatus) return sortOrder === "ASC" ? 1 : -1;
                    if (!bStatus) return sortOrder === "ASC" ? -1 : 1;

                    return sortOrder === "ASC"
                        ? aStatus.localeCompare(bStatus)
                        : bStatus.localeCompare(aStatus);
                });
                if (limit !== undefined && offset !== undefined) {
                    results = results.slice(offset, offset + limit);
                }
            }
            else {
                results.sort((a: any, b: any) => {
                    let valA = a[sortBy];
                    let valB = b[sortBy];
                    if (valA == null) return 1;
                    if (valB == null) return -1;

                    if (typeof valA === 'string') {
                        return sortOrder === "ASC" ? valA.localeCompare(valB) : valB.localeCompare(valA);
                    } else {
                        return sortOrder === "ASC" ? valA - valB : valB - valA;
                    }
                });

                if (limit !== undefined && offset !== undefined) {
                    results = results.slice(offset, offset + limit);
                }
            }

            const projectResourceFiscal = results;
            const totalCount = countResult ? countResult.total || countResult.count : 0;

            const currencyIds = [
                ...new Set(projectResourceFiscal.map((rc: any) => rc.currency_rid)),
            ].filter(Boolean);

            if (currencyIds.length > 0) {
                const currencies: any = await mainDbSequelize.query(
                    rawQueries.GET_CURRENCIES,
                    {
                        replacements: { currencyRid: currencyIds },
                        type: "SELECT",
                    }
                );
                const currencyMap: any = currencies.reduce((map: any, curr: any) => {
                    map[curr.rid] = curr;
                    return map;
                }, {});

                projectResourceFiscal.forEach((rc: any) => {
                    if (rc.currency_rid && currencyMap[rc.currency_rid]) {
                        rc.currency_code = currencyMap[rc.currency_rid].currency_code;
                        rc.currency_name = currencyMap[rc.currency_rid].currency_name;
                        rc.currency_symbol = currencyMap[rc.currency_rid].currency_symbol;
                    } else {
                        rc.currency = null;
                    }
                });
            }

            projectResourceFiscal.forEach((prf: any) => {
                if (prf.resource_type_rid && resourceTypeMap.get(prf.resource_type_rid)) {
                    prf.resource_type_name = resourceTypeMap.get(prf.resource_type_rid);
                } else {
                    prf.resource_type_name = null;
                }
                if (prf.country_rid && countryMap.get(prf.country_rid)) {
                    prf.country_name = countryMap.get(prf.country_rid).country_name;
                } else {
                    prf.country_name = null;
                }
                if (prf.country_rid && countryCodeMap.get(prf.country_rid)) {
                    prf.country_code = countryCodeMap.get(prf.country_rid);
                } else {
                    prf.country_code = null;
                }
                if (prf.region_rid && regionMap.get(prf.region_rid)) {
                    prf.region_name = regionMap.get(prf.region_rid);
                } else {
                    prf.region_name = null;
                }
            });

            return {
                statusCode: 200,
                message: "Success",
                data: {
                    projectResourceFiscal: projectResourceFiscal,
                    count: parseInt(totalCount, 10),
                },
            };
        } catch (error: any) {
            errorLog("Error executing queries in financial highlight:", error.message);
            throw new Error("Error executing database queries");
        }
    }
}

export default SchemaService;
