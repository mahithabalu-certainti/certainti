import Decimal from "decimal.js";
import {
    HttpStatus,
    rawQueries,
    MAIN_SCHEMA_NAME
} from "../../utils/constants";
import { ProjectTaskSchemaService } from "./schemaService";
import { ProjectResourceSchemaService } from "../projectResource/schemaService";
import { Resources } from "../../models/resource";
import { ProjectFiscal } from "../../models/projectFiscal";
import { CaseProjectTask } from "../../models/caseProjectTaskModel";
import { initOrgSequelize } from "../../config/orgDataSource";
import { initMainDbSequelize } from "../../config/mainDataSource";
import moment from "moment";
import { errorLog, logMessage } from "../../utils/helpers";
import { Op, Sequelize } from "sequelize";
import currency from "currency.js";
import AccountDetails from "../../models/accountDetails";
import { Project } from "../../models/project";
import { ProjectResource } from "../../models/projectResource";




export class ProjectInjestionTaskService {
    projectTaskSchema: ProjectTaskSchemaService;
    private projectResourceSchema: ProjectResourceSchemaService;
    private mainDbSequelize: Sequelize | null = null;
    private orgDbSequelize: Sequelize | null = null;

    constructor() {
        this.projectTaskSchema = new ProjectTaskSchemaService();
        this.projectResourceSchema = new ProjectResourceSchemaService();
    }

    private formatDateForDb(dateString?: string): Date | null {
        if (!dateString) return null;

        // Parse the date using moment to ensure consistent handling
        const date = moment(dateString, "YYYY-MM-DD", true);
        if (!date.isValid()) return null;

        // Set the time to noon to avoid timezone issues
        date.hour(12).minute(0).second(0).millisecond(0);

        return date.toDate();
    }

    /**
     * Get the main database connection
     */
    private async getMainDbSequelize(): Promise<Sequelize> {
        if (!this.mainDbSequelize) {
            this.mainDbSequelize = await initMainDbSequelize();
        }
        return this.mainDbSequelize;
    }

    private async getOrgDbSequelize(): Promise<Sequelize> {
        if (!this.orgDbSequelize) {
            this.orgDbSequelize = await initOrgSequelize();
        }
        return this.orgDbSequelize;
    }

    /**
     * Fetches the currency threshold from the currency table.
     * Falls back to USD if currency_rid is not provided.
     *
     * @param mainDbSequelize - Sequelize instance for the main DB.
     * @param currency_rid - Optional currency RID to lookup.
     * @returns currency_threshold value or null if not found.
     */
    async getCurrencyThreshold(
        mainDbSequelize: Sequelize,
        currency_rid?: string
    ): Promise<number | null> {
        let currencyResult;
        logMessage(`Fetching currency threshold for currency_rid: ${currency_rid || 'USD'}`);
        if (currency_rid) {
            [currencyResult] = await mainDbSequelize.query(
                rawQueries.fetchCurrencyThresold(),
                {
                    replacements: { currency_rid },
                    type: "SELECT",
                }
            );
        } else {
            [currencyResult] = await mainDbSequelize.query(
                rawQueries.fetchDefualtCurrencyThresold(),
                {
                    type: "SELECT",
                }
            );
        }

        return (currencyResult as any)?.currency_threshold ?? null;
    }

    async getResourceStatuses(
        mainDbSequelize: Sequelize
    ): Promise<Map<string, string> | null> {
        try {
            const resourceStatus = rawQueries.fetchAllResourceStatus();
            const results = await mainDbSequelize.query(resourceStatus, {
                type: "SELECT",
            });

            if (!results || !Array.isArray(results)) {
                return null;
            }

            // Create lookup maps
            const statusMap = new Map(
                results.map((st: any) => [st.resource_status_name, st.rid])
            );

            return statusMap;
        } catch (error) {
            errorLog(`Failed to fetch resource statuses: ${(error as Error).message}`);
            return null;
        }
    }



    /**
     * Formats an error response to be returned from service methods.
     *
     * @param {Error} err - The caught error.
     * @returns {object} - Standardized error response object.
     */
    throwServiceError(err: Error): {
        statusCode: number;
        message: string;
        errorMessage: string;
    } {
        return {
            statusCode: HttpStatus.FAILED,
            message: HttpStatus.FAILED_MESSAGE,
            errorMessage: err.message,
        };
    }

    private validatePerDayEffortLimit(
        existingTasks: CaseProjectTask[],
        newEffort: Decimal,
        start: Date,
        end: Date
    ): { success: boolean; errorMessage?: string } {
        const diffDays =
            Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const newTaskStart = start.getTime();

        const perDayEffort: Record<string, Decimal> = {};

        // Existing tasks
        for (const task of existingTasks) {
            if (task.start_date && task.end_date && task.total_hours_pro_task) {
                const taskStart = new Date(task.start_date).getTime();
                const taskEnd = new Date(task.end_date).getTime();
                const taskEffort = new Decimal(task.total_hours_pro_task || "0");
                const taskDays =
                    Math.floor((taskEnd - taskStart) / (1000 * 60 * 60 * 24)) + 1;
                const perDay = taskEffort.div(taskDays);

                for (let d = 0; d < taskDays; d++) {
                    const day = new Date(taskStart + d * 24 * 60 * 60 * 1000);
                    const dayStr = day.toISOString().slice(0, 10);
                    perDayEffort[dayStr] = (perDayEffort[dayStr] || new Decimal(0)).plus(
                        perDay
                    );
                }
            }
        }

        // New task
        const newPerDay = newEffort.div(diffDays);
        for (let d = 0; d < diffDays; d++) {
            const day = new Date(newTaskStart + d * 24 * 60 * 60 * 1000);
            const dayStr = day.toISOString().slice(0, 10);
            perDayEffort[dayStr] = (perDayEffort[dayStr] || new Decimal(0)).plus(
                newPerDay
            );

            if (perDayEffort[dayStr].gt(24)) {
                logMessage("Effort exceeds daily limit");
                return {
                    success: false,
                    errorMessage: `Effort cannot exceed the total hours in the duration`,
                };
            }
        }

        return { success: true };
    }



