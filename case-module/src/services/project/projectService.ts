import "moment-timezone";
import { initOrgSequelize } from "../../config/orgDataSource";
import {
    HttpStatus,
    rawQueries,
    STATUS_MESSAGE,
    SCHEMANAME_PREFIX
} from "../../utils/constants";
import SchemaService from "./schemaService";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { Logger } from "winston";
import { errorLog } from "../../utils/helpers";
import { checkProjectMappedToCaseProjectResource, fetchProjectQueryByPrjId } from "../../utils/rawQueries";

export class ProjectService {

    private logger: Logger;
    schemaService: SchemaService;

    constructor(logger: Logger) {
        this.logger = logger;
        this.schemaService = new SchemaService();
    }

    /**
 * Retrieves detailed information about a project and its attachments by account and project IDs.
 *
 * @async
 * @function projectById
 * @param {string} accountId - The ID of the account to which the project belongs.
 * @param {string} projectId - The ID of the project to retrieve.
 * @returns {Promise<{
 *   statusCode: number;
  *   message: string;
  *   errorMessage?: string;
  *   data?: {
  *     project: any;
  *     attachment: any[];
  *   };
  * }>} Returns the status, message, and project details with attachments, or throws an error.
  *
  * @throws {Error} If the account ID is invalid or any other error occurs during processing.
  *
  * @description
  * - Validates the account ID and fetches the account details.
  * - Resolves the correct account schema based on whether the account stores data in a parent schema.
  * - Checks if the relevant schema and tables exist.
  * - If schema/tables do not exist, returns success with empty project and attachments.
  * - Fetches project details and enriches them with additional data such as currency, key contacts, geo data, industry, project type and status, classification, user details, and account info.
  * - Retrieves project attachments and enriches them with document types, categories, uploader info, and formatted size.
  * - Returns the project data and mapped attachments in the response.
  */
    async projectById(
        accountId: string,
        projectId: string,
        caseId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { project: any; attachment: any };
    }> {
        try {
            const accountData = await this.schemaService.fetchAccountById(accountId);

            if (!accountData) {
                errorLog("Invalid account ID");
                throw new Error("Invalid account ID");
            }

            if (
                accountData.parent_account_rid === null ||
                accountData.parent_account_rid === ""
            ) {
                errorLog("Invalid account ID");
                throw new Error("Invalid account ID");
            }

            let accountRNumber = accountData.r_number;

            let childRNumber = await this.schemaService.fetchParentAccount(
                accountData.parent_account_rid
            );
            if (accountData.storage_type === "store_in_parent") {
                accountRNumber = childRNumber;
            }
            let isSubscriptionCreated = false;
            isSubscriptionCreated = (await this.schemaService.getSubscriptionDetailsByProjectId(accountData.parent_account_rid, childRNumber, accountId)) ?? false;


            const isExists = await this.schemaService.checkIfSchemaAndTableExists(
                accountRNumber
            );

            if (!isExists) {
                return {
                    statusCode: HttpStatus.SUCCESS,
                    message: HttpStatus.SUCCESS_MESSAGE,
                    data: {
                        project: [],
                        attachment: [],
                    },
                };
            }

            const accountDetails =
                await this.schemaService.fetchAccountDetailsById(
                    accountRNumber,
                    accountId
                );
            let projectData: any = await this.schemaService.fetchProjectById(
                accountRNumber,
                projectId,
                caseId
            );

            if (projectData) {
                projectData.dataValues.total_fte = projectData.dataValues.total_fte == 0 ? null : projectData.dataValues.total_fte
                projectData.dataValues.total_nonlabor_prj = projectData.dataValues.total_nonlabor_prj == 0 ? null : projectData.dataValues.total_nonlabor_prj
                projectData.dataValues.total_subcon = projectData.dataValues.total_subcon == 0 ? null : projectData.dataValues.total_subcon
                const mainDbInit = await initMainDbSequelize();

                let schemaName = rawQueries.fetchSchemaName(accountRNumber)
                const orgDb = await initOrgSequelize()
                let isResExists: boolean;
                const checkResExistsInPrjRes = await orgDb.query(checkProjectMappedToCaseProjectResource(schemaName, projectData.project_fiscal_rid, caseId))
                if (checkResExistsInPrjRes[0].length > 0) isResExists = true
                else isResExists = false
                projectData.dataValues.is_project_exists = isResExists

                await this.assignCurrencyRid(projectData, mainDbInit);

                projectData = await this.schemaService.enrichKeyContactsByProjectId(
                    projectData,
                    accountRNumber,
                    caseId
                );
                projectData = await this.schemaService.insertProjectGeoData(
                    projectData,
                    mainDbInit
                );

                projectData = await this.schemaService.insertIndustyName(
                    projectData,
                    mainDbInit
                );

                projectData = await this.schemaService.insertProjectTypeAndStatus(
                    projectData,
                    mainDbInit
                );

                projectData = await this.schemaService.projectKeyContactData(
                    projectData,
                    mainDbInit
                );

                projectData = await this.schemaService.projectClassificationData(
                    projectData,
                    mainDbInit
                );

                projectData = this.insertAccount(
                    projectData,
                    accountData,
                    accountDetails,
                    isSubscriptionCreated
                );

                projectData = await this.schemaService.insertUserDetails(projectData);

            }

            // Fetch attachments for the project
            const attachments = await this.schemaService.fetchAttachmentsByProjectId(
                projectId
            );
            let mappedAttachments = [];
            if (attachments.length > 0) {
                const sequelize = await initMainDbSequelize();
                // Get document types, categories, users in parallel
                const documentTypeIds = attachments.map(
                    (attachment: any) => attachment.document_type_rid
                );
                const documentCategoryIds = attachments.map(
                    (attachment: any) => attachment.document_category_rid
                );
                const userIds = attachments.map((attachment: any) => attachment.created_by);

                const [documentTypes, documentCategories, users] = await Promise.all([
                    documentTypeIds.length > 0
                        ? sequelize.query(rawQueries.GET_DOCUMENT_TYPES, {
                            replacements: { documentTypeIds },
                            type: "SELECT",
                        })
                        : [],
                    documentCategoryIds.length > 0
                        ? sequelize.query(rawQueries.GET_DOCUMENT_CATEGORIES, {
                            replacements: { documentCategoryIds },
                            type: "SELECT",
                        })
                        : [],
                    userIds.length > 0
                        ? sequelize.query(rawQueries.GET_USERS, {
                            replacements: { userIds },
                            type: "SELECT",
                        })
                        : [],
                ]);

                // Enhance attachments with related data
                mappedAttachments = attachments.map((attachment: any) => {
                    const documentType = documentTypes.find(
                        (dt: any) => dt.rid === attachment.document_type_rid
                    );
                    const documentCategory = documentCategories.find(
                        (dc: any) => dc.rid === attachment.document_category_rid
                    );
                    const uploadedBy = users.find(
                        (u: any) => u.rid === attachment.created_by
                    );
                    const attachedTo = projectData?.project_code;

                    return {
                        ...attachment,
                        document_type: (documentType as any)?.type_name || "",
                        document_category: (documentCategory as any)?.category_name || "",
                        uploaded_by: (uploadedBy as any)?.full_name || "",
                        attached_to: attachedTo,
                        size_in_mb: attachment.size_in_mb
                            ? `${attachment.size_in_mb} mb`
                            : "0 mb",
                    };
                });
            }

            return {
                statusCode: HttpStatus.SUCCESS,
                message: HttpStatus.SUCCESS_MESSAGE,
                data: {
                    project: projectData,
                    attachment: mappedAttachments,
                },
            };
        } catch (err) {
            errorLog("Error fetching project by ID: " + (err as Error).message);
            throw new Error(
                "Error fetching project by ID: " + (err as Error).message
            );
        }
    }

