import Decimal from "decimal.js";
import {
  HttpStatus,
  MAIN_SCHEMA_NAME,
  rawQueries,
} from "../../utils/constants";
import {
  IAnomalyStatus,
  ICreateProjectResource,
  ICreateProjectTask,
  IUpdateProjectTask,
  CaseStatusResult
} from "../../utils/types";
import { ProjectTaskSchemaService } from "./schemaService";
import { ProjectResourceSchemaService } from "../projectResource/schemaService";
import { Resources } from "../../models/resource";
import { ProjectFiscal } from "../../models/projectFiscal";
import { ProjectTask } from "../../models/projectTask";
import {
  getCurrencyThreshold,
  getResourceStatuses,
} from "../resourceCostService";
import { Sequelize } from "sequelize";
import { initOrgSequelize } from "../../config/orgDataSource";
import { initMainDbSequelize } from "../../config/mainDataSource";
import moment from "moment";
import { ProjectResource } from "../../models/projectResource";
import { fetchResCodeWithPrjResRole } from "../../utils/rawQueries";
import { errorLog, logMessage } from "../../utils/helpers";
import ProjectIngestionService from "../projectIngestionService";
import { Case } from "../../models/caseModel";
import { Logger } from "winston";



export class ProjectInjestionTaskService {
  projectTaskSchema: ProjectTaskSchemaService;
  private projectResourceSchema: ProjectResourceSchemaService;
  private mainDbSequelize: Sequelize | null = null;
  private orgDbSequelize: Sequelize | null = null;
  private projectIngestion: ProjectIngestionService;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.projectTaskSchema = new ProjectTaskSchemaService();
    this.projectResourceSchema = new ProjectResourceSchemaService();
    this.projectIngestion = new ProjectIngestionService(this.logger);
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
 * Creates a new project task with detailed validation, transactional database operations,
 * and anomaly detection based on effort and cost thresholds.
 * 
 * Validates input data, checks for existing tasks to prevent duplicates,
 * calculates effort limits within the task duration,
 * determines task status including anomaly detection,
 * and manages transactional inserts and timeline logging.
 * 
 * @param {ICreateProjectTask} projectTaskData - Data object containing the details of the project task to create.
 * @param {string} userId - The ID of the user initiating the creation.
 * @param {string} userPreference - User preference for handling duplicate tasks.
 * @returns {Promise<{
 *   statusCode: number;
  *   message: string;
  *   errorMessage?: string;
  *   data?: { projectTask: any };
  * }>} Returns an object indicating success, prompt, or error status along with relevant messages and created task data.
  * 
  * @throws Will rollback the transaction and throw an error if any unexpected failure occurs during the creation process.
  */ 
  async createProjectTask(
    projectTaskData: ICreateProjectTask,
    userId: string,
    userPreference: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectTask: any };
  }> {
    const dbInit = await this.projectTaskSchema.getSequelize();
    const transaction = await dbInit.transaction();
    const mainDbSequelize = await this.getMainDbSequelize();
    const orgDbSequelize = await this.getOrgDbSequelize();
    let projectResourceResult: string;
    try {
      const {
        start_date,
        end_date,
        total_hours_pro_task,
        total_cost_pro_task,
        project_fiscal_rid,
        account_rid,
        resource_code,
        comments,
        project_resource_rid,
      } = projectTaskData;

      const validationResult = await this.validateProjectTaskInputs({
        account_rid,
        resource_code,
        project_fiscal_rid,
        projectResourceSchema: this.projectResourceSchema,
      });

      if (!validationResult.success) {
        return validationResult;
      }

      const { accountNumber, resourceData, projectData } = validationResult;

      await this.projectTaskSchema.createProjectTaskTables(accountNumber);

      const newEffort = new Decimal(total_hours_pro_task || "0");
      logMessage(`New Effort: ${newEffort}`);

      if (!newEffort.isZero() && !newEffort.isNaN()) {
        if (start_date && end_date) {
          const start = new Date(start_date);
          const end = new Date(end_date);
          const diffDays =
            Math.floor(
              (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
            ) + 1;
          const maxAllowedEffort = new Decimal(diffDays * 24);

          const existingTasks: ProjectTask[] =
            await this.projectTaskSchema.getExistingEffortInProjectTask(
              accountNumber,
              projectTaskData,
              resourceData.rid!
            );
          const validation = this.validatePerDayEffortLimit(
            existingTasks,
            newEffort,
            start,
            end
          );
          if (!validation.success) {
            return {
              statusCode: HttpStatus.BAD_REQUEST,
              message: "Validation Error",
              errorMessage: validation.errorMessage,
            };
          }

          const totalExistingEffort = existingTasks.reduce(
            (sum: Decimal, task: ProjectTask) => {
              const effort = new Decimal(task.total_hours_pro_task || "0");
              return sum.plus(effort);
            },
            new Decimal(0)
          );

          const totalEffort = totalExistingEffort.plus(newEffort);
          if (totalEffort.gt(maxAllowedEffort)) {
            logMessage(`Total effort ${totalEffort} exceeds max allowed ${maxAllowedEffort}`);
            return {
              statusCode: HttpStatus.BAD_REQUEST,
              message: "Validation Error",
              errorMessage:
                "Effort cannot exceed the total hours in the duration",
            };
          }
        } else if (start_date && !end_date) {
          if (newEffort.gt(24)) {
            logMessage(`New effort ${newEffort} exceeds 24 hours for single day`);
            return {
              statusCode: HttpStatus.BAD_REQUEST,
              message: "Validation Error",
              errorMessage: "Effort cannot exceed 24 hours for the day",
            };
          }
        }
      }
      let status = "Active";
      const statusMap = await getResourceStatuses(mainDbSequelize);
      const activeStatusId: any = statusMap?.get(status);
      const activeId: any = await mainDbSequelize.query(
        rawQueries.fetchActiveStatusRid(status)
      );

      const schemaName = rawQueries.fetchSchemaName(accountNumber);
      const findResourceAlreadyInPrjResource: any = await orgDbSequelize.query(
        rawQueries.checkResCodeExistsInPrjRes(schemaName, project_resource_rid)
      );
      if (findResourceAlreadyInPrjResource[0].length > 0) {
        projectResourceResult = findResourceAlreadyInPrjResource[0][0].rid;
      }
      const getAccountCurrencyRid: any = await mainDbSequelize.query(
        rawQueries.fetchAccountCurrencyRid(account_rid)
      );
      const costFields = {
        total_hours_pro_task,
        total_cost_pro_task,
      };
      const costValues: any = Object.entries(costFields).reduce(
        (acc, [key, value]) => {
          // Normalize empty string to null
          if (value === null || value === undefined) {
            acc[key] = null;
          } else {
            try {
              // Convert valid string/number to Decimal
              acc[key] = new Decimal(value).toString();
            } catch (error) {
              logMessage(`Error converting ${key} to Decimal: ${(error as Error).message}`);
              throw new Error(`Invalid number format for ${key}: ${value}`);
            }
          }
          return acc;
        },
        {} as Record<string, string | null>
      );

      // Get currency threshold
      const currencyThreshold = await getCurrencyThreshold(
        mainDbSequelize,
        getAccountCurrencyRid[0][0].currency_rid
      );

      const startDate = this.formatDateForDb(start_date as string);
      const endDate = this.formatDateForDb(end_date as string);

      const existingTask = await this.projectTaskSchema.findDuplicateTask(
        accountNumber,
        resourceData.rid,
        startDate,
        endDate,
        statusMap,
        comments,
        account_rid,
        project_fiscal_rid,
        costValues
      );

      if (existingTask && (userPreference === null || userPreference === "")) {
        logMessage("Duplicate task found with same compensation details");
        return {
          statusCode: HttpStatus.PROMPT,
          message:
            "Entered compensation details already exists for the Project Task. Would you like to create another compensation with same values?",
          data: {
            projectTask: existingTask,
          },
        };
      }
      if (
        total_hours_pro_task !== undefined &&
        Number(total_hours_pro_task) > 3000
      ) {
          logMessage(`Total hours per task ${total_hours_pro_task} exceeds 3000`);
        status = "Anomaly";
      } else if (
        total_cost_pro_task !== undefined &&
        currencyThreshold !== null &&
        Number(total_cost_pro_task) > currencyThreshold
      ) {
        logMessage(`Total cost per task ${total_cost_pro_task} exceeds currency threshold ${currencyThreshold}`);
        status = "Anomaly";
      }
      const statusRid: any = statusMap?.get(status);
      projectTaskData.status_rid = statusRid;
      projectTaskData.total_cost_pro_task = costValues["total_cost_pro_task"];
      projectTaskData.total_hours_pro_task = costValues["total_hours_pro_task"];
      projectTaskData.project_resource_rid = projectResourceResult!;
      // Proceed to insert
      const newTask = await this.projectTaskSchema.addProjectTask(
        accountNumber,
        projectTaskData,
        userId,
        projectData,
        resourceData,
        transaction
      );
      if (newTask) {
        await this.projectTaskSchema.addProjectTaskTimeline(
          accountNumber,
          "create",
          projectTaskData,
          newTask.rid,
          userId,
          transaction
        );
      }

      await this.projectTaskSchema.startAggregation(
        accountNumber,
        projectTaskData,
        projectData,
        resourceData,
        projectData.fiscal_year,
        resourceData.rid!,
        userId,
        activeStatusId,
        activeId[0][0].rid,
        transaction
      );

      await transaction.commit();
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: { projectTask: newTask },
      };
    } catch (error) {
      logMessage(`Error creating project task: ${(error as Error).message}`);
      await transaction.rollback();
      throw this.throwServiceError(error as Error);
    }
  }

  /**
 * Updates an existing project task with the provided data, performing validations and status checks.
 * 
 * This method performs the following:
 * - Starts a database transaction.
 * - Validates input data including effort limits and resource existence.
 * - Checks for duplicate compensation details and prompts if found.
 * - Calculates and sets anomaly status based on effort or cost thresholds.
 * - Updates the project task record in the database.
 * - Logs timeline and history entries related to the update.
 * - Updates related aggregations asynchronously.
 * - Commits the transaction on success or rolls back on failure.
 * 
 * @param {IUpdateProjectTask} projectTaskData - The project task data to update.
 * @param {string} userId - The ID of the user performing the update.
 * @param {string} userPreference - User preference flag to handle duplicate compensation prompts.
 * 
 * @returns {Promise<{
 *   statusCode: number;
  *   message: string;
  *   errorMessage?: string;
  *   data?: { projectTask: any };
  * }>} Result of the update operation, including the updated task or an error/prompt response.
  * 
  * @throws Throws an error if the update process fails and rolls back the transaction.
  */ 
  async updateProjectTask(
    projectTaskData: IUpdateProjectTask,
    userId: string,
    userPreference: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectTask: any };
  }> {
    const dbInit = await this.projectTaskSchema.getSequelize();
    const transaction = await dbInit.transaction();
    const mainDbSequelize = await this.getMainDbSequelize();
    const orgDbSequelize = await this.getOrgDbSequelize();
    let projectResourceResult: string | undefined = "";

    try {
      const {
        start_date,
        end_date,
        total_hours_pro_task,
        total_cost_pro_task,
        project_fiscal_rid,
        project_task_rid,
        account_rid,
        resource_code,
        comments,
        project_resource_rid,
      } = projectTaskData;

      const validationResult = await this.validateProjectTaskUpdateInputs({
        account_rid,
        resource_code,
        project_fiscal_rid,
        project_task_rid,
        projectResourceSchema: this.projectResourceSchema,
        projectTaskSchema: this.projectTaskSchema,
      });

      if (!validationResult.success) {
        return validationResult;
      }

      const { accountNumber, resourceData, projectData, taskData } =
        validationResult;
      
      if (projectData.is_qualified) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Qualified project cannot be updated.",
        };
      }

      const newEffort = new Decimal(total_hours_pro_task || "0");

      if (!newEffort.isZero() && !newEffort.isNaN()) {
        if (start_date && end_date) {
          const start = new Date(start_date);
          const end = new Date(end_date);
          const diffDays =
            Math.floor(
              (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
            ) + 1;
          const maxAllowedEffort = new Decimal(diffDays * 24);

          const existingTasks: ProjectTask[] =
            await this.projectTaskSchema.getExistingEffortInProjectTask(
              accountNumber,
              projectTaskData,
              resourceData.rid!
            );

          const filteredTasks = existingTasks.filter(
            (task) => task.rid !== projectTaskData.project_task_rid
          );

          const validation = this.validatePerDayEffortLimit(
            filteredTasks,
            newEffort,
            start,
            end
          );

          if (!validation.success) {
            logMessage(`Validation failed: ${validation.errorMessage}`);
            return {
              statusCode: HttpStatus.BAD_REQUEST,
              message: "Validation Error",
              errorMessage: validation.errorMessage,
            };
          }
        } else if (start_date && !end_date) {
          if (newEffort.gt(24)) {
            logMessage(`New effort ${newEffort} exceeds 24 hours for single day`);
            return {
              statusCode: HttpStatus.BAD_REQUEST,
              message: "Validation Error",
              errorMessage: "Effort cannot exceed 24 hours for the day",
            };
          }
        }
      }

      let status = "Active";
      const statusMap = await getResourceStatuses(mainDbSequelize);
      const activeId: any = await mainDbSequelize.query(
        rawQueries.fetchActiveStatusRid(status)
      );
      const activeStatusId: any = statusMap?.get(status);

      const schemaName = rawQueries.fetchSchemaName(accountNumber);
      const findResourceAlreadyInPrjResource: any = await orgDbSequelize.query(
        rawQueries.checkResCodeExistsInPrjRes(schemaName, project_resource_rid)
      );
      if (findResourceAlreadyInPrjResource[0].length > 0) {
        projectResourceResult = findResourceAlreadyInPrjResource[0][0].rid;
      }
      const getAccountCurrencyRid: any = await mainDbSequelize.query(
        rawQueries.fetchAccountCurrencyRid(account_rid)
      );
      const costFields = {
        total_hours_pro_task,
        total_cost_pro_task,
      };
      const costValues: any = Object.entries(costFields).reduce(
        (acc, [key, value]) => {
          // Normalize empty string to null
          if (value === null || value === undefined) {
            acc[key] = null;
          } else {
            try {
              // Convert valid string/number to Decimal
              acc[key] = new Decimal(value).toString();
            } catch (error) {
              logMessage(`Error converting ${key} to Decimal: ${(error as Error).message}`);
              throw new Error(`Invalid number format for ${key}: ${value}`);
            }
          }
          return acc;
        },
        {} as Record<string, string | null>
      );

      // Get currency threshold
      const currencyThreshold = await getCurrencyThreshold(
        mainDbSequelize,
        getAccountCurrencyRid[0][0].currency_rid
      );
      const startDate = this.formatDateForDb(start_date as string);
      const endDate = this.formatDateForDb(end_date as string);

      const existingTask = await this.projectTaskSchema.findDuplicateTask(
        accountNumber,
        resourceData.rid,
        startDate,
        endDate,
        statusMap,
        comments,
        account_rid,
        project_fiscal_rid,
        costValues
      );

      if (existingTask && (userPreference === null || userPreference === "")) {
        logMessage("Duplicate task found with same compensation details");
        return {
          statusCode: HttpStatus.PROMPT,
          message:
            "Entered compensation details already exists for the Project Task. Would you like to create another compensation with same values?",
          data: {
            projectTask: existingTask,
          },
        };
      }
      if (
        total_hours_pro_task !== undefined &&
        Number(total_hours_pro_task) > 3000
      ) {
          logMessage(`Total hours per task ${total_hours_pro_task} exceeds 3000`);
        status = "Anomaly";
      } else if (
        total_cost_pro_task !== undefined &&
        currencyThreshold !== null &&
        Number(total_cost_pro_task) > currencyThreshold
      ) {
        status = "Anomaly";
      }
      const statusRid: any = statusMap?.get(status);
      projectTaskData.status_rid = statusRid;
      projectTaskData.total_cost_pro_task = costValues["total_cost_pro_task"];
      projectTaskData.total_hours_pro_task = costValues["total_hours_pro_task"];
      projectTaskData.project_resource_rid = projectResourceResult!;
      // Proceed to update
      const updatedTask = await this.projectTaskSchema.updateProjectTask(
        accountNumber,
        projectTaskData,
        userId,
        projectData,
        resourceData,
        transaction
      );
      if (updatedTask) {
        await this.projectTaskSchema.addProjectTaskTimeline(
          accountNumber,
          "update",
          projectTaskData,
          projectTaskData.project_task_rid,
          userId,
          transaction
        );
        await this.projectTaskSchema.addProjctTaskHistory(
          accountNumber,
          projectTaskData,
          taskData,
          project_task_rid,
          userId,
          transaction
        );
      }

      await this.projectTaskSchema.startUpdateAggregation(
        accountNumber,
        projectTaskData,
        taskData,
        resourceData,
        projectData.fiscal_year,
        resourceData.rid!,
        projectData,
        userId,
        activeStatusId,
        activeId[0][0].rid,
        transaction
      );
            
      let projectCaseMapping: any = [];
      const {accountNumber: validAccountNumber}  = await this.projectIngestion.fetchValidAccountNumberById(account_rid);
      const checkTableExists =  await this.projectIngestion.checkCaseProjectsTableExists(validAccountNumber);  
      if (checkTableExists) {
        projectCaseMapping = 
        await this.projectIngestion.fetchProjectFiscalCaseMapping(
          accountNumber,
          projectData.rid
        );
      }

      if (projectCaseMapping.length > 0) {  

        for (const caseMapping of projectCaseMapping) {
          const caseData = await Case.findOne({
            where: {
              rid: caseMapping.case_rid,
            },
          });
        
          if (!caseData) {
            continue;
          }
          const mainSequelize = await initMainDbSequelize();

          const caseStatus = await mainSequelize.query(
            rawQueries.fetchCaseStatusByRid(caseData.status_rid),
            {
              type: "SELECT",
            }
          ) as CaseStatusResult[];
        
          if (caseStatus[0]?.status_name === "Closed") {
            continue;
          }

          await this.projectTaskSchema.updateCaseProjectTask(
            accountNumber,
            projectTaskData,
            userId,
            projectData,
            resourceData,
            transaction,
            caseMapping
          );
          
        }
      }

      await transaction.commit();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projectTask: updatedTask,
        },
      };
    } catch (error) {
      errorLog( "Update Project Task", (error as Error).message );
      await transaction.rollback();
      throw this.throwServiceError(error as Error);
    }
  }

  /**
 * Retrieves the list of project task types.
 *
 * This method performs the following steps:
 * - Fetches project task types from the project task schema.
 * - Returns a success response with the list of project task types.
 * - If an error occurs, it throws a service error with the caught error.
 *
 * @returns {Promise<{
 *   statusCode: number;
  *   message: string;
  *   errorMessage?: string;
  *   data?: { projectTaskTypes: any };
  * }>} The response object containing:
  *   - statusCode: HTTP status code indicating success.
  *   - message: Success message string.
  *   - errorMessage: Optional error message if an error occurs.
  *   - data: Object containing the array of project task types.
  *
  * @throws Throws a service error if fetching project task types fails.
  */ 
  async listProjectTaskTypes(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectTaskTypes: any };
  }> {
    try {
      const projectTaskTypes =
        await this.projectTaskSchema.fetchProjectTaskTypes();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projectTaskTypes,
        },
      };
    } catch (error) {
      errorLog("List Project Task Types", (error as Error).message);
      throw this.throwServiceError(error as Error);
    }
  }

  /**
 * Retrieves the list of project task classifications.
 *
 * This method performs the following steps:
 * - Fetches project task classifications from the project task schema.
 * - Returns a success response containing the list of project task classifications.
 * - Throws a service error if any error occurs during the fetch operation.
 *
 * @returns {Promise<{
 *   statusCode: number;
  *   message: string;
  *   errorMessage?: string;
  *   data?: { projectTaskClassification: any };
  * }>} The response object containing:
  *   - statusCode: HTTP status code indicating success.
  *   - message: Success message string.
  *   - errorMessage: Optional error message if an error occurs.
  *   - data: Object containing the array of project task classifications.
  *
  * @throws Throws a service error if fetching project task classifications fails.
  */ 
  async listProjectTaskClassification(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectTaskClassification: any };
  }> {
    try {
      const projectTaskClassification =
        await this.projectTaskSchema.fetchProjectTaskClassification();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projectTaskClassification,
        },
      };
    } catch (error) {
      errorLog("List Project Task Classification", (error as Error).message);
      throw this.throwServiceError(error as Error);
    }
  }

  async runAggregationAfterInlineUpdate(
    accountNumber: string,
    projectTaskData: any,
    fullTaskData: ProjectTask,
    activeId: string,
    activeStatusId: string
  ) {
    const dbInit = await this.projectTaskSchema.getSequelize();
    const transaction = await dbInit.transaction();
    let transactionCompleted = false; // Track transaction state manually

    try {
      const { rid, userId, account_rid } = projectTaskData;

      const mergedTaskData = {
        ...fullTaskData,
        ...projectTaskData,
      };

      const shouldRunAggregation =
        "resource_code" in projectTaskData ||
        "total_cost_pro_task" in projectTaskData ||
        "total_hours_pro_task" in projectTaskData;

      if (!shouldRunAggregation) {
        await transaction.rollback();
        transactionCompleted = true;
        return;
      }

      const {
        resource_code: updatedResourceCode,
        project_fiscal_rid,
        account_rid: effectiveAccountRid,
        resource_rid,
      } = mergedTaskData;

      let resolvedResourceCode = updatedResourceCode;

      if (!resolvedResourceCode && resource_rid) {
        const resource = await this.projectResourceSchema.validateResourceById(
          accountNumber,
          resource_rid,
          account_rid
        );
        if (!resource) {
          await transaction.rollback();
          transactionCompleted = true;
          return;
        }
        resolvedResourceCode = resource.resource_code;
      }

      if (!resolvedResourceCode) {
        await transaction.rollback();
        transactionCompleted = true;
        return;
      }

      const validationResult = await this.validateProjectTaskUpdateInputs({
        account_rid: effectiveAccountRid,
        resource_code: resolvedResourceCode,
        project_fiscal_rid,
        project_task_rid: rid,
        projectResourceSchema: this.projectResourceSchema,
        projectTaskSchema: this.projectTaskSchema,
      });

      if (!validationResult.success) {
        await transaction.rollback();
        transactionCompleted = true;
        return validationResult;
      }

      const { resourceData, projectData, taskData } = validationResult;

      await this.projectTaskSchema.startUpdateAggregation(
        accountNumber,
        mergedTaskData,
        fullTaskData,
        resourceData,
        projectData.fiscal_year,
        resourceData.rid!,
        projectData,
        userId,
        activeStatusId,
        activeId,
        transaction
      );

      await transaction.commit();
      transactionCompleted = true;
    } catch (err) {
      if (!transactionCompleted) {
        try {
          await transaction.rollback();
        } catch (rollbackErr) {
          errorLog("Failed to rollback transaction", (rollbackErr as Error).message);
        }
      }
      errorLog("Error aggregation project task", (err as Error).message);
      throw err; // Re-throw the error after handling
    }
  }

  async validateProjectTaskInputs({
    account_rid,
    resource_code,
    project_fiscal_rid,
    projectResourceSchema,
  }: {
    account_rid: string;
    resource_code: string;
    project_fiscal_rid: string;
    projectResourceSchema: ProjectResourceSchemaService;
  }): Promise<
    | {
        success: true;
        accountNumber: string;
        resourceData: Resources;
        projectData: ProjectFiscal;
      }
    | {
        success: false;
        statusCode: number;
        message: string;
        errorMessage: string;
      }
  > {
    try {
      const { accountNumber } =
        await projectResourceSchema.fetchValidAccountNumberById(account_rid);

      if (!accountNumber) {
        logMessage("Invalid account ID");
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: "Invalid account ID",
          errorMessage: "Invalid account ID",
        };
      }

      const resourceData = await projectResourceSchema.validateResourceByCode(
        accountNumber,
        resource_code,
        account_rid
      );

      if (!resourceData) {
        logMessage("Invalid resource code: resource doesn't exist");
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid resource code: resource doesn't exist",
        };
      }

      const projectData = await projectResourceSchema.validateProjectFiscalById(
        accountNumber,
        project_fiscal_rid
      );

      if (!projectData) {
        logMessage("Invalid project ID");
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: "Invalid project ID",
          errorMessage: "Invalid project for the given account number",
        };
      }

      return {
        success: true,
        accountNumber,
        resourceData,
        projectData,
      };
    } catch (err) {
      errorLog("Validate Project Task Inputs", (err as Error).message);
      return {
        success: false,
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: (err as Error).message || "Unknown error",
      };
    }
  }

  async validateProjectTaskUpdateInputs({
    account_rid,
    resource_code,
    project_fiscal_rid,
    project_task_rid,
    projectResourceSchema,
    projectTaskSchema,
  }: {
    account_rid: string;
    resource_code: string;
    project_fiscal_rid: string;
    project_task_rid: string;
    projectResourceSchema: ProjectResourceSchemaService;
    projectTaskSchema: ProjectTaskSchemaService;
  }): Promise<
    | {
        success: true;
        accountNumber: string;
        resourceData: Resources;
        projectData: ProjectFiscal;
        taskData: ProjectTask;
      }
    | {
        success: false;
        statusCode: number;
        message: string;
        errorMessage: string;
      }
  > {
    try {
      const { accountNumber } =
        await projectResourceSchema.fetchValidAccountNumberById(account_rid);

      if (!accountNumber) {
        logMessage("Invalid account ID");
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: "Invalid account ID",
          errorMessage: "Invalid account ID",
        };
      }

      const resourceData = await projectResourceSchema.validateResourceByCode(
        accountNumber,
        resource_code,
        account_rid
      );

      if (!resourceData) {
        logMessage("Invalid resource code: resource doesn't exist");
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid resource code: resource doesn't exist",
        };
      }

      const projectData = await projectResourceSchema.validateProjectFiscalById(
        accountNumber,
        project_fiscal_rid
      );

      if (!projectData) {
        logMessage("Invalid project ID");
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: "Invalid project ID",
          errorMessage: "Invalid project for the given account number",
        };
      }

      const projectTaskData = await projectTaskSchema.validateProjectTaskById(
        accountNumber,
        project_task_rid,
        account_rid
      );

      if (!projectTaskData) {
        logMessage("Invalid task ID: project task doesn't exist");
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: "Invalid task ID",
          errorMessage: "Project task does not exist for the given account",
        };
      }

      return {
        success: true,
        accountNumber,
        resourceData,
        projectData,
        taskData: projectTaskData,
      };
    } catch (err) {
      errorLog("Error validating project task update inputs", (err as Error).message);
      return {
        success: false,
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: (err as Error).message || "Unknown error",
      };
    }
  }

  /**
 * Retrieves the list of resource codes assigned to a specific project fiscal period for a given account.
 * 
 * This method performs the following:
 * - Validates the provided account ID by fetching the corresponding account number.
 * - Throws an error if the account ID is invalid.
 * - Queries the project tasks schema to list all assigned resource codes for the given account and project fiscal period.
 * - Returns the resource codes along with a success status and message.
 * 
 * @param {string} accountId - The identifier for the account.
 * @param {string} projectFiscalId - The identifier for the project fiscal period.
 * 
 * @returns {Promise<{
 *   statusCode: number;
  *   message: string;
  *   errorMessage?: string;
  *   data?: { resourceCodes: any };
  * }>} Object containing the status, message, and the list of assigned resource codes.
  * 
  * @throws Throws a service error if the account ID is invalid or if the query fails.
  */ 
  async getAssignedResourceCodes(
    accountId: string,
    projectFiscalId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceCodes: any };
  }> {
    try {
      const { accountNumber } =
        await this.projectResourceSchema.fetchValidAccountNumberById(accountId);

      if (!accountNumber) {
        logMessage("Invalid account ID");
        throw new Error("Invalid account ID");
      }
      const resourceCodes =
        await this.projectTaskSchema.listAssignedResourceCodes(
          accountNumber,
          accountId,
          projectFiscalId
        );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resourceCodes,
        },
      };
    } catch (err) {
      errorLog("Get Assigned Resource Codes", (err as Error).message);
      throw this.throwServiceError(err as Error);
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
    existingTasks: ProjectTask[],
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
 * Handles anomaly status actions for a given project task.
 *
 * This method performs the following:
 * - Initiates a database transaction.
 * - Validates the provided account ID and fetches the corresponding account number.
 * - Retrieves the existing project task by its RID.
 * - Depending on the anomaly type and action:
 *    - If type is "Duplicate", checks thresholds to determine if the task status should be marked as "Anomaly".
 *    - If action is "accept":
 *       - Updates the project task status to "Active".
 *       - Adds an entry to the project task history.
 *       - Validates related resource and project fiscal data.
 *       - Triggers aggregation updates related to the project task.
 *       - Commits the transaction.
 *    - If action is other than "accept":
 *       - Updates the project task status to "In-Active".
 *       - Adds an entry to the project task history.
 *       - Commits the transaction.
 * - Returns success messages indicating whether the anomaly was accepted or rejected.
 * - Rolls back the transaction and throws a service error if any step fails.
 *
 * @param {IAnomalyStatus} data - Object containing details about the anomaly status action, including accountId, project task RID, action, and type.
 * @param {string} userId - ID of the user performing the action.
 *
 * @returns {Promise<{
 *   statusCode: number;
  *   message: string;
  *   data?: { projectTask: any };
  * }>} Result of the anomaly handling process with status and message.
  *
  * @throws Throws a service error if account ID is invalid, project task is not found, resource code is invalid, or any database operation fails.
  */ 
  async handleAnomalyStatus(
    data: IAnomalyStatus,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    data?: { projectTask: any };
  }> {
    const dbInit = await this.projectResourceSchema.getSequelize();
    const transaction = await dbInit.transaction();
    const mainDbSequelize = await this.getMainDbSequelize();

    const { accountId, rid: projectTaskRid, action, type } = data;

    try {
      const { accountNumber } =
        await this.projectResourceSchema.fetchValidAccountNumberById(accountId);

      if (!accountNumber) {
        logMessage("Invalid account ID");
        throw new Error("Invalid account ID");
      }

      const projectTask = await this.projectTaskSchema.fetchProjectTaskById(
        accountNumber,
        projectTaskRid
      );

      if (!projectTask) {
        logMessage("Project Task not found");
        throw new Error("Project Task not found");
      }

      // 2. Fetch required data for aggregation
      const {
        account_rid,
        project_fiscal_rid,
        fiscal_year,
        region_rid,
        country_rid,
        project_rid,
      } = projectTask;

      const projectData = await this.projectResourceSchema.validateProjectFiscalById(
        accountNumber,
        project_fiscal_rid
      );

      let projectTaskStatus = "Active";
      const statusMap: any =
        await this.projectResourceSchema.getResourceStatuses();
      const getAccountCurrencyRid: any = await mainDbSequelize.query(
        rawQueries.fetchAccountCurrencyRid(accountId)
      );
      const projectTaskOld = await this.projectTaskSchema.fetchProjectTaskById(
        accountNumber,
        projectTaskRid
      );

      if (!projectTaskOld) {
        logMessage("Project Task not found");
        throw new Error("Project Task not found");
      }

      if (type == "Duplicate") {
        const currencyThreshold = await getCurrencyThreshold(
          mainDbSequelize,
          getAccountCurrencyRid[0][0].currency_rid
        );
        if (
          projectTaskOld.total_hours_pro_task &&
          Number(projectTaskOld.total_hours_pro_task) > 3000
        ) {
          logMessage("Total hours per task exceeds 3000");
          projectTaskStatus = "Anomaly";
        } else if (
          projectTaskOld?.total_cost_pro_task &&
          currencyThreshold !== null &&
          Number(projectTaskOld.total_cost_pro_task) > currencyThreshold
        ) {
          logMessage("Total cost per task exceeds currency threshold");
          projectTaskStatus = "Anomaly";
        }
      }

      let projectCaseMapping: any = [];
      const {accountNumber: validAccountNumber}  = await this.projectIngestion.fetchValidAccountNumberById(account_rid);
      const checkTableExists =  await this.projectIngestion.checkCaseProjectsTableExists(validAccountNumber);  
      if (checkTableExists) {
        projectCaseMapping = 
        await this.projectIngestion.fetchProjectFiscalCaseMapping(
          accountNumber,
          project_fiscal_rid
        );
      }

      if (action === "accept") {
        // 1. Update status to 'Active'
        const taskStatus = statusMap.get(projectTaskStatus);
        const activeStatusId = statusMap.get("Active");
        const activeId: any = await mainDbSequelize.query(
          rawQueries.fetchActiveStatus()
        );

        await this.projectTaskSchema.updateProjectTaskStatus(
          accountNumber,
          projectTaskRid,
          taskStatus,
          userId,
          transaction
        );

        await this.projectTaskSchema.addProjctTaskHistory(
          accountNumber,
          {
            ...projectTask,
            status_rid: activeStatusId,
          },
          projectTaskOld,
          projectTaskRid,
          userId,
          transaction
        );

        const resourceData =
          await this.projectResourceSchema.validateResourceByCode(
            accountNumber,
            data.resourceCode,
            account_rid
          );
        if (!resourceData) {
          logMessage("Invalid resource code");
          throw new Error("Invalid resource code");
        }

        const projectData =
          await this.projectResourceSchema.validateProjectFiscalById(
            accountNumber,
            project_fiscal_rid
          );
        let projectTaskData: any = {
          project_task_rid: projectTask.rid,
          project_fiscal_rid: projectTask.project_fiscal_rid,
          account_rid: projectTask.account_rid,
          resource_id: resourceData.rid,
          resource_code: resourceData.resource_code,
          total_hours_pro_task: projectTask.total_hours_pro_task,
          total_cost_pro_task: projectTask.total_cost_pro_task,
          fiscal_year: projectTask.fiscal_year,
          country_rid: projectTask.country_rid,
          region_rid: projectTask.region_rid,
          currency_rid: projectTask.currency_rid,
          start_date: projectTask.start_date,
          end_date: projectTask.end_date,
          comments: projectTask.comments,
          created_by: projectTask.created_by,
          modified_by: projectTask.modified_by,
          status_rid: projectTask.status_rid,
        };
        const aggreation = await this.projectTaskSchema.startUpdateAggregation(
          accountNumber,
          projectTaskData,
          projectTaskOld,
          resourceData,
          projectData.fiscal_year,
          resourceData.rid!,
          projectData,
          userId,
          activeStatusId,
          activeId[0][0].rid,
          transaction
        );

        if (projectCaseMapping.length > 0) {  

          for (const caseMapping of projectCaseMapping) {
            const caseData = await Case.findOne({
              where: {
                rid: caseMapping.case_rid,
              },
            });
          
            if (!caseData) {
              continue;
            }
            const mainSequelize = await initMainDbSequelize();
          
            const caseStatus = await mainSequelize.query(
              rawQueries.fetchCaseStatusByRid(caseData.status_rid),
              {
                type: "SELECT",
              }
            ) as CaseStatusResult[];
          
            if (caseStatus[0]?.status_name === "Closed") {
              continue;
            }

            await this.projectTaskSchema.updateCaseProjectTaskStatus(
              accountNumber,
              projectTaskRid,
              taskStatus,
              userId,
              transaction,
              caseMapping
            );
          
          }
        }
        

        await transaction.commit();

        return {
          statusCode: HttpStatus.SUCCESS,
          message: "Anomaly accepted successfully",
          data: {
            projectTask: {},
          },
        };
      } else {
        const statusMap: any =
          await this.projectResourceSchema.getResourceStatuses();
        const activeStatusId = statusMap.get("In-Active");

        await this.projectTaskSchema.updateProjectTaskStatus(
          accountNumber,
          projectTaskRid,
          activeStatusId,
          userId,
          transaction
        );

        await this.projectTaskSchema.addProjctTaskHistory(
          accountNumber,
          {
            ...projectTaskOld,
            status_rid: activeStatusId,
          },
          projectTaskOld,
          projectTaskRid,
          userId,
          transaction
        );

        await transaction.commit();
        return {
          statusCode: HttpStatus.SUCCESS,
          message: "Anomaly rejected successfully",
          data: {
            projectTask: {},
          },
        };
      }
    } catch (err) {
      logMessage(`Error handling anomaly status: ${(err as Error).message}`);
      await transaction.rollback();
      throw this.throwServiceError(err as Error);
    }
  }

  /**
 * Lists resource codes associated with a project task based on the provided filters.
 *
 * This method performs the following steps:
 * - Initializes connections to the organization's and main databases.
 * - Fetches the parent account number for the provided account RID.
 * - Determines the schema name corresponding to the parent account.
 * - Fetches the RID for the "Active" status from the main database.
 * - Queries the organization's database to retrieve resource codes with their project resource roles,
 *   filtered by the schema name, search term, active status, account RID, and project fiscal RID.
 * - If resources are found, maps and returns an array of objects containing resource RID, resource code, and role.
 * - If no resources are found, returns an empty array with a "Not Found" status.
 *
 * @param {any} data - An object containing filtering parameters including:
 *   - account_rid: The account record ID.
 *   - project_fiscal_rid: The project fiscal record ID.
 *   - search: Optional search term to filter resource codes.
 *
 * @returns {Promise<any>} An object containing:
 *   - statusCode: HTTP status code indicating success or not found.
 *   - data: Array of resource code objects or an empty array.
 *
 * @throws Throws an error if database queries fail.
 */
  async listResourceCodeForProjectTask(data: any): Promise<any> {
    const orgDb = await this.getOrgDbSequelize();
    const mainDb = await this.getMainDbSequelize();

    const parentRnumber: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    const schemaName = rawQueries.fetchSchemaName(parentRnumber[0][0].r_number);
    let status = "Active";
    const activeId: any = await mainDb.query(
      rawQueries.fetchActiveStatusRid(status)
    );
    const result: any = await orgDb.query(
      fetchResCodeWithPrjResRole(
        schemaName,
        data.search,
        activeId[0][0].rid,
        data.account_rid,
        data.project_fiscal_rid
      )
    );
    if (result[0].length > 0) {
      const finalResult = result[0].map((data: any) => {
        return {
          rid : data.rid,
          resource_code : data.resource_code,
          project_resource_role : data.project_resource_role,
          resource_name : data.resource_name,
          start_date : data.start_date,
          end_date : data.end_date
        }
      })
      return {
        statusCode: HttpStatus.SUCCESS,
        data: finalResult,
      };
    } else {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        data: [],
      };
    }
  }
}