    /**
   * Retrieves a paginated list of case project tasks filtered and sorted based on provided criteria,
   * including optional search and resource name filtering.
   * 
   * Initializes necessary database connections and models,
   * fetches related reference data for formatting,
   * applies filtering, sorting, and pagination on the task list,
   * and returns the formatted tasks along with the total count.
   * 
   * @param {string} accountRid - The account identifier to scope the tasks.
   * @param {string} projectRid - The project identifier to filter tasks within a specific project.
   * @param {Record<string, any>} [filters={}] - Additional filters to apply to the tasks.
   * @param {string} [search] - Optional search string to filter tasks by text.
   * @param {number} [page=1] - The page number for pagination.
   * @param {number} [limit=10] - The number of tasks to return per page.
   * @param {string} [sortBy="created_datetime"] - The field to sort the results by.
   * @param {string} [sortOrder="DESC"] - The order of sorting: "ASC" or "DESC".
   * 
   * @returns {Promise<{
   *   statusCode: number;
    *   message: string;
    *   errorMessage?: string;
    *   data?: { tasks: any[]; totalCount: number };
    * }>} Returns an object containing status, message, optionally error message, 
    * and data with the paginated and formatted list of tasks and total count.
    */
    async listProjectTasks(
        accountRid: string,
        caseRid: string,
        filters: Record<string, any> = {},
        search?: string,
        page: number = 1,
        limit: number = 10,
        sortBy: string = "created_datetime",
        sortOrder: string = "DESC"
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { tasks: any[]; totalCount: number };
    }> {
        try {
            const sequelize = await initOrgSequelize();
            const mainSequelize = await initMainDbSequelize();

            const schemaName = await this.getSchemaInfo(accountRid);

            // ✅ Initialize all models first
            const { models } = await this.initializeModelsAndAssociations(schemaName);

            let resourceFilter: Record<string, any> | undefined;
            if (filters.resource_name) {
                resourceFilter = filters.resource_name;
                delete filters.resource_name;
            }

            // ✅ Build where clause with project filter
            const { whereClause } = this.buildRawWhereClause(filters, search);
            whereClause[Op.and] = whereClause[Op.and] || [];
            whereClause[Op.and].push({ case_rid: caseRid });

            // ✅ Get all tasks without pagination first to properly handle sorting of related data
            const allTasks = await models.CaseProjectTaskModel.findAll({
                where: whereClause,
                include: [
                {
                    model: models.AccountDetailsModel,
                    attributes: ["account_name"],
                    required: false,
                    as: "account",
                },
                {
                    model: models.ProjectFiscalModel,
                    attributes: ["project_name", "project_code", "currency_rid"],
                    required: false,
                    as: "project",
                },
                {
                    model: models.ResourceModel,
                    attributes: [
                    "resource_code",
                    "resource_name",
                    "resource_type_rid",
                    "resource_role",
                    "resource_orgname",
                    ],
                    required: false,
                    as: "resource",
                },
                {
                    model : models.ProjectResourceModel,
                    attributes : [
                    "project_resource_role"
                    ],
                    required : false,
                    as : "project_resource"
                }
                ],
            });

            // ✅ Fetch and map related data
            const { resourceTypeMap, currencyMap, resourceStatusMap, taskTypeMap, taskClassificationsMap } = await this.fetchRelatedData(
                allTasks,
                mainSequelize
            );

            // ✅ Format all tasks
            let formattedTasks = allTasks.map((task) =>
                this.formatTaskData(task, resourceTypeMap, currencyMap, resourceStatusMap, taskTypeMap, taskClassificationsMap)
            );

            if (resourceFilter) {
                formattedTasks = formattedTasks.filter((task) => {
                const resourcePass = resourceFilter
                    ? this.applyTextFilter(task.resource_name, resourceFilter)
                    : true;

                return resourcePass;
                });
            }

            // ✅ Handle special sorting cases
            formattedTasks = this.sortTasks(formattedTasks, sortBy, sortOrder);

            // ✅ Apply pagination after sorting
            const total = formattedTasks.length;
            formattedTasks = formattedTasks.slice((page - 1) * limit, page * limit);

            return {
                statusCode: HttpStatus.SUCCESS,
                message: HttpStatus.SUCCESS_MESSAGE,
                data: {
                tasks: formattedTasks,
                totalCount: total,
                },
            };
            } catch (error) {
            errorLog("projectTaskService - listProjectTasks", (error as Error).message);
            return {
                statusCode: 500,
                message: "Failed to fetch attachments",
                errorMessage:
                error instanceof Error ? error.message : "An unknown error occurred",
                data: { tasks: [], totalCount: 0 },
            };
        }
    }

    /**
   * Exports a list of case project tasks for a given user, account, and project with optional filters and search.
   * 
   * This method fetches all matching tasks without pagination, enriches them with related reference data,
   * filters tasks by resource name if specified, sorts them according to provided criteria, and formats
   * them based on the allowed export fields for the user. The exported data is returned in a format
   * suitable for export (e.g., CSV or Excel).
   * 
   * @param {string} userId - The ID of the user requesting the export, used to determine allowed export fields.
   * @param {string} accountRid - The account identifier to scope the tasks.
   * @param {string} projectRid - The project fiscal RID to filter tasks by.
   * @param {Record<string, any>} [filters={}] - Optional filters to apply on task attributes.
   * @param {string} [search] - Optional search text to apply across task fields.
   * @param {string} [sortBy="created_datetime"] - The field by which to sort the tasks.
   * @param {string} [sortOrder="DESC"] - The order of sorting: "ASC" or "DESC".
   * 
   * @returns {Promise<{
   *   statusCode: number;
    *   message: string;
    *   errorMessage?: string;
    *   data?: { tasks: any[]; totalCount: number };
    * }>} An object containing the export data of tasks, total count, and status information.
    */
    async listProjectTasksExport(
        userId: string,
        accountRid: string,
        caseRid: string,
        filters: Record<string, any> = {},
        search?: string,
        sortBy: string = "created_datetime",
        sortOrder: string = "DESC"
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { tasks: any[]; totalCount: number };
    }> {
        try {
            const sequelize = await initOrgSequelize();
            const mainSequelize = await initMainDbSequelize();

            const schemaName = await this.getSchemaInfo(accountRid);

            // ✅ Initialize all models first
            const { models } = await this.initializeModelsAndAssociations(schemaName);

            let resourceFilter: Record<string, any> | undefined;
            if (filters.resource_name) {
                resourceFilter = filters.resource_name;
                delete filters.resource_name;
            }

            // ✅ Build where clause with project filter
            const { whereClause } = this.buildRawWhereClause(filters, search);
            whereClause[Op.and] = whereClause[Op.and] || [];
            whereClause[Op.and].push({ case_rid: caseRid });

            // ✅ Get all tasks without pagination first to properly handle sorting of related data
            const allTasks = await models.CaseProjectTaskModel.findAll({
                where: whereClause,
                include: [
                    {
                        model: models.AccountDetailsModel,
                        attributes: ["account_name"],
                        required: false,
                        as: "account",
                    },
                    {
                        model: models.ProjectFiscalModel,
                        attributes: ["project_name", "project_code", "currency_rid"],
                        required: false,
                        as: "project",
                    },
                    {
                        model: models.ResourceModel,
                        attributes: [
                            "resource_code",
                            "resource_name",
                            "resource_type_rid",
                            "resource_role",
                            "resource_orgname",
                        ],
                        required: false,
                        as: "resource",
                    },
                ],
            });

            // ✅ Fetch and map related data
            const { resourceTypeMap, currencyMap, resourceStatusMap, taskTypeMap, taskClassificationsMap } = await this.fetchRelatedData(
                allTasks,
                mainSequelize
            );

            // ✅ Format all tasks
            let formattedTasks = allTasks.map((task) =>
                this.formatTaskData(task, resourceTypeMap, currencyMap, resourceStatusMap, taskTypeMap, taskClassificationsMap)
            );

            if (resourceFilter) {
                formattedTasks = formattedTasks.filter((task) => {
                    const resourcePass = resourceFilter
                        ? this.applyTextFilter(task.resource_name, resourceFilter)
                        : true;

                    return resourcePass;
                });
            }

            // ✅ Handle special sorting cases
            formattedTasks = this.sortTasks(formattedTasks, sortBy, sortOrder);

            // ✅ Apply pagination after sorting
            const total = formattedTasks.length;

            const [projectTaskFields] = await Promise.all([
                this.projectTaskSchema.getAllowedExportFields(
                    userId,
                    "projects_task_view_edit"
                ),
            ]);

            const allowedFieldSet = new Set<string>();
            for (const field of projectTaskFields) {
                if (field.read) {
                    allowedFieldSet.add(field.field_name);
                }
            }

            const exportData = await Promise.all(
                formattedTasks.map(async (task: any) => {
                    const exportRecord: Record<string, any> = {};

                    // Only add fields that are in the allowedFieldSet
                    if (allowedFieldSet.has('resource_code')) {
                        exportRecord['Resource Code'] = task.resource_code || "-";
                    }
                    if (allowedFieldSet.has('task_name')) {
                        exportRecord['Task Name'] = task.task_name || "-";
                    }
                    if (allowedFieldSet.has('task_type_rid')) {
                        exportRecord['Task Type'] = task.task_type_name || "-";
                    }
                    if (allowedFieldSet.has('task_classification_rid')) {
                        exportRecord['Task Classification'] = task.task_classification_name || "-";
                    }
                    if (allowedFieldSet.has('resource_name')) {
                        exportRecord['Resource Name'] = task.resource_name || "-";
                    }
                    if (allowedFieldSet.has('resource_type_name')) {
                        exportRecord['Resource Type'] = task.resource_type_name || "-";
                    }
                    if (allowedFieldSet.has('resource_role')) {
                        exportRecord['Role'] = task.resource_role || "-";
                    }
                    if (allowedFieldSet.has('start_date')) {
                        exportRecord['Start Date'] = task.start_date ? moment(task.start_date).format("YYYY-MMM-DD") : "-";
                    }
                    if (allowedFieldSet.has('end_date')) {
                        exportRecord['End Date'] = task.end_date ? moment(task.end_date).format("YYYY-MMM-DD") : "-";
                    }
                    if (allowedFieldSet.has('total_cost_pro_task')) {
                        exportRecord['Cost'] = await this.formatNumberForExport(
                            task.total_cost_pro_task,
                            task.currency_symbol
                        ) || "-";
                    }
                    if (allowedFieldSet.has('total_hours_pro_task')) {
                        exportRecord['Effort in Hrs'] = task.total_hours_pro_task || "-";
                    }
                    if (allowedFieldSet.has('comments')) {
                        exportRecord['Comments'] = task.comments || "-";
                    }
                    if (allowedFieldSet.has('r_number')) {
                        exportRecord['Case Project Task ID'] = task.r_number || "-";
                    }

                    return exportRecord;
                })
            );

            // Ensure we always return at least an empty object in the array if there are no tasks
            const finalExportData = exportData.length > 0 ? exportData : [{}];
            return {
                statusCode: HttpStatus.SUCCESS,
                message: HttpStatus.SUCCESS_MESSAGE,
                data: {
                    tasks: finalExportData,
                    totalCount: total,
                },
            };
        } catch (error) {
            errorLog("projectTaskService - listProjectTasksExport", (error as Error).message);
            return {
                statusCode: 500,
                message: "Failed to fetch case project tasks",
                errorMessage:
                    error instanceof Error ? error.message : "An unknown error occurred",
                data: { tasks: [], totalCount: 0 },
            };
        }
    }

