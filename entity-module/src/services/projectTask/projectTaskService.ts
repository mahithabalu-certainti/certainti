import Decimal from "decimal.js";
import { HttpStatus } from "../../utils/constants";
import { ICreateProjectTask, IUpdateProjectTask } from "../../utils/types";
import { ProjectTaskSchemaService } from "./schemaService";
import { ProjectResourceSchemaService } from "../projectResource/schemaService";
import { Resources } from "../../models/resource";
import { ProjectFiscal } from "../../models/projectFiscal";
import { ProjectTask } from "../../models/projectTask";

export class ProjectInjestionTaskService {
  projectTaskSchema: ProjectTaskSchemaService;
  private projectResourceSchema: ProjectResourceSchemaService;

  constructor() {
    this.projectTaskSchema = new ProjectTaskSchemaService();
    this.projectResourceSchema = new ProjectResourceSchemaService();
  }

  async createProjectTask(
    projectTaskData: ICreateProjectTask,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectTask: any };
  }> {
    const dbInit = await this.projectTaskSchema.getSequelize();
    const transaction = await dbInit.transaction();
    try {
      const {
        start_date,
        end_date,
        total_hours_pro_task,
        project_fiscal_rid,
        account_rid,
        resource_code,
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
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectTask: any };
  }> {
    const dbInit = await this.projectTaskSchema.getSequelize();
    const transaction = await dbInit.transaction();

    try {
      const {
        start_date,
        end_date,
        total_hours_pro_task,
        project_fiscal_rid,
        project_task_rid,
        account_rid,
        resource_code,
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

    async runAggregationAfterInlineUpdate(
    accountNumber: string,
    projectTaskData: any,
    fullTaskData: ProjectTask
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
        transaction
      );

      await transaction.commit();
      transactionCompleted = true;
    } catch (err) {
      if (!transactionCompleted) {
        try {
          await transaction.rollback();
        } catch (rollbackErr) {
          console.error('Failed to rollback transaction:', rollbackErr);
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
}