    async assignCurrencyRid(result: any, mainDbSequelize: any) {
        if (!result.currency) {
            const currencyRid = await this.getCurrencyDetailsByAccountRidRaw(
                result.account_rid
            );
            if (currencyRid) {
                result.currency = currencyRid;
            } else {
                try {
                    const usdCurrencyId = await mainDbSequelize.query(
                        rawQueries.fetchDefaultCurrency(),
                        { type: "SELECT" }
                    );
                    result.currency = usdCurrencyId[0]?.rid;
                } catch (err) {
                    errorLog("Error fetching USD currency: " + (err as Error).message);
                }
            }
        }
    }

    async getCurrencyDetailsByAccountRidRaw(
        accountRid: string
    ): Promise<string | null> {
        const query = rawQueries.fetchAccountDetailsByRid(accountRid);
        try {
            const mainDb = await initMainDbSequelize();
            const result = await mainDb.query(query, {
                type: "SELECT",
            });
            return result ? (result[0] as any).currency_rid : null;
        } catch (err) {
            errorLog("Error fetching currency rid: " + (err as Error).message);
            return null;
        }
    }

    insertAccount(project: any, account: any, accountDetails: any, isSubscriptionCreated: boolean) {
        const fiscalStartDate = accountDetails?.[0]?.fiscal_start_date || null;
        const fiscalEndDate = accountDetails?.[0]?.fiscal_end_date || null;
        return {
            ...project,
            account_name: account.account_name,
            account_number: account.r_number,
            account_status: account.status,
            organistaion_name: account.organisation_name,
            fiscal_start_date: fiscalStartDate,
            fiscal_end_date: fiscalEndDate,
            is_send_interaction: isSubscriptionCreated
        };
    }