    /**
   * Retrieves detailed information about a specific case project task by its ID,
   * including related account, project, resource, and attachments data.
   * 
   * Initializes database models and associations based on the account schema,
   * fetches the task with all related entities, and enriches the result with
   * additional reference data such as resource types, currencies, statuses, task types, 
   * classifications, and mapped attachments with document and user details.
   * 
   * @param {string} accountRid - The account identifier to scope the task.
   * @param {string} taskRid - The unique identifier of the case project task to retrieve.
   * 
   * @returns {Promise<{
   *   statusCode: number;
    *   message: string;
    *   errorMessage?: string;
    *   data?: any;
    * }>} Returns an object containing status, message, optionally error message, 
    * and data with the detailed case project task information.
    */
    async getProjectTaskById(
        accountRid: string,
        taskRid: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: any;
    }> {
        try {
            const sequelize = await initOrgSequelize();
            const mainSequelize = await initMainDbSequelize();

            const accountData = await this.projectTaskSchema.fetchAccountById(accountRid);
            if (!accountData) throw new Error("Invalid account ID");

            let schemaNumber = accountData.r_number;
            if (accountData.storage_type === "store_in_parent") {
                schemaNumber = await this.projectTaskSchema.fetchParentAccount(
                    accountData.parent_account_rid
                );
            }

            const schemaName = `${MAIN_SCHEMA_NAME}_${schemaNumber.replace(
                /\D/g,
                ""
            )}`;

            // Initialize models
            const AccountDetailsModel = AccountDetails.initialize(sequelize, schemaName);
            const ProjectModel = Project.initialize(sequelize, schemaName);
            const ProjectFiscalModel = ProjectFiscal.initialize(sequelize, schemaName);
            const ResourceModel = Resources.initialize(sequelize, schemaName);
            const CaseProjectTaskModel = CaseProjectTask.initialize(sequelize, schemaName);
            const ProjectResoureModel = ProjectResource.initialize(sequelize, schemaName)

            // Define associations
            CaseProjectTaskModel.belongsTo(AccountDetailsModel, {
                foreignKey: "account_rid",
                targetKey: "account_rid",
                as: "account",
            });

            CaseProjectTaskModel.belongsTo(ProjectFiscalModel, {
                foreignKey: "project_fiscal_rid",
                targetKey: "rid",
                as: "project",
            });

            CaseProjectTaskModel.belongsTo(ResourceModel, {
                foreignKey: "resource_rid",
                targetKey: "rid",
                as: "resource",
            });

            CaseProjectTaskModel.belongsTo(ProjectResoureModel, {
                foreignKey: "project_resource_rid",
                targetKey: "rid",
                as: "project_resource"
            })

            const task = await CaseProjectTaskModel.findOne({
                where: { rid: taskRid },
                include: [
                    {
                        model: AccountDetailsModel,
                        attributes: ["account_name"],
                        required: false,
                        as: "account",
                    },
                    {
                        model: ProjectFiscalModel,
                        attributes: ["project_name", "project_code", "currency_rid"],
                        required: false,
                        as: "project",
                    },
                    {
                        model: ResourceModel,
                        attributes: [
                            "resource_code",
                            "resource_type_rid",
                            "resource_name",
                            "resource_role",
                            "resource_orgname",
                        ],
                        required: false,
                        as: "resource",
                    },
                    {
                        model: ProjectResoureModel,
                        attributes: ["project_resource_role"],
                        required: false,
                        as: "project_resource",
                    }
                ],
            });

            if (!task) {
                return {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: "Case project task not found",
                    errorMessage: "The requested case project task could not be found",
                };
            }

            const [resourceTypeData, currencyData, TaskStatusData, taskTyepData, taskClassificationData] = await Promise.all([
                (task as any).dataValues.resource?.resource_type_rid
                    ? mainSequelize.query(rawQueries.GET_RESOURCE_TYPES, {
                        replacements: {
                            resourceTypeRid: (task as any).dataValues.resource
                                ?.resource_type_rid,
                        },
                        type: "SELECT",
                    })
                    : Promise.resolve([]),
                (task as any).dataValues.project?.currency_rid
                    ? mainSequelize.query(rawQueries.GET_CURRENCIES, {
                        replacements: {
                            currencyRid: (task as any).dataValues.project?.currency_rid,
                        },
                        type: "SELECT",
                    })
                    : Promise.resolve([]),
                (task as any).dataValues.status_rid
                    ? mainSequelize.query(rawQueries.fetchResourceStatus, {
                        replacements: {
                            projectTaskStatusId: (task as any).dataValues.status_rid,
                        },
                        type: "SELECT",
                    })
                    : Promise.resolve([]),
                (task as any).dataValues.task_type_rid
                    ? mainSequelize.query(rawQueries.GET_TASK_TYPES, {
                        replacements: {
                            taskTypeRid: (task as any).dataValues.task_type_rid,
                        },
                        type: "SELECT",
                    })
                    : Promise.resolve([]),
                (task as any).dataValues.task_classification_rid
                    ? mainSequelize.query(rawQueries.GET_TASK_CLASSIFICATION, {
                        replacements: {
                            taskClassificationRids: (task as any).dataValues.task_classification_rid,
                        },
                        type: "SELECT",
                    })
                    : Promise.resolve([]),
            ]);

            const [resourceType] = resourceTypeData;
            const [currency] = currencyData;
            const [taskStatus] = TaskStatusData;
            const [taskTypes] = taskTyepData;
            const [taskClassification] = taskClassificationData;

            const attachments = await this.fetchAttachmentsBytaskId(taskRid);
            let mappedAttachments = [];

            if (attachments.length > 0) {
                const documentTypeIds = [
                    ...new Set(
                        attachments.map((attachment) => attachment.document_type_rid)
                    ),
                ];
                const documentCategoryIds = [
                    ...new Set(
                        attachments.map((attachment) => attachment.document_category_rid)
                    ),
                ];
                const userIds = [
                    ...new Set(attachments.map((attachment) => attachment.created_by)),
                ];

                const [documentTypes, documentCategories, users] = await Promise.all([
                    documentTypeIds.length > 0
                        ? mainSequelize.query(rawQueries.GET_DOCUMENT_TYPES, {
                            replacements: { documentTypeIds },
                            type: "SELECT",
                        })
                        : Promise.resolve([]),

                    documentCategoryIds.length > 0
                        ? mainSequelize.query(rawQueries.GET_DOCUMENT_CATEGORIES, {
                            replacements: { documentCategoryIds },
                            type: "SELECT",
                        })
                        : Promise.resolve([]),

                    userIds.length > 0
                        ? mainSequelize.query(rawQueries.GET_USERS, {
                            replacements: { userIds },
                            type: "SELECT",
                        })
                        : Promise.resolve([]),
                ]);

                mappedAttachments = attachments.map((attachment) => ({
                    ...attachment,
                    document_type:
                        (
                            documentTypes.find(
                                (dt: any) => dt.rid === attachment.document_type_rid
                            ) as { type_name: string }
                        )?.type_name || "",
                    document_category:
                        (
                            documentCategories.find(
                                (dc: any) => dc.rid === attachment.document_category_rid
                            ) as { category_name: string }
                        )?.category_name || "",
                    uploaded_by:
                        (
                            users.find((u: any) => u.rid === attachment.created_by) as {
                                full_name: string;
                            }
                        )?.full_name || "",
                    attached_to: task.r_number,
                    size_in_mb: attachment.size_in_mb
                        ? `${attachment.size_in_mb} mb`
                        : "0 mb",
                }));
            }

            const taskWithUserDetails = await this.insertUserDetails(task);

            const formattedTask = {
                rid: taskWithUserDetails.dataValues.rid,
                r_number: taskWithUserDetails.dataValues.r_number,
                account_rid: taskWithUserDetails.dataValues.account_rid,
                account_name:
                    taskWithUserDetails.dataValues.account?.account_name || null,
                project_rid: taskWithUserDetails.dataValues.project_rid,
                project_fiscal_rid: taskWithUserDetails.dataValues.project_fiscal_rid,
                project_name:
                    taskWithUserDetails.dataValues.project?.project_name || null,
                project_code:
                    taskWithUserDetails.dataValues.project?.project_code || null,
                project_resource_rid:
                    taskWithUserDetails.dataValues.project_resource_rid,
                resource_rid: taskWithUserDetails.dataValues.resource_rid,
                resource_code:
                    taskWithUserDetails.dataValues.resource?.resource_code || null,
                fiscal_year: taskWithUserDetails.dataValues.fiscal_year,
                start_date: taskWithUserDetails.dataValues.start_date,
                end_date: taskWithUserDetails.dataValues.end_date,
                resource_name: taskWithUserDetails.dataValues.resource?.resource_name,
                resource_type_rid:
                    taskWithUserDetails.dataValues.resource?.resource_type_rid,
                resource_type_name: (resourceType as any)?.resource_type_name || null,
                resource_role: taskWithUserDetails.dataValues.resource?.resource_role,
                currency_rid: taskWithUserDetails.dataValues.project?.currency_rid,
                currency_symbol: (currency as any)?.currency_symbol || null,
                currency_name: (currency as any)?.currency_name || null,
                resource_orgname:
                    taskWithUserDetails.dataValues.resource?.resource_orgname,
                total_hours_pro_task:
                    taskWithUserDetails.dataValues.total_hours_pro_task,
                total_cost_pro_task: taskWithUserDetails.dataValues.total_cost_pro_task,
                comments: taskWithUserDetails.dataValues.comments,
                attachment: mappedAttachments,
                created_datetime: taskWithUserDetails.dataValues.created_datetime,
                modified_datetime: taskWithUserDetails.dataValues.modified_datetime,
                created_by: taskWithUserDetails.created_name,
                modified_by: taskWithUserDetails.modified_name,
                status_rid: taskWithUserDetails.dataValues.status_rid,
                status_name: (taskStatus as any)?.resource_status_name,
                project_resource_role: taskWithUserDetails.dataValues.project_resource.project_resource_role,
                task_name: taskWithUserDetails.dataValues.task_name ?? null,
                task_description: taskWithUserDetails.dataValues.task_description ?? null,
                task_type_rid: taskWithUserDetails.dataValues.task_type_rid ?? null,
                task_classification_rid: taskWithUserDetails.dataValues.task_classification_rid ?? null,
                task_type_name: (taskTypes as any)?.project_task_type_name ?? null,
                task_classification_name: (taskClassification as any)?.classification_name ?? null,
            };

            return {
                statusCode: HttpStatus.SUCCESS,
                message: HttpStatus.SUCCESS_MESSAGE,
                data: formattedTask,
            };
        } catch (error) {
            errorLog("projectTaskService - getProjectTaskById", (error as Error).message);
            return {
                statusCode: HttpStatus.FAILED,
                message: HttpStatus.FAILED_MESSAGE,
                errorMessage:
                    error instanceof Error ? error.message : "An unknown error occurred",
            };
        }
    }

