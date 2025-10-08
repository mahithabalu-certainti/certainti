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
            return {
              statusCode: HttpStatus.BAD_REQUEST,
              message: "Validation Error",
              errorMessage:
                "Effort cannot exceed the total hours in the duration",
            };
          }
        } else if (start_date && !end_date) {
          if (newEffort.gt(24)) {
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
      await transaction.rollback();
      console.log(":Errror creataing project task", error);
      throw this.throwServiceError(error as Error);
    }
  }

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
            return {
              statusCode: HttpStatus.BAD_REQUEST,
              message: "Validation Error",
              errorMessage: validation.errorMessage,
            };
          }
        } else if (start_date && !end_date) {
          if (newEffort.gt(24)) {
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

      await transaction.commit();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projectTask: updatedTask,
        },
      };
    } catch (error) {
      await transaction.rollback();
      console.log(":Errror creataing project task", error);
      throw this.throwServiceError(error as Error);
    }
  }

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
      throw this.throwServiceError(error as Error);
    }
  }

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
          console.error("Failed to rollback transaction:", rollbackErr);
        }
      }
      console.log("Error aggregation project task", err);
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
      return {
        success: false,
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: (err as Error).message || "Unknown error",
      };
    }
  }

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
        return {
          success: false,
          errorMessage: `Effort cannot exceed the total hours in the duration`,
        };
      }
    }

    return { success: true };
  }

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
        throw new Error("Invalid account ID");
      }

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
          projectTaskStatus = "Anomaly";
        } else if (
          projectTaskOld?.total_cost_pro_task &&
          currencyThreshold !== null &&
          Number(projectTaskOld.total_cost_pro_task) > currencyThreshold
        ) {
          projectTaskStatus = "Anomaly";
        }
      }

      if (action === "accept") {
        // 1. Update status to 'Active'
        const taskStatus = statusMap.get(projectTaskStatus);
        const activeStatusId = statusMap.get("Active");
        const activeId: any = await mainDbSequelize.query(
          `SELECT rid FROM ${MAIN_SCHEMA_NAME}.status WHERE status_name ILIKE '%active%'`
        );

        await this.projectTaskSchema.updateProjectTaskStatus(
          accountNumber,
          projectTaskRid,
          taskStatus,
          userId,
          transaction
        );
        const projectTask = await this.projectTaskSchema.fetchProjectTaskById(
          accountNumber,
          projectTaskRid
        );

        if (!projectTask) {
          throw new Error("Project Task not found");
        }

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

        // 2. Fetch required data for aggregation
        const {
          account_rid,
          project_fiscal_rid,
          fiscal_year,
          region_rid,
          country_rid,
          project_rid,
        } = projectTask;

        const resourceData =
          await this.projectResourceSchema.validateResourceByCode(
            accountNumber,
            data.resourceCode,
            account_rid
          );
        if (!resourceData) {
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
      await transaction.rollback();
      console.log("Error handling accepted anomaly", err);
      throw this.throwServiceError(err as Error);
    }
  }
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
          resource_name : data.resource_name
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