    async projectFinancialHighlights(data: any): Promise<{
        statusCode: number;
        statusMessage?: string;
        message?: string;
        data: any;
        errorMessage?: string;
    }> {
        try {
            const accountData = await this.schemaService.fetchAccountById(data.account_rid);

            if (!accountData) {
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: HttpStatus.BAD_REQUEST_MESSAGE,
                    errorMessage: "Invalid account ID",
                    data: null
                };
            }

            let accountRNumber = accountData.r_number;

            if (accountData.storage_type === "store_in_parent") {
                let childRNumber = await this.schemaService.fetchParentAccount(
                    accountData.parent_account_rid
                );
                accountRNumber = childRNumber;
            }

            let schemaName = rawQueries.fetchSchemaName(accountRNumber);
            const orgDb = await initOrgSequelize();

            let result = await orgDb.query(
                fetchProjectQueryByPrjId(
                    data.account_rid,
                    schemaName,
                    data.fiscal_year,
                    data.project_fiscal_rid,
                    data.case_rid
                )
            );

            if (result[0].length > 0) {
                return {
                    statusCode: HttpStatus.SUCCESS,
                    statusMessage: "Success",
                    message: HttpStatus.SUCCESS_MESSAGE,
                    data: result[0][0],
                };
            } else {
                return {
                    statusCode: HttpStatus.SUCCESS,
                    statusMessage: STATUS_MESSAGE.dataNotAvailable,
                    message: HttpStatus.SUCCESS_MESSAGE,
                    data: null,
                };
            }

        } catch (err) {
            errorLog("Error fetching project financial highlights: " + (err as Error).message);
            return {
                statusCode: HttpStatus.FAILED,
                message: HttpStatus.FAILED_MESSAGE,
                errorMessage: (err as Error).message,
                data: null
            };
        }
    }



    async resourceCostsForFinancialHighlights(
        page: number,
        limit: number,
        search: string,
        filters: Record<string, any>,
        sortBy: string,
        sortOrder: string,
        accountNumber: string,
        fiscalYear: number,
        caseId: string,
        accountId: string,
        projectId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { projectResourceFiscal: any; count: number };
    }> {
        try {
            const offset = (page - 1) * limit;
            const [finalSortBy, finalSortOrder] = await this.schemaService.getSortParametersForFinancialHighlights(
                sortBy,
                sortOrder
            );

            const accountData = await this.schemaService.fetchAccountById(accountId);
            if (!accountData) {
                throw new Error("Invalid account ID");
            }
            let accountRNumber = accountData.r_number;
            if (accountData.storage_type === "store_in_parent") {
                let childRNumber = await this.schemaService.fetchParentAccount(
                    accountData.parent_account_rid
                );
                accountRNumber = childRNumber;
            }

            const schemaName = `${SCHEMANAME_PREFIX}${accountRNumber.replace("ACC-", "")}`;

            const isExists = await this.schemaService.checkIfSchemaAndTableExists(accountRNumber);
            if (!isExists) throw new Error("Schema does not exist");

            const searchCondition = this.schemaService.buildSearchConditionForFinancialHighlights(search);
            const filterConditions = this.schemaService.buildFilterConditionsForFinancialHighlights(filters, fiscalYear);

            const accountFilter = `AND pf.account_rid = '${accountId}'`;
            let projectFilter = "";
            if (projectId) {
                projectFilter = `AND pf.project_fiscal_rid = '${projectId}'`;
            }

            return await this.schemaService.executeQueriesForFinancialHighlights(
                schemaName,
                accountFilter,
                projectFilter,
                filterConditions,
                searchCondition,
                finalSortBy,
                finalSortOrder,
                limit,
                offset,
                search,
                caseId
            );

        } catch (err: any) {
            errorLog("Error fetching financial highlights: " + err.message);
            return {
                statusCode: HttpStatus.FAILED,
                message: HttpStatus.FAILED_MESSAGE,
                errorMessage: err.message
            };
        }
    }
}