    // ============ DEPENDENCY METHODS ============

    async initializeModelsAndAssociations(schemaName: string) {
        const sequelize = await initOrgSequelize();

        // Initialize models
        const AccountDetailsModel = AccountDetails.initialize(sequelize, schemaName);
        const ProjectModel = Project.initialize(sequelize, schemaName);
        const ProjectFiscalModel = ProjectFiscal.initialize(sequelize, schemaName);
        const ResourceModel = Resources.initialize(sequelize, schemaName);
        const CaseProjectTaskModel = CaseProjectTask.initialize(sequelize, schemaName);
        const ProjectResourceModel = ProjectResource.initialize(sequelize, schemaName)

        // Define associations
        CaseProjectTaskModel.belongsTo(AccountDetailsModel, {
            foreignKey: "account_rid",
            targetKey: "account_rid",
            as: "account",
        });

        CaseProjectTaskModel.belongsTo(ProjectFiscalModel, {
            foreignKey: "project_fiscal_rid",
            targetKey: "rid",
            as: "project",
        });

        CaseProjectTaskModel.belongsTo(ResourceModel, {
            foreignKey: "resource_rid",
            targetKey: "rid",
            as: "resource",
        });

        CaseProjectTaskModel.belongsTo(ProjectResourceModel, {
            foreignKey: "project_resource_rid",
            targetKey: "rid",
            as: "project_resource"
        })

        return {
            sequelize,
            models: {
                AccountDetailsModel,
                ProjectModel,
                ProjectFiscalModel,
                ResourceModel,
                CaseProjectTaskModel,
                ProjectResourceModel
            },
        };
    }

    async getSchemaInfo(accountRid: string) {
        const accountData = await this.projectTaskSchema.fetchAccountById(accountRid);
        if (!accountData) throw new Error("Invalid account ID");

        let schemaNumber = accountData.r_number;
        if (accountData.storage_type === "store_in_parent") {
            schemaNumber = await this.projectTaskSchema.fetchParentAccount(
                accountData.parent_account_rid
            );
        }

        return `${MAIN_SCHEMA_NAME}_${schemaNumber.replace(/\D/g, "")}`;
    }

    async fetchRelatedData(allTasks: any[], mainSequelize: any) {
        // Fetch resource types
        const resourceTypeRids = allTasks
            .map((task) => (task as any)?.resource.resource_type_rid)
            .filter((rid) => rid);

        const resourceTypes = resourceTypeRids.length
            ? await mainSequelize.query(rawQueries.GET_RESOURCE_TYPES, {
                replacements: { resourceTypeRid: resourceTypeRids },
                type: "SELECT",
            })
            : [];

        const projectTaskStatusIds = allTasks
            .map((task) => (task as any)?.status_rid)
            .filter((statusRid) => statusRid)

        const [resourceStatus] = await Promise.all([
            projectTaskStatusIds.length
                ? mainSequelize.query(rawQueries.fetchResourceStatus, {
                    replacements: { projectTaskStatusId: projectTaskStatusIds },
                    type: "SELECT",
                })
                : [],
        ]);

        // Fetch currencies
        const currencyRids = allTasks
            .map((task) => (task as any)?.project?.currency_rid)
            .filter((rid) => rid);

        const [currencies] = await Promise.all([
            currencyRids.length
                ? mainSequelize.query(rawQueries.GET_CURRENCIES, {
                    replacements: { currencyRid: currencyRids },
                    type: "SELECT",
                })
                : [],
        ]);

        // Fetch task type
        const taskTypeRids = allTasks
            .map((task) => (task as any)?.task_type_rid)
            .filter((rid) => rid);

        const [taskTypes] = await Promise.all([
            taskTypeRids.length
                ? mainSequelize.query(rawQueries.GET_TASK_TYPES, {
                    replacements: { taskTypeRid: taskTypeRids },
                    type: "SELECT",
                })
                : [],
        ]);

        // Fetch task classification
        const taskClassificationRids = allTasks
            .map((task) => (task as any)?.task_classification_rid)
            .filter((rid) => rid);

        const [taskClassifications] = await Promise.all([
            taskClassificationRids.length
                ? mainSequelize.query(rawQueries.GET_TASK_CLASSIFICATION, {
                    replacements: { taskClassificationRids },
                    type: "SELECT",
                })
                : [],
        ]);

        return {
            resourceTypeMap: new Map<string, string>(
                resourceTypes.map((type: any) => [type.rid, type.resource_type_name])
            ),
            currencyMap: new Map<string, string>(
                currencies.map((currency: any) => [
                    currency.rid,
                    currency.currency_symbol,
                ])
            ),
            resourceStatusMap: new Map<string, string>(
                resourceStatus.map((resourceStatus: any) => [
                    resourceStatus.rid,
                    resourceStatus.resource_status_name
                ])
            ),
            taskTypeMap: new Map<string, string>(
                taskTypes.map((type: any) => [
                    type.rid,
                    type.project_task_type_name,
                ])
            ),
            taskClassificationsMap: new Map<string, string>(
                taskClassifications.map((type: any) => [
                    type.rid,
                    type.classification_name,
                ])
            ),
        };
    }

    formatTaskData(
        task: any,
        resourceTypeMap: Map<string, string>,
        currencyMap: Map<string, string>,
        resourceStatusMap: Map<string, string>,
        taskTypeMap: Map<string, string>,
        taskClassificationMap: Map<string, string>,
    ) {
        return {
            rid: task.rid,
            r_number: task.r_number,
            account_rid: task.account_rid,
            account_name: (task as any).account?.account_name || null,
            project_rid: task.project_rid,
            project_fiscal_rid: task.project_fiscal_rid,
            project_name: (task as any).project?.project_name || null,
            project_code: (task as any).project?.project_code || null,
            project_resource_code: task.project_resource_code,
            resource_rid: task.resource_rid,
            resource_code: (task as any).resource?.resource_code || null,
            fiscal_year: task.fiscal_year,
            start_date: task.start_date,
            end_date: task.end_date,
            resource_name: (task as any).resource?.resource_name || null,
            resource_type_rid: (task as any).resource?.resource_type_rid || null,
            resource_type_name:
                resourceTypeMap.get((task as any).resource?.resource_type_rid) || null,
            resource_role: (task as any).resource?.resource_role || null,
            currency_rid: (task as any).project?.currency_rid,
            currency_symbol:
                currencyMap.get((task as any).project?.currency_rid) || null,
            resource_orgname: (task as any).resource?.resource_orgname || null,
            total_hours_pro_task: task.total_hours_pro_task,
            total_cost_pro_task: task.total_cost_pro_task,
            comments: task.comments,
            created_by: task.created_by,
            modified_by: task.modified_by,
            created_datetime: task.created_datetime,
            modified_datetime: task.modified_datetime,
            status_rid: task.status_rid,
            status_name: resourceStatusMap.get(task.status_rid) || null,
            project_resource_role: task.project_resource?.project_resource_role || null,
            task_name: task.task_name || null,
            task_description: task.task_description || null,
            task_classification_rid: task.task_classification_rid || null,
            task_classification_name: taskClassificationMap.get(task.task_classification_rid) || null,
            task_type_rid: task.task_type_rid || null,
            task_type_name: taskTypeMap.get(task.task_type_rid) || null,
        };
    }

    sortTasks(formattedTasks: any[], sortBy: string, sortOrder: string) {
        const validSortFields = [
            "resource_code",
            "r_number",
            "resource_name",
            "resource_type",
            "start_date",
            "total_cost_pro_task",
            "total_hours_pro_task",
            "comments",
            "created_datetime",
            "modified_datetime",
            "status_name",
            "project_resource_role",
            "task_type_name",
            "task_classification_name",
            "task_name",
            "task_description"
        ];

        const finalSortBy = validSortFields.includes(sortBy)
            ? sortBy
            : "created_datetime";
        const finalSortOrder = ["ASC", "DESC"].includes(sortOrder.toUpperCase())
            ? sortOrder.toUpperCase()
            : "DESC";

        // Apply sorting logic...
        // Sort based on the mapped names for special fields
        if (finalSortBy === "resource_type") {
            const priorityMap: Record<string, number> = {
                "Full-Time": 1,
                "Non-Labor": 2,
                "Sub Con": 3,
            };

            formattedTasks.sort((a, b) => {
                const aPriority = priorityMap[a.resource_type_name || ""] || Number.MAX_SAFE_INTEGER;
                const bPriority = priorityMap[b.resource_type_name || ""] || Number.MAX_SAFE_INTEGER;

                return finalSortOrder === "ASC"
                    ? aPriority - bPriority
                    : bPriority - aPriority;
            });
        } else if (finalSortBy === "status_name") {
            const priorityMap: Record<string, number> = {
                "Active": 1,
                "Anomaly": 2,
                "Duplicate": 3,
                "In-Active": 4
            };

            formattedTasks.sort((a, b) => {
                const aPriority = priorityMap[a.status_name || ""] || Number.MAX_SAFE_INTEGER;
                const bPriority = priorityMap[b.status_name || ""] || Number.MAX_SAFE_INTEGER;

                return finalSortOrder === "ASC"
                    ? aPriority - bPriority
                    : bPriority - aPriority;
            });
        }
        else if (
            finalSortBy === "total_hours_pro_task" ||
            finalSortBy === "total_cost_pro_task"
        ) {
            formattedTasks.sort((a, b) => {
                const aVal = a[finalSortBy];
                const bVal = b[finalSortBy];

                const aIsEmpty = aVal === null || aVal === undefined;
                const bIsEmpty = bVal === null || bVal === undefined;

                if (aIsEmpty && !bIsEmpty) return finalSortOrder === "ASC" ? 1 : -1;
                if (!aIsEmpty && bIsEmpty) return finalSortOrder === "ASC" ? -1 : 1;
                if (aIsEmpty && bIsEmpty) return 0;

                const aNum = Number(aVal);
                const bNum = Number(bVal);

                return finalSortOrder === "ASC" ? aNum - bNum : bNum - aNum;
            });
        } else if (finalSortBy === "resource_code") {
            formattedTasks.sort((a, b) => {
                const aName = a.resource_code;
                const bName = b.resource_code;

                if (finalSortOrder === "ASC") {
                    if (!aName && bName) return 1;
                    if (aName && !bName) return -1;
                    return aName?.localeCompare(bName ?? "") ?? 0;
                } else {
                    if (!aName && bName) return -1;
                    if (aName && !bName) return 1;
                    return bName?.localeCompare(aName ?? "") ?? 0;
                }
            });
        } else if (finalSortBy === "project_resource_role") {
            formattedTasks.sort((a, b) => {
                const aName = a.project_resource_role;
                const bName = b.project_resource_role;

                if (finalSortOrder === "ASC") {
                    if (!aName && bName) return 1;
                    if (aName && !bName) return -1;
                    return aName?.localeCompare(bName ?? "") ?? 0;
                } else {
                    if (!aName && bName) return -1;
                    if (aName && !bName) return 1;
                    return bName?.localeCompare(aName ?? "") ?? 0;
                }
            });
        } else if (finalSortBy === "resource_name") {
            formattedTasks.sort((a, b) => {
                const aName = a.resource_name;
                const bName = b.resource_name;

                if (finalSortOrder === "ASC") {
                    if (!aName && bName) return 1;
                    if (aName && !bName) return -1;
                    return aName?.localeCompare(bName ?? "") ?? 0;
                } else {
                    if (!aName && bName) return -1;
                    if (aName && !bName) return 1;
                    return bName?.localeCompare(aName ?? "") ?? 0;
                }
            });
        }
        else if (finalSortBy === "task_type_name") {
            formattedTasks.sort((a, b) => {
                const isANull = a.task_type_name === null || a.task_type_name === undefined;
                const isBNull = b.task_type_name === null || b.task_type_name === undefined;

                if (isANull && isBNull) return 0;
                if (isANull) return 1;
                if (isBNull) return -1;

                const nameA = a.task_type_name;
                const nameB = b.task_type_name;

                return finalSortOrder === "ASC"
                    ? nameA.localeCompare(nameB)
                    : nameB.localeCompare(nameA);
            });
        }
        else if (finalSortBy === "task_classification_name") {
            formattedTasks.sort((a, b) => {
                const isANull = a.task_classification_name === null || a.task_classification_name === undefined;
                const isBNull = b.task_classification_name === null || b.task_classification_name === undefined;

                if (isANull && isBNull) return 0;
                if (isANull) return 1;
                if (isBNull) return -1;

                const nameA = a.task_classification_name;
                const nameB = b.task_classification_name;

                return finalSortOrder === "ASC"
                    ? nameA.localeCompare(nameB)
                    : nameB.localeCompare(nameA);
            });
        }
        else {
            formattedTasks.sort((a, b) => {
                const aVal = a[finalSortBy as keyof typeof a];
                const bVal = b[finalSortBy as keyof typeof b];

                if (finalSortOrder === "ASC") {
                    if ((aVal === null || aVal === undefined) && bVal != null) return 1;
                    if (aVal != null && (bVal === null || bVal === undefined)) return -1;
                    return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                } else {
                    if ((aVal === null || aVal === undefined) && bVal != null) return -1;
                    if (aVal != null && (bVal === null || bVal === undefined)) return 1;
                    return bVal < aVal ? -1 : bVal > aVal ? 1 : 0;
                }
            });
        }

        return formattedTasks;
    }

    formatNumberForExport = (
        value: any,
        currency_symbol: string
    ): string => {
        if (value == null || value === "") return "-";

        try {
            const decimalValue = new Decimal(value.toString());
            if (!decimalValue.isFinite()) return "-";

            const formattedValue = decimalValue.toFixed(2);
            const pattern = currency(0, {
                symbol: currency_symbol || "$",
                precision: 2,
                pattern: "! #",
                separator: ",",
                decimal: ".",
            }).format();

            // const [intPart, decPart] = formattedValue.split(".");
            const parts = formattedValue.split(".");
            const intPart = parts[0] || "0";
            const decPart = parts[1] || "00";
            const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            const formattedNumber = `${formattedInt}.${decPart}`;

            return pattern.replace("0.00", formattedNumber);
        } catch (error) {
            console.error("Error formatting number:", error);
            return "-";
        }
    };

    buildRawWhereClause(
        filters: Record<string, any>,
        search?: string
    ): { whereClause: any } {
        const whereClause: any = {
            [Op.and]: [],
        };

        // Defensive: handle undefined/null filters
        if (!filters || typeof filters !== "object") {
            filters = {};
        }

        // Search logic
        if (search) {
            whereClause[Op.and].push({
                [Op.or]: [
                    { "$resource.resource_name$": { [Op.iLike]: `%${search}%` } },
                    { "$resource.resource_code$": { [Op.iLike]: `%${search}%` } },
                    { r_number: { [Op.iLike]: `%${search}%` } },
                    { comments: { [Op.iLike]: `%${search}%` } },
                ],
            });
        }

        // Filter logic for your input structure
        Object.entries(filters).forEach(([field, filter]) => {
            if (!filter || typeof filter !== "object") {
                logMessage(
                    `Skipping filter for field ${field} due to invalid structure`
                );
                return;
            }

            const operator = Object.keys(filter)[0];
            const value = operator ? filter[operator] : undefined;


            if (!operator || value === undefined) {
                logMessage(
                    `Skipping filter for field ${field} due to missing operator or value`
                );
                return;
            }

            const condition: any = {};

            switch (field) {
                case "total_cost_pro_task":
                case "total_hours_pro_task":
                    switch (operator.toLowerCase()) {
                        case "equals":
                            condition[field] = { [Op.eq]: Number(value) };
                            break;
                        case "not_equals":
                            condition[field] = {
                                [Op.or]: [{ [Op.ne]: Number(value) }, { [Op.is]: null }],
                            };
                            break;
                        case "less_than":
                            condition[field] = { [Op.lt]: Number(value) };
                            break;
                        case "greater_than":
                            condition[field] = { [Op.gt]: Number(value) };
                            break;
                        case "between":
                            if (Array.isArray(value)) {
                                condition[field] = {
                                    [Op.between]: [Number(value[0]), Number(value[1])],
                                };
                            }
                            break;
                        case "is_empty":
                            condition[field] = {
                                [Op.or]: [{ [Op.is]: null }, { [Op.eq]: 0 }],
                            };
                            break;
                    }
                    break;

                case "resource_name":
                    switch (operator.toLowerCase()) {
                        case "equals":
                            condition["$resource.resource_name$"] = { [Op.iLike]: value };
                            break;
                        case "not_equals":
                            condition["$resource.resource_name$"] = {
                                [Op.or]: [{ [Op.notILike]: value }, { [Op.is]: null }],
                            };
                            break;
                        case "contains":
                            condition["$resource.resource_name$"] = {
                                [Op.iLike]: `%${value}%`,
                            };
                            break;
                        case "is_empty":
                            condition["$resource.resource_name$"] = {
                                [Op.or]: [{ [Op.is]: null }, { [Op.eq]: "" }],
                            };
                            break;
                    }
                    break;
                case "project_resource_role":
                    switch (operator.toLowerCase()) {
                        case "equals":
                            condition["$project_resource.project_resource_role$"] = { [Op.iLike]: value };
                            break;
                        case "not_equals":
                            condition["$project_resource.project_resource_role$"] = {
                                [Op.or]: [{ [Op.notILike]: value }, { [Op.is]: null }],
                            };
                            break;
                        case "contains":
                            condition["$project_resource.project_resource_role$"] = {
                                [Op.iLike]: `%${value}%`,
                            };
                            break;
                        case "is_empty":
                            condition["$project_resource.project_resource_role$"] = {
                                [Op.or]: [{ [Op.is]: null }, { [Op.eq]: "" }],
                            };
                            break;
                    }
                    break;
                case "comments":
                case "r_number":
                    switch (operator.toLowerCase()) {
                        case "equals":
                            condition[field] = { [Op.iLike]: value };
                            break;
                        case "not_equals":
                            condition[field] = {
                                [Op.or]: [{ [Op.notILike]: value }, { [Op.is]: null }],
                            };
                            break;
                        case "contains":
                            condition[field] = { [Op.iLike]: `%${value}%` };
                            break;
                        case "is_empty":
                            condition[field] = {
                                [Op.or]: [{ [Op.is]: null }, { [Op.eq]: "" }],
                            };
                            break;
                    }
                    break;

                case "start_date":
                case "end_date":
                    switch (operator.toLowerCase()) {
                        case "equals": {
                            const date = new Date(value);
                            if (isNaN(date.getTime())) {
                                throw new Error(
                                    "Invalid date format provided for equals operator"
                                );
                            }
                            condition[field] = Sequelize.literal(
                                `DATE("ProjectTask".${field}) = DATE('${date.toISOString()}')`
                            );
                            break;
                        }
                        case "before": {
                            const date = new Date(value);
                            if (isNaN(date.getTime())) {
                                throw new Error(
                                    "Invalid date format provided for before operator"
                                );
                            }
                            condition[field] = Sequelize.literal(
                                `DATE("ProjectTask".${field}) < DATE('${date.toISOString()}')`
                            );
                            break;
                        }
                        case "after": {
                            const date = new Date(value);
                            if (isNaN(date.getTime())) {
                                throw new Error(
                                    "Invalid date format provided for after operator"
                                );
                            }
                            condition[field] = Sequelize.literal(
                                `DATE("ProjectTask".${field}) > DATE('${date.toISOString()}')`
                            );
                            break;
                        }
                        case "between": {
                            if (!Array.isArray(value) || value.length !== 2) {
                                throw new Error(
                                    "Between operator requires an array with two dates"
                                );
                            }
                            const startDate = new Date(value[0]);
                            const endDate = new Date(value[1]);

                            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                                throw new Error(
                                    "Invalid date format provided for between operator"
                                );
                            }

                            if (startDate > endDate) {
                                throw new Error("Start date cannot be later than end date");
                            }

                            condition[field] = Sequelize.literal(
                                `DATE("ProjectTask".${field}) BETWEEN DATE('${startDate.toISOString()}') AND DATE('${endDate.toISOString()}')`
                            );
                            break;
                        }
                        case "is_empty":
                            condition[field] = { [Op.is]: null };
                            break;
                        default:
                            throw new Error(
                                `Unsupported operator ${operator} for date field`
                            );
                    }
                    break;

                case "resource_type_rid":
                    // Process each operator in the filter object separately
                    Object.entries(filter).forEach(([op, val]) => {
                        if (val === undefined) return;

                        const nestedCondition: any = {};
                        switch (op.toLowerCase()) {
                            case "equals":
                                nestedCondition["$resource.resource_type_rid$"] = {
                                    [Op.eq]: val,
                                };
                                break;
                            case "not_equals":
                                nestedCondition["$resource.resource_type_rid$"] = {
                                    [Op.or]: [{ [Op.ne]: val }, { [Op.is]: null }],
                                };
                                break;
                            case "in":
                                nestedCondition["$resource.resource_type_rid$"] = {
                                    [Op.in]: Array.isArray(val) ? val : [val],
                                };
                                break;
                            case "is_empty":
                                nestedCondition["$resource.resource_type_rid$"] = {
                                    [Op.or]: [{ [Op.is]: null }, { [Op.eq]: "" }],
                                };
                                break;
                        }

                        if (Object.keys(nestedCondition).length > 0) {
                            whereClause[Op.and].push(nestedCondition);
                        }
                    });
                    return; // Skip the default condition push at the end
                case "status_rid":
                    Object.entries(filter).forEach(([op, val]) => {
                        if (val === undefined) return;
                        const nestedCondition: any = {};
                        switch (op.toLowerCase()) {
                            case "equals":
                                nestedCondition["status_rid"] = { [Op.eq]: val };
                                break;
                            case "not_equals":
                                nestedCondition["status_rid"] = {
                                    [Op.or]: [{ [Op.ne]: val }, { [Op.is]: null }],
                                };
                                break;
                            case "in":
                                nestedCondition["status_rid"] = {
                                    [Op.in]: Array.isArray(val) ? val : [val],
                                };
                                break;
                            case "is_empty":
                                nestedCondition["status_rid"] = {
                                    [Op.or]: [{ [Op.is]: null }, { [Op.eq]: "" }],
                                };
                                break;
                        }
                        if (Object.keys(nestedCondition).length > 0) {
                            whereClause[Op.and].push(nestedCondition);
                        }
                    });
                    break; // instead of return

                case "resource_code":
                    // Process each operator in the filter object separately
                    Object.entries(filter).forEach(([op, val]) => {
                        if (val === undefined) return;

                        const nestedCondition: any = {};
                        switch (op.toLowerCase()) {
                            case "equals":
                                nestedCondition["$resource.resource_code$"] = {
                                    [Op.eq]: val,
                                };
                                break;
                            case "not_equals":
                                nestedCondition["$resource.resource_code$"] = {
                                    [Op.or]: [{ [Op.ne]: val }, { [Op.is]: null }],
                                };
                                break;
                            case "in":
                                nestedCondition["$resource.resource_code$"] = {
                                    [Op.in]: Array.isArray(val) ? val : [val],
                                };
                                break;
                            case "is_empty":
                                nestedCondition["$resource.resource_code$"] = {
                                    [Op.or]: [{ [Op.is]: null }, { [Op.eq]: "" }],
                                };
                                break;
                        }

                        if (Object.keys(nestedCondition).length > 0) {
                            whereClause[Op.and].push(nestedCondition);
                        }
                    });
                    return; // Skip the default condition push at the end

                case "task_name":
                    switch (operator.toLowerCase()) {
                        case "equals":
                            condition[field] = { [Op.iLike]: value };
                            break;
                        case "not_equals":
                            condition[field] = {
                                [Op.or]: [{ [Op.notILike]: value }, { [Op.is]: null }],
                            };
                            break;
                        case "contains":
                            condition[field] = { [Op.iLike]: `%${value}%` };
                            break;
                        case "is_empty":
                            condition[field] = {
                                [Op.or]: [{ [Op.is]: null }, { [Op.eq]: "" }],
                            };
                            break;
                    }
                    break;

                case "task_description":
                    switch (operator.toLowerCase()) {
                        case "equals":
                            condition[field] = { [Op.iLike]: value };
                            break;
                        case "not_equals":
                            condition[field] = {
                                [Op.or]: [{ [Op.notILike]: value }, { [Op.is]: null }],
                            };
                            break;
                        case "contains":
                            condition[field] = { [Op.iLike]: `%${value}%` };
                            break;
                        case "is_empty":
                            condition[field] = {
                                [Op.or]: [{ [Op.is]: null }, { [Op.eq]: "" }],
                            };
                            break;
                    }
                    break;

                case "task_type_rid":
                    Object.entries(filter).forEach(([op, val]) => {
                        if (val === undefined) return;
                        const nestedCondition: any = {};
                        switch (op.toLowerCase()) {
                            case "equals":
                                nestedCondition["task_type_rid"] = { [Op.eq]: val };
                                break;
                            case "not_equals":
                                nestedCondition["task_type_rid"] = {
                                    [Op.or]: [{ [Op.ne]: val }, { [Op.is]: null }],
                                };
                                break;
                            case "in":
                                nestedCondition["task_type_rid"] = {
                                    [Op.in]: Array.isArray(val) ? val : [val],
                                };
                                break;
                            case "is_empty":
                                nestedCondition["task_type_rid"] = {
                                    [Op.or]: [{ [Op.is]: null }, { [Op.eq]: "" }],
                                };
                                break;
                        }
                        if (Object.keys(nestedCondition).length > 0) {
                            whereClause[Op.and].push(nestedCondition);
                        }
                    });
                    break;

                case "task_classification_rid":
                    Object.entries(filter).forEach(([op, val]) => {
                        if (val === undefined) return;
                        const nestedCondition: any = {};
                        switch (op.toLowerCase()) {
                            case "equals":
                                nestedCondition["task_classification_rid"] = { [Op.eq]: val };
                                break;
                            case "not_equals":
                                nestedCondition["task_classification_rid"] = {
                                    [Op.or]: [{ [Op.ne]: val }, { [Op.is]: null }],
                                };
                                break;
                            case "in":
                                nestedCondition["task_classification_rid"] = {
                                    [Op.in]: Array.isArray(val) ? val : [val],
                                };
                                break;
                            case "is_empty":
                                nestedCondition["task_classification_rid"] = {
                                    [Op.or]: [{ [Op.is]: null }, { [Op.eq]: "" }],
                                };
                                break;
                        }
                        if (Object.keys(nestedCondition).length > 0) {
                            whereClause[Op.and].push(nestedCondition);
                        }
                    });
                    break;

                default:
                    logMessage(`Unhandled filter field: ${field}`);
            }

            if (Object.keys(condition).length > 0) {
                whereClause[Op.and].push(condition);
            }
        });

        return { whereClause: whereClause[Op.and].length > 0 ? whereClause : {} };
    }

    async fetchAttachmentsBytaskId(task_rid: string): Promise<any[]> {
        try {
            const sequelize = await initMainDbSequelize();

            const result = await sequelize.query(
                rawQueries.fetchAttachmentSummaryByTask(),
                {
                    replacements: { task_rid },
                    type: "SELECT",
                }
            );

            return result;
        } catch (error) {
            errorLog("projectTaskService - fetchAttachmentsBytaskId", (error as Error).message);
            throw new Error("Failed to fetch attachments");
        }
    }

    async insertUserDetails(taskData: any): Promise<any> {
        try {
            const mainDbInit = await initMainDbSequelize();

            const createdById = taskData.created_by;
            const modifiedById = taskData.modified_by;

            const getUserFullName = async (userId: string) => {
                if (!userId) return null;

                const [results] = await mainDbInit.query(
                    rawQueries.fetchUserById(),
                    {
                        replacements: { userId },
                        type: "SELECT",
                    }
                );

                if (!results) return null;

                const { first_name, middle_name, last_name } = results as any;
                return [first_name, middle_name, last_name].filter(Boolean).join(" ");
            };

            const createdName = await getUserFullName(createdById);
            const modifiedName = await getUserFullName(modifiedById);

            // Create a new object with user details instead of modifying the original
            const taskWithUserDetails = {
                ...taskData,
                created_name: createdName || null,
                modified_name: modifiedName || null,
            };

            return taskWithUserDetails;
        } catch (err) {
            errorLog("projectTaskService - insertUserDetails", (err as Error).message);
            return taskData; // Return original task on error
        }
    }

    applyTextFilter(fieldValue: string, filter: any): boolean {
        const value = (fieldValue ?? "").trim().toLowerCase();

        if (filter.equals !== undefined) {
            return value === filter.equals.trim().toLowerCase();
        }
        if (filter.not_equals !== undefined) {
            return (
                value !== filter.not_equals.trim().toLowerCase() ||
                value === null ||
                value === ""
            );
        }
        if (filter.contains !== undefined) {
            return value.includes(filter.contains.trim().toLowerCase());
        }
        if (filter.is_empty !== undefined) {
            return filter.is_empty ? value === "" : value !== "";
        }

        return true; // No filtering if no valid operator is provided
    }

}