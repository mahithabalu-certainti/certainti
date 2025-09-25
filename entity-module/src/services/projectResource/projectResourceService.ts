import { Op, Order, Sequelize } from "sequelize";
import { HttpStatus, STATUS_MESSAGE, rawQueries } from "../../utils/constants";
import {
  IAnomalyStatus,
  ICreateProjectResource,
  IUpdateInlineProjectResource,
  IUpdateProjectResource,
} from "../../utils/types";
import { ProjectResourceSchemaService } from "./schemaService";
import { ProjectResourceMapper } from "../../utils/projectMapper";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import ProjectIngestionService from "../projectIngestionService";
import { Logger } from "winston";
import moment from "moment";
import Decimal from "decimal.js";
import { ProjectResource } from "../../models/projectResource";

export class ProjectResourceService {
  private projectResourceSchema: ProjectResourceSchemaService;
  private projectIngestion: ProjectIngestionService;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.projectResourceSchema = new ProjectResourceSchemaService();
    this.projectIngestion = new ProjectIngestionService(this.logger);
  }

  async createProjectResource(
    projectResourceData: ICreateProjectResource,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectResource: any };
  }> {
    const dbInit = await this.projectResourceSchema.getSequelize();
    const transaction = await dbInit.transaction();
    try {
      const {
        account_rid,
        project_fiscal_rid,
        resource_code,
        start_date,
        end_date,
      } = projectResourceData;
      const { accountNumber } =
        await this.projectResourceSchema.fetchValidAccountNumberById(
          account_rid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }

      const resourceData =
        await this.projectResourceSchema.validateResourceByCode(
          accountNumber,
          resource_code,
          account_rid
        );

      if (!resourceData) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid resource code: resource doesn't exists",
        };
      }

      const projectFiscalData =
        await this.projectResourceSchema.validateProjectFiscalById(
          accountNumber,
          project_fiscal_rid
        );

      await this.projectResourceSchema.createProjectResourcesTable(
        accountNumber
      );

      let projectResource =  null;

      if (projectFiscalData) {
        const existsInProjectResource =
          await this.projectResourceSchema.existsInProjectResourceTable(
            accountNumber,
            account_rid,
            projectFiscalData,
            resourceData,
            projectFiscalData.fiscal_year,
            projectFiscalData.project_code,
            resource_code,
            start_date,
            end_date
          );

        const statusMap =
          await this.projectResourceSchema.getResourceStatuses();
        const currencyThreshold =
          await this.projectResourceSchema.getCurrencyThreshold(
            projectResourceData.currency_rid
          );

        const isDuplicate =
          await this.projectResourceSchema.findDuplicateProjectResource(
            accountNumber,
            projectResourceData,
            resourceData,
            statusMap
          );

          if (isDuplicate) {
            return {
              statusCode: HttpStatus.BAD_REQUEST,
              message: HttpStatus.BAD_REQUEST_MESSAGE,
              errorMessage: "Resource role already exists"
            };
          }

        const newEffort = new Decimal(projectResourceData.total_hours_pro_res || "0");

        if (!newEffort.isZero() && !newEffort.isNaN()) {
          if (start_date && end_date) {
            const start = new Date(start_date);
            const end = new Date(end_date);
            const diffDays =
              Math.floor(
                (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
              ) + 1;
            const maxAllowedEffort = new Decimal(diffDays * 24);
  
            const existingTasks: ProjectResource[] =
              await this.projectResourceSchema.getExistingEffortInProjectResource(
                accountNumber,
                projectResourceData,
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
              (sum: Decimal, task: ProjectResource) => {
                const effort = new Decimal(task.total_hours_pro_res || "0");
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
        if (
          projectResourceData.total_hours_pro_res &&
          Number(projectResourceData.total_hours_pro_res) > 3000
        ) {
          status = "Anomaly";
        }

        if (
          projectResourceData.total_cost_pro_res !== undefined &&
          currencyThreshold !== null &&
          Number(projectResourceData.total_cost_pro_res) > currencyThreshold
        ) {
          status = "Anomaly";
        }

        const stausId = statusMap?.get(status) ?? "";

        projectResource =
          await this.projectResourceSchema.insertIntoProjectResourceTable(
            accountNumber,
            projectFiscalData.project_code,
            projectResourceData,
            projectFiscalData.project_rid,
            projectFiscalData.fiscal_year,
            userId,
            stausId,
            transaction
          );

        if (projectResource) {
          await this.projectResourceSchema.addProjectResourceTimeline(
            accountNumber,
            "create",
            projectResourceData,
            projectResource.rid,
            userId,
            transaction
          );
        }

        if (status === "Anomaly") {
          await transaction.commit();
          return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
              projectResource: projectResourceData,
            },
          };
        }

        // if (!existsInProjectResource) {
        const existsInResourceTable =
          await this.projectResourceSchema.existsInResourceTable(
            accountNumber,
            account_rid,
            resource_code,
            transaction
          );

        // if (!existsInResourceTable) {
        //   await this.projectResourceSchema.insertIntoResourceTable(
        //     accountNumber,
        //     account_rid,
        //     userId,
        //     projectResourceData,
        //     transaction
        //   );
        // }

        const existsInResourceFiscal =
          await this.projectResourceSchema.existsInResourceFiscalTable(
            accountNumber,
            account_rid,
            resource_code,
            projectFiscalData.fiscal_year,
            transaction
          );

        if (!existsInResourceFiscal) {
          await this.projectResourceSchema.insertIntoResourceFiscalTable(
            accountNumber,
            account_rid,
            userId,
            projectResourceData,
            projectFiscalData.fiscal_year,
            transaction
          );
        }

        if (projectResourceData.region_rid) {
          const existsInResourceFiscalRegion =
            await this.projectResourceSchema.existsInResourceFiscalRegionTable(
              accountNumber,
              account_rid,
              resource_code,
              projectResourceData.region_rid,
              projectFiscalData.fiscal_year,
              transaction
            );

          if (!existsInResourceFiscalRegion) {
            await this.projectResourceSchema.insertIntoResourceFiscalRegionTable(
              accountNumber,
              account_rid,
              userId,
              projectResourceData,
              projectFiscalData.fiscal_year,
              transaction
            );
          }
        }
        // else {
        //   await this.projectResourceSchema.updateResourceFiscalTable(
        //     accountNumber,
        //     account_rid,
        //     userId,
        //     projectResourceData,
        //     transaction
        //   );
        // }

        // project
        // const existsInProjectFiscal =
        //   await this.projectResourceSchema.existsInProjectFiscalTable(
        //     accountNumber,
        //     account_rid,
        //     projectData.project_code,
        //     fiscal_year,
        //     transaction
        //   );
        // if (!existsInProjectFiscal) {
        //   const createdProjectFiscal = await this.projectResourceSchema.insertProjectFiscalTable(
        //     accountNumber,
        //     account_rid,
        //     projectData.project_code,
        //     fiscal_year,
        //     projectResourceData,
        //     userId,
        //     transaction
        //   );

        //   await this.projectResourceSchema.insertProjectFiscalSummaryTable(
        //     accountNumber,
        //     account_rid,
        //     projectData.project_code,
        //     fiscal_year,
        //     projectResourceData,
        //     userId,
        //     createdProjectFiscal,
        //     transaction
        //   );
        // }

        if (projectResourceData.region_rid) {
          const existsInProjectFiscalRegion =
            await this.projectResourceSchema.existsInProjectFiscalRegionTable(
              accountNumber,
              account_rid,
              projectResourceData.project_fiscal_rid,
              projectFiscalData.fiscal_year,
              projectResourceData.region_rid,
              transaction
            );

          if (!existsInProjectFiscalRegion) {
            await this.projectResourceSchema.insertProjectFiscalRegionTable(
              accountNumber,
              projectFiscalData.project_code,
              projectResourceData,
              resourceData,
              projectFiscalData.fiscal_year,
              userId,
              transaction
            );
          }
        }

        // account fiscal
        // const exisitInAccountFiscal = await this.projectResourceSchema.existsInAccountFiscalTable(
        //   accountNumber,
        //   account_rid,
        //   fiscal_year,
        //   transaction
        // );
        // if(!exisitInAccountFiscal){
        //   await this.projectResourceSchema.insertIntoAccountFiscal(
        //     accountNumber,
        //     projectResourceData,
        //     userId,
        //     transaction
        //   );
        // };

        if (projectResourceData.region_rid) {
          const exisitInAccountFiscalRegion =
            await this.projectResourceSchema.existsInAccountFiscalRegionTable(
              accountNumber,
              account_rid,
              projectFiscalData.fiscal_year,
              projectResourceData.region_rid,
              transaction
            );
          if (!exisitInAccountFiscalRegion) {
            await this.projectResourceSchema.insertIntoAccountFiscalRegion(
              accountNumber,
              projectResourceData,
              resourceData,
              projectFiscalData.fiscal_year,
              projectResourceData.region_rid,
              userId,
              transaction
            );
          }
        }

        // project resource

        const existsInProjectResourceFiscal =
          await this.projectResourceSchema.existsInProjectResourceFiscalTable(
            accountNumber,
            account_rid,
            projectFiscalData.fiscal_year,
            projectResourceData.project_fiscal_rid,
            resourceData.rid || "",
            projectResourceData.country_rid,
            transaction
          );
        if (!existsInProjectResourceFiscal) {
          await this.projectResourceSchema.insertIntoProjectResourceFiscalTable(
            accountNumber,
            projectResourceData,
            projectFiscalData,
            userId,
            projectResource,
            transaction
          );
        } else {
          await this.projectResourceSchema.updateProjectResourceFiscalTable(
            accountNumber,
            projectResourceData,
            projectFiscalData,
            projectFiscalData.fiscal_year,
            projectFiscalData.rid,
            resourceData.rid || "",
            userId,
            transaction
          );
        }

        if (projectResourceData.region_rid) {
          const existsInProjectResourceFiscalRegion =
            await this.projectResourceSchema.existsInProjectResourceFiscalRegionTable(
              accountNumber,
              account_rid,
              projectFiscalData.fiscal_year,
              projectFiscalData.rid,
              resourceData.rid || "",
              projectResourceData.country_rid || null,
              projectResourceData.region_rid,
              transaction
            );

          if (!existsInProjectResourceFiscalRegion) {
            await this.projectResourceSchema.insertIntoProjectResourceFiscalRegionTable(
              accountNumber,
              projectResourceData,
              projectFiscalData.project_rid,
              projectFiscalData.project_code,
              projectFiscalData.fiscal_year,
              userId,
              projectResource,
              transaction
            );
          } else {
            await this.projectResourceSchema.updateProjectResourceFiscalRegionTable(
              accountNumber,
              projectResourceData,
              projectFiscalData,
              projectFiscalData.fiscal_year,
              projectFiscalData.rid,
              resourceData.rid || "",
              userId,
              transaction
            );
          }
        }

        await this.projectResourceSchema.aggregatesProjectFiscal(
          accountNumber,
          account_rid,
          projectResourceData.project_fiscal_rid,
          projectFiscalData.fiscal_year,
          statusMap,
          transaction
        );

        await this.projectResourceSchema.aggregatesProjectFiscalRegion(
          accountNumber,
          account_rid,
          projectFiscalData.project_code,
          projectFiscalData.rid,
          projectFiscalData.fiscal_year,
          statusMap,
          transaction
        );

        await this.projectResourceSchema.aggregatesProjectFiscalSummary(
          accountNumber,
          account_rid,
          projectFiscalData.rid,
          projectFiscalData.project_code,
          projectFiscalData.fiscal_year,
          statusMap,
          transaction
        );

        // await this.projectResourceSchema.aggregatesProject(
        //   accountNumber,
        //   account_rid,
        //   projectFiscalData.project_code,
        //   transaction
        // );

        // await this.projectResourceSchema.aggregatesProjectSummary(
        //   accountNumber,
        //   account_rid,
        //   projectFiscalData.project_code,
        //   transaction
        // );

        await this.projectResourceSchema.aggregatesResourceFiscal(
          accountNumber,
          account_rid,
          projectResourceData.resource_code,
          resourceData,
          projectFiscalData.fiscal_year,
          statusMap,
          transaction
        );

        await this.projectResourceSchema.aggregatesResourceFiscalRegion(
          accountNumber,
          account_rid,
          projectResourceData.resource_code,
          resourceData,
          projectFiscalData.fiscal_year,
          statusMap,
          transaction
        );

        await this.projectResourceSchema.aggregatesAccountFiscal(
          accountNumber,
          account_rid,
          projectFiscalData.fiscal_year,
          transaction
        );

        await this.projectResourceSchema.aggregatesAccountFiscalRegion(
          accountNumber,
          account_rid,
          projectFiscalData.fiscal_year,
          transaction
        );

        // await this.projectResourceSchema.aggregatesAccount(
        //   accountNumber,
        //   account_rid,
        //   transaction
        // );

        await transaction.commit();
        // }
        // else {
        //   return {
        //     statusCode: HttpStatus.FAILED,
        //     message: HttpStatus.FAILED_MESSAGE,
        //     errorMessage:
        //       "Same Resource details already exist for the project in the account for the fiscal year",
        //   };
        // }
      }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projectResource: projectResource,
        },
      };
    } catch (err) {
      await transaction.rollback();
      console.log("Error creatng resource", err);
      throw this.throwServiceError(err as Error);
    }
  }

  private validatePerDayEffortLimit(
    existingTasks: ProjectResource[],
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
      if (task.start_date && task.end_date && task.total_hours_pro_res) {
        const taskStart = new Date(task.start_date).getTime();
        const taskEnd = new Date(task.end_date).getTime();
        const taskEffort = new Decimal(task.total_hours_pro_res || "0");
        const taskDays =
          Math.floor((taskEnd - taskStart) / (1000 * 60 * 60 * 24)) + 1;
        const perDay = taskEffort.div(taskDays);
  
        for (let d = 0; d < taskDays; d++) {
          const day = new Date(taskStart + d * 24 * 60 * 60 * 1000);
          const dayStr = day.toISOString().slice(0, 10);
          perDayEffort[dayStr] = (perDayEffort[dayStr] || new Decimal(0)).plus(perDay);
        }
      }
    }
  
    // New task
    const newPerDay = newEffort.div(diffDays);
    for (let d = 0; d < diffDays; d++) {
      const day = new Date(newTaskStart + d * 24 * 60 * 60 * 1000);
      const dayStr = day.toISOString().slice(0, 10);
      perDayEffort[dayStr] = (perDayEffort[dayStr] || new Decimal(0)).plus(newPerDay);
  
      if (perDayEffort[dayStr].gt(24)) {
        return {
          success: false,
          errorMessage: `Effort cannot exceed the total hours in the duration`,
        };
      }
    }
  
    return { success: true };
  }

  async updateProjectResource(
    projectResourceData: IUpdateProjectResource,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectResource: any };
  }> {
    const dbInit = await this.projectResourceSchema.getSequelize();
    const transaction = await dbInit.transaction();
    try {
      const { account_rid, project_fiscal_rid } = projectResourceData;

      const { accountNumber: validAccountNumber } =
        await this.projectResourceSchema.fetchValidAccountNumberById(
          account_rid
        );

      if (!validAccountNumber) {
        throw new Error("Invalid account ID");
      }

      const projectData =
        await this.projectResourceSchema.validateProjectFiscalById(
          validAccountNumber,
          project_fiscal_rid
        );

      const resourceData =
        await this.projectResourceSchema.validateResourceByCode(
          validAccountNumber,
          projectResourceData.resource_code,
          account_rid
        );

      if (!resourceData) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid resource code: resource doesn't exists",
        };
      }

      const statusMap = await this.projectResourceSchema.getResourceStatuses();
      const currencyThreshold =
        await this.projectResourceSchema.getCurrencyThreshold(
          projectResourceData.currency_rid
        );

      const isDuplicate =
        await this.projectResourceSchema.findDuplicateProjectResourceOnUpdate(
          validAccountNumber,
          projectResourceData,
          resourceData,
          statusMap
        );

      if (isDuplicate) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: "Resource role already exists"
        };
      }

      const newEffort = new Decimal(projectResourceData.total_hours_pro_res || "0");

      if (!newEffort.isZero() && !newEffort.isNaN()) {
        if (projectResourceData.start_date && projectResourceData.end_date) {
          const start = new Date(projectResourceData.start_date);
          const end = new Date(projectResourceData.end_date);
          const diffDays =
            Math.floor(
              (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
            ) + 1;
          const maxAllowedEffort = new Decimal(diffDays * 24);

          const existingTasks: ProjectResource[] =
            await this.projectResourceSchema.getExistingEffortInProjectResource(
              validAccountNumber,
              projectResourceData,
              resourceData.rid!
            );

          const filteredResources = existingTasks.filter(
            (res) => res.rid !== projectResourceData.project_resource_rid 
          );
          
          const validation = this.validatePerDayEffortLimit(
            filteredResources,
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
        } else if (projectResourceData.start_date && !projectResourceData.end_date) {
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
      if (
        projectResourceData.total_hours_pro_res &&
        Number(projectResourceData.total_hours_pro_res) > 3000
      ) {
        status = "Anomaly";
      }

      if (
        projectResourceData.total_cost_pro_res !== undefined &&
        currencyThreshold !== null &&
        Number(projectResourceData.total_cost_pro_res) > currencyThreshold
      ) {
        status = "Anomaly";
      }

      const stausId = statusMap?.get(status) ?? "";

      const existingProjectResource =
        await this.projectResourceSchema.fetchExistingProjectResource(
          validAccountNumber,
          projectResourceData.project_resource_rid,
          transaction
        );

      const updateProjectResource =
        await this.projectResourceSchema.updateProjectResourceRecords(
          validAccountNumber,
          projectResourceData,
          userId,
          resourceData.rid || "",
          projectData,
          stausId,
          transaction
        );

      // project resources
      await this.updateFiscalTables(
        validAccountNumber,
        projectResourceData,
        projectData,
        userId,
        existingProjectResource,
        resourceData,
        statusMap,
        transaction
      );

      // resources fiscal and region
      await this.updateResourceFiscalRegion(
        validAccountNumber,
        account_rid,
        projectResourceData,
        resourceData,
        userId,
        existingProjectResource,
        projectData.fiscal_year,
        statusMap,
        transaction
      );

      // project fiscal region
      await this.updateProjectFiscalRegion(
        validAccountNumber,
        projectResourceData,
        projectData,
        resourceData,
        userId,
        statusMap,
        transaction
      );

      // account fiscal region
      await this.updateAccountFiscalRegion(
        validAccountNumber,
        projectResourceData,
        existingProjectResource,
        projectData,
        userId,
        statusMap,
        transaction
      );

      // resources
      await this.aggregateResource(
        validAccountNumber,
        account_rid,
        projectResourceData,
        projectData,
        resourceData,
        statusMap,
        transaction
      );

      // projects
      await this.aggregateProject(
        validAccountNumber,
        account_rid,
        projectResourceData,
        projectData,
        statusMap,
        transaction
      );

      // accounts
      await this.aggregateAccount(
        validAccountNumber,
        account_rid,
        projectData.fiscal_year,
        transaction
      );

      await this.recordTimelineAndHistory(
        validAccountNumber,
        projectResourceData,
        projectResourceData,
        userId,
        transaction
      );

      await transaction.commit();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projectResource: updateProjectResource,
        },
      };
    } catch (err) {
      console.log("Error updating project resource", err);
      await transaction.rollback();
      throw this.throwServiceError(err as Error);
    }
  }

  async handleAnomalyStatus(
    data: IAnomalyStatus,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    data?: { projectResource: any };
  }> {
    const dbInit = await this.projectResourceSchema.getSequelize();
    const transaction = await dbInit.transaction();

    const { accountId, rid: projectResourceRid, action } = data;

    try {
      const { accountNumber } =
        await this.projectResourceSchema.fetchValidAccountNumberById(accountId);

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }

      const projectResource =
        await this.projectResourceSchema.fetchProjectResourceById(
          accountNumber,
          projectResourceRid
        );

      if (!projectResource) {
        throw new Error("Project resource not found");
      }

      if (action === "accept") {
        // 1. Update status to 'Active'
        const statusMap: any =
          await this.projectResourceSchema.getResourceStatuses();
        const activeStatusId = statusMap.get("Active");

        await this.projectResourceSchema.updateProjectResourceStatus(
          accountNumber,
          projectResourceRid,
          activeStatusId,
          userId,
          transaction
        );

        await this.projectResourceSchema.addProjectResourceHistory(
          accountNumber,
          {
            ...projectResource,
            status_rid: activeStatusId,
          },
          projectResource,
          projectResourceRid,
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
        } = projectResource;

        const resourceData =
          await this.projectResourceSchema.validateResourceByCode(
            accountNumber,
            data.resourceCode,
            account_rid
          );

        if (!resourceData) {
          throw new Error("Invalid resource code");
        }

        const projectFiscalData =
          await this.projectResourceSchema.validateProjectFiscalById(
            accountNumber,
            project_fiscal_rid
          );

        const startDate = projectResource.start_date
          ? moment.utc(projectResource.start_date).format("YYYY-MM-DD")
          : null;

        const endDate = projectResource.end_date
          ? moment.utc(projectResource.end_date).format("YYYY-MM-DD")
          : null;

        const updatedProjectResourceData = {
          ...projectResource.dataValues,
          resource_code: resourceData.resource_code,
        };

        // project resources
        await this.updateFiscalTables(
          accountNumber,
          updatedProjectResourceData,
          projectFiscalData,
          userId,
          projectResource,
          resourceData,
          statusMap,
          transaction
        );

        // resources fiscal and region
        await this.updateResourceFiscalRegion(
          accountNumber,
          account_rid,
          updatedProjectResourceData,
          resourceData,
          userId,
          projectResource,
          projectFiscalData.fiscal_year,
          statusMap,
          transaction
        );

        // project fiscal region
        await this.updateProjectFiscalRegion(
          accountNumber,
          updatedProjectResourceData,
          projectFiscalData,
          resourceData,
          userId,
          statusMap,
          transaction
        );

        // account fiscal region
        await this.updateAccountFiscalRegion(
          accountNumber,
          updatedProjectResourceData,
          projectResource,
          projectFiscalData,
          userId,
          statusMap,
          transaction
        );

        // resources
        await this.aggregateResource(
          accountNumber,
          account_rid,
          updatedProjectResourceData,
          projectFiscalData,
          resourceData,
          statusMap,
          transaction
        );

        // projects
        await this.aggregateProject(
          accountNumber,
          account_rid,
          updatedProjectResourceData,
          projectFiscalData,
          statusMap,
          transaction
        );

        // accounts
        await this.aggregateAccount(
          accountNumber,
          account_rid,
          projectFiscalData.fiscal_year,
          transaction
        );

        await transaction.commit();

        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.SUCCESS_MESSAGE,
          data: {
            projectResource: {},
          },
        };
      } else {
        const statusMap: any =
          await this.projectResourceSchema.getResourceStatuses();
        const activeStatusId = statusMap.get("In-Active");

        await this.projectResourceSchema.updateProjectResourceStatus(
          accountNumber,
          projectResourceRid,
          activeStatusId,
          userId,
          transaction
        );

        await this.projectResourceSchema.addProjectResourceHistory(
          accountNumber,
          {
            ...projectResource,
            status_rid: activeStatusId,
          },
          projectResource,
          projectResourceRid,
          userId,
          transaction
        );

        await transaction.commit();
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.SUCCESS_MESSAGE,
          data: {
            projectResource: {},
          },
        };
      }
    } catch (err) {
      await transaction.rollback();
      console.log("Error handling accepted anomaly", err);
      throw this.throwServiceError(err as Error);
    }
  }

  async listProjectResources(
    accountId: string,
    projectId: string,
    fiscal_year: number,
    page: number,
    limit: number,
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string,
    search : string,
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectResources: any; count: number };
  }> {
    try {
      const { accountNumber } =
        await this.projectResourceSchema.fetchValidAccountNumberById(accountId);

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }

      const offset = (page - 1) * limit;

      // construct sorting
      const [finalSortBy, finalSortOrder] = this.getSortParameters(
        sortBy,
        sortOrder
      );
      const order: Order = [[finalSortBy, finalSortOrder]];

      // construct filters
      const { whereClause } = this.buildWhereClause(filters, search);

      let { data: projectResources, count } =
        await this.projectResourceSchema.listProjectResourceSchema(
          accountNumber,
          accountId,
          projectId,
          filters,
          whereClause,
          fiscal_year,
          offset,
          limit,
          order,
          sortBy,
          sortOrder
        );
      projectResources = projectResources.slice(offset, page * limit);

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projectResources,
          count,
        },
      };
    } catch (err) {
      console.log("Error fetching project ressouce", err);
      throw this.throwServiceError(err as Error);
    }
  }

  async exportProjectResources(
    accountId: string,
    projectId: string,
    fiscal_year: number,
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string,
    userId: string,
    search : string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectResources: any };
  }> {
    try {
      const { accountNumber } =
        await this.projectResourceSchema.fetchValidAccountNumberById(accountId);

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }

      // construct sorting
      const [finalSortBy, finalSortOrder] = this.getSortParameters(
        sortBy,
        sortOrder
      );
      const order: Order = [[finalSortBy, finalSortOrder]];

      // construct filters
      const { whereClause } = this.buildWhereClause(filters, search);

      const projectResources =
        await this.projectResourceSchema.exportProjectResourceSchema(
          accountNumber,
          accountId,
          projectId,
          filters,
          whereClause,
          fiscal_year,
          order,
          sortBy,
          sortOrder,
          userId
        );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projectResources,
        },
      };
    } catch (err) {
      console.log("Error fetching project ressouce", err);
      throw this.throwServiceError(err as Error);
    }
  }

  async projectResourceDetails(
    projectResourceId: string,
    accountId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectResource: any; attachment: any };
  }> {
    try {
      const { accountNumber } =
        await this.projectResourceSchema.fetchValidAccountNumberById(accountId);

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }

      const projectResource =
        await this.projectResourceSchema.fetchProjectResourceDetails(
          accountNumber,
          projectResourceId
        );

      // Fetch attachments for the project resource
      const attachments =
        await this.projectResourceSchema.fetchAttachmentsByProjectResourceId(
          projectResourceId
        );
      let mappedAttachments = [];
      if (attachments.length > 0) {
        const sequelize = await initMainDbSequelize();
        // Get all IDs from attachments
        const documentTypeIds = attachments.map(
          (attachment) => attachment.document_type_rid
        );
        const documentCategoryIds = attachments.map(
          (attachment) => attachment.document_category_rid
        );
        const userIds = attachments.map((attachment) => attachment.created_by);

        // Execute all queries in parallel
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
        mappedAttachments = attachments.map((attachment) => {
          const documentType = documentTypes.find(
            (dt: any) => dt.rid === attachment.document_type_rid
          );
          const documentCategory = documentCategories.find(
            (dc: any) => dc.rid === attachment.document_category_rid
          );
          const uploadedBy = users.find(
            (u: any) => u.rid === attachment.created_by
          );
          const attachedTo = projectResource?.r_number;

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
          projectResource,
          attachment: mappedAttachments,
        },
      };
    } catch (err) {
      console.log("Error fetching project ressouce", err);
      throw this.throwServiceError(err as Error);
    }
  }

  async inLineEditProjectResource(
    projectResourceData: IUpdateInlineProjectResource,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: any;
  }> {
    const dbInit = await this.projectResourceSchema.getSequelize();
    const transaction = await dbInit.transaction();
    try {
      const {
        account_rid,
        project_fiscal_rid,
        project_resource_rid,
        total_cost_pro_res,
        total_hours_pro_res,
        region_rid,
      } = projectResourceData;

      let total_cost_pro_res_new
      let total_hours_pro_res_new

      const { accountNumber: validAccountNumber } =
        await this.projectResourceSchema.fetchValidAccountNumberById(
          account_rid
        );

      if (!validAccountNumber) {
        throw new Error("Invalid account ID");
      }

      const statusMap: any =
        await this.projectResourceSchema.getResourceStatuses();

      const projectData =
        await this.projectResourceSchema.validateProjectFiscalById(
          validAccountNumber,
          project_fiscal_rid
        );

      let resourceData = null;

      const existingProjectResource =
        await this.projectResourceSchema.fetchExistingProjectResource(
          validAccountNumber,
          projectResourceData.project_resource_rid,
          transaction
        );

      if (!existingProjectResource) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage:
            "Invalid project resource ID: project resource doesn't exists",
        };
      }
      if(total_cost_pro_res) total_cost_pro_res_new = total_cost_pro_res
      else total_cost_pro_res_new = existingProjectResource.total_cost_pro_res

      if(total_hours_pro_res) total_hours_pro_res_new = total_hours_pro_res
      else total_hours_pro_res_new = existingProjectResource.total_hours_pro_res

      resourceData = await this.projectResourceSchema.validateResourceById(
        validAccountNumber,
        existingProjectResource?.resource_rid,
        account_rid
      );

      if (projectResourceData.resource_code) {
        resourceData = await this.projectResourceSchema.validateResourceByCode(
          validAccountNumber,
          projectResourceData.resource_code,
          projectResourceData.account_rid
        );
      }

      if (!resourceData) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid resource code: resource doesn't exists",
        };
      }

      if (projectResourceData.project_resource_role) {
        const isDuplicate =
        await this.projectResourceSchema.findDuplicateProjectResourceOnUpdate(
          validAccountNumber,
          projectResourceData,
          resourceData,
          statusMap
        );
        
      if (isDuplicate) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: "Resource role already exists"
        };
      }
      }

      const currencyThreshold =
        await this.projectResourceSchema.getCurrencyThreshold(
          existingProjectResource.currency_rid
        );

      const updatedProjectResourceInput: any = {
        country_rid: projectResourceData.country_rid ?? existingProjectResource.country_rid,
        currency_rid: existingProjectResource.currency_rid,
        region_rid: projectResourceData.region_rid ?? existingProjectResource.region_rid,
        start_date: existingProjectResource.start_date,
        end_date: existingProjectResource.end_date,
        total_hours_pro_res: projectResourceData.total_hours_pro_res ?? existingProjectResource.total_hours_pro_res,
        total_cost_pro_res: projectResourceData.total_cost_pro_res ?? existingProjectResource.total_cost_pro_res,
        deductions: existingProjectResource.deductions,
        description: projectResourceData.description ?? existingProjectResource.description,
        project_resource_rid: projectResourceData.project_resource_rid
      }

      const newEffort = new Decimal(projectResourceData.total_hours_pro_res || "0");

      if (!newEffort.isZero() && !newEffort.isNaN()) {
        const startDate = existingProjectResource.start_date;
        const endDate = existingProjectResource.end_date;
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          const diffDays =
            Math.floor(
              (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
            ) + 1;
          const maxAllowedEffort = new Decimal(diffDays * 24);

          const updateProjectTaskInput = {
            ...existingProjectResource,
            account_rid: projectResourceData.account_rid,
            start_date: existingProjectResource.start_date,
            end_date: existingProjectResource.end_date,
            resource_rid: resourceData.rid,
            project_fiscal_rid: projectResourceData.project_fiscal_rid
          }

          const existingResource: ProjectResource[] =
            await this.projectResourceSchema.getExistingEffortInProjectResource(
              validAccountNumber,
              updateProjectTaskInput,
              resourceData.rid!
            );

          const filteredTasks = existingResource.filter(
            (res) => res.rid !== projectResourceData.project_resource_rid 
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
              errorMessage : validation.errorMessage,
              message: HttpStatus.BAD_REQUEST_MESSAGE,
              data : null
            };
          }
        } else if (startDate && !endDate) {
          if (newEffort.gt(24)) {
            return {
              statusCode: HttpStatus.BAD_REQUEST,
              message: HttpStatus.BAD_REQUEST_MESSAGE,
              errorMessage: STATUS_MESSAGE.effort24HrsExceeded,
              data: null,
            };
          }
        }
      }

      // const isDuplicate =
      //   await this.projectResourceSchema.findDuplicateProjectResourceOnUpdate(
      //     validAccountNumber,
      //     updatedProjectResourceInput,
      //     resourceData,
      //     statusMap
      //   );

      // if (isDuplicate) {
      //   return {
      //     statusCode: HttpStatus.BAD_REQUEST,
      //     message: HttpStatus.BAD_REQUEST_MESSAGE,
      //     errorMessage: "Invalid resource role: resource role already exists"
      //   };
      // }

      let status = "Active";
      if (
        total_hours_pro_res_new &&
        Number(total_hours_pro_res_new) > 3000
      ) {
        status = "Anomaly";
      }

      if (
        total_cost_pro_res_new &&
        currencyThreshold !== null &&
        Number(total_cost_pro_res_new) > currencyThreshold
      ) {
        status = "Anomaly";
      }

      const stausId = statusMap?.get(status) ?? "";

      const updateProjectResource =
        await this.projectResourceSchema.updateInlineProjectResourceRecords(
          validAccountNumber,
          projectResourceData,
          userId,
          projectData,
          resourceData,
          stausId,
          transaction
        );

      if (
        updateProjectResource &&
        (total_cost_pro_res || total_hours_pro_res || region_rid)
      ) {
        const resourceUpdatePayload =
          ProjectResourceMapper.mapToProjectResourceUpload(
            updateProjectResource,
            userId,
            resourceData
          );

        // project resources
        await this.updateFiscalTables(
          validAccountNumber,
          resourceUpdatePayload,
          projectData,
          userId,
          existingProjectResource,
          resourceData,
          statusMap,
          transaction
        );

        // resources fiscal region
        await this.updateResourceFiscalRegion(
          validAccountNumber,
          account_rid,
          resourceUpdatePayload,
          resourceData,
          userId,
          existingProjectResource,
          projectData.fiscal_year,
          statusMap,
          transaction
        );

        // project fiscal region
        await this.updateProjectFiscalRegion(
          validAccountNumber,
          resourceUpdatePayload,
          projectData,
          resourceData,
          userId,
          statusMap,
          transaction
        );

        // account fiscal region
        await this.updateAccountFiscalRegion(
          validAccountNumber,
          resourceUpdatePayload,
          existingProjectResource,
          projectData,
          userId,
          statusMap,
          transaction
        );

        // resources
        await this.aggregateResource(
          validAccountNumber,
          account_rid,
          resourceUpdatePayload,
          projectData,
          resourceData,
          statusMap,
          transaction
        );

        // projects
        await this.aggregateProject(
          validAccountNumber,
          account_rid,
          resourceUpdatePayload,
          projectData,
          statusMap,
          transaction
        );

        // accounts
        await this.aggregateAccount(
          validAccountNumber,
          account_rid,
          projectData.fiscal_year,
          transaction
        );
      }

      await this.recordTimelineAndHistory(
        validAccountNumber,
        projectResourceData,
        projectResourceData,
        userId,
        transaction
      );

      await transaction.commit();

      const updateProjectResourceRecord =
        await this.projectResourceSchema.fetchProjectResourceDetails(
          validAccountNumber,
          project_resource_rid
        );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: updateProjectResourceRecord,
      };
    } catch (err) {
      console.log("Error updating project resource", err);
      await transaction.rollback();
      throw this.throwServiceError(err as Error);
    }
  }

  async getResourceSkillRoles(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceRoles: any };
  }> {
    try {
      const resourceRoles =
        await this.projectResourceSchema.listResourceSkillRoles();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resourceRoles,
        },
      };
    } catch (err) {
      throw this.throwServiceError(err as Error);
    }
  }

  async getResourceSkillRolesSubtype(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceRolesSubType: any };
  }> {
    try {
      const resourceRolesSubType =
        await this.projectResourceSchema.listResourceSkillRolesSubType();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resourceRolesSubType: resourceRolesSubType,
        },
      };
    } catch (err) {
      throw this.throwServiceError(err as Error);
    }
  }

  async getResourceCodes(
    accountId: string,
    search: string | null
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
      const resourceCodes = await this.projectResourceSchema.listResourceCodes(
        accountNumber,
        accountId,
        search
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
        await this.projectResourceSchema.listAssignedResourceCodes(
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

  private async updateFiscalTables(
    accountNumber: string,
    projectResourceData: any,
    projectData: any,
    userId: string,
    existingProjectResource: any,
    resourceData: any,
    statusMap: any,
    transaction: any
  ) {
    await this.projectResourceSchema.updateProjectResourceFiscalOnUpdateTable(
      accountNumber,
      projectResourceData,
      projectData.project_rid,
      projectData.fiscal_year,
      userId,
      resourceData,
      existingProjectResource,
      statusMap,
      transaction
    );

    await this.projectResourceSchema.updateProjectResourceFiscalRegionTableOnUpdate(
      accountNumber,
      projectResourceData,
      projectData.project_rid,
      projectData.fiscal_year,
      projectData.project_code,
      resourceData,
      userId,
      existingProjectResource,
      statusMap,
      transaction
    );
  }

  private async updateResourceFiscalRegion(
    accountNumber: string,
    accountId: string,
    projectResourceData: any,
    resourceData: any,
    userId: string,
    existingProjectResource: any,
    fiscalYear: number,
    statusMap: any,
    transaction: any
  ) {
    await this.projectResourceSchema.updateResourceFiscal(
      accountNumber,
      accountId,
      userId,
      projectResourceData,
      resourceData,
      fiscalYear,
      statusMap,
      transaction,
      existingProjectResource
    );

    // if (projectResourceData.region_rid) {
    // const existsInResourceFiscalRegion =
    //   await this.projectResourceSchema.existsInResourceFiscalRegionTable(
    //     accountNumber,
    //     accountId,
    //     projectResourceData.resource_code,
    //     projectResourceData.region_rid,
    //     transaction
    //   );

    // if (!existsInResourceFiscalRegion) {

    // }
    await this.projectResourceSchema.insertIntoResourceFiscalRegionTableOnUpdate(
      accountNumber,
      accountId,
      userId,
      projectResourceData,
      resourceData,
      fiscalYear,
      statusMap,
      transaction,
      existingProjectResource
    );
    // }
  }

  private async updateProjectFiscalRegion(
    accountNumber: string,
    projectResourceData: any,
    projectData: any,
    resourceData: any,
    userId: string,
    statusMap: any,
    transaction: any
  ) {
    // if (projectResourceData.region_rid) {
    // const existsInProjectFiscalRegion =
    //   await this.projectResourceSchema.existsInProjectFiscalRegionTable(
    //     accountNumber,
    //     accountId,
    //     projectData.project_code,
    //     projectData.fiscal_year,
    //     projectResourceData.region_rid,
    //     transaction
    //   );

    // if (!existsInProjectFiscalRegion) {
    await this.projectResourceSchema.insertProjectFiscalRegionTableOnUpdate(
      accountNumber,
      projectData.project_code,
      projectData.project_rid,
      projectResourceData,
      resourceData,
      projectData.fiscal_year,
      userId,
      statusMap,
      transaction
    );

    await this.projectResourceSchema.cleanupOrphanedProjectFiscalRegions(
      accountNumber,
      projectResourceData.account_rid,
      projectResourceData.project_fiscal_rid,
      projectData.project_code,
      projectData.fiscal_year,
      transaction
    );
    // }
    // }
  }

  private async updateAccountFiscalRegion(
    accountNumber: string,
    projectResourceData: any,
    existingProjectResource: any,
    projectData: any,
    userId: string,
    statusMap: any,
    transaction: any
  ) {
    // if (projectResourceData.region_rid) {
    // const exisitInAccountFiscalRegion =
    //   await this.projectResourceSchema.existsInAccountFiscalRegionTable(
    //     accountNumber,
    //     accountId,
    //     projectData.fiscal_year,
    //     projectResourceData.region_rid,
    //     transaction
    //   );
    // if (!exisitInAccountFiscalRegion) {
    await this.projectResourceSchema.insertIntoAccountFiscalRegionOnUpdate(
      accountNumber,
      projectResourceData,
      projectData.fiscal_year,
      projectResourceData.region_rid || "",
      existingProjectResource.region_rid || "",
      userId,
      statusMap,
      transaction
    );

    // await this.projectResourceSchema.cleanupOrphanedAccountFiscalRegion(
    //   accountNumber,
    //   projectResourceData.account_rid,
    //   projectData.fiscal_year,
    //   existingProjectResource.region_rid || "",
    //   transaction
    // );
    // }
    // }
  }

  private async aggregateResource(
    accountNumber: string,
    account_rid: string,
    projectResourceData: any,
    projectData: any,
    resourceData: any,
    statusMap: any,
    transaction: any
  ) {
    const { resource_code, region_rid } = projectResourceData;
    const { fiscal_year } = projectData;

    await this.projectResourceSchema.aggregatesResourceFiscal(
      accountNumber,
      account_rid,
      resource_code,
      resourceData,
      fiscal_year,
      statusMap,
      transaction
    );
    await this.projectResourceSchema.aggregatesResourceFiscalRegion(
      accountNumber,
      account_rid,
      resource_code,
      resourceData,
      fiscal_year,
      statusMap,
      transaction
    );
  }

  private async aggregateProject(
    accountNumber: string,
    account_rid: string,
    projectResourceData: any,
    projectData: any,
    statusMap: any,
    transaction: any
  ) {
    const { project_code, fiscal_year, rid } = projectData;

    await this.projectResourceSchema.aggregatesProjectFiscal(
      accountNumber,
      account_rid,
      projectResourceData.project_fiscal_rid,
      fiscal_year,
      statusMap,
      transaction
    );
    await this.projectResourceSchema.aggregatesProjectFiscalRegion(
      accountNumber,
      account_rid,
      project_code,
      rid,
      fiscal_year,
      statusMap,
      transaction
    );
    // await this.projectResourceSchema.aggregatesProject(
    //   accountNumber,
    //   account_rid,
    //   project_code,
    //   transaction
    // );
    await this.projectResourceSchema.aggregatesProjectFiscalSummary(
      accountNumber,
      account_rid,
      rid,
      project_code,
      fiscal_year,
      statusMap,
      transaction
    );
    // await this.projectResourceSchema.aggregatesProjectSummary(
    //   accountNumber,
    //   account_rid,
    //   project_code,
    //   transaction
    // );
  }

  private async aggregateAccount(
    accountNumber: string,
    account_rid: string,
    fiscal_year: number,
    transaction: any
  ) {
    await this.projectResourceSchema.aggregatesAccountFiscal(
      accountNumber,
      account_rid,
      fiscal_year,
      transaction
    );
    await this.projectResourceSchema.aggregatesAccountFiscalRegion(
      accountNumber,
      account_rid,
      fiscal_year,
      transaction
    );
    // await this.projectResourceSchema.aggregatesAccount(
    //   accountNumber,
    //   account_rid,
    //   transaction
    // );
  }

  private async recordTimelineAndHistory(
    accountNumber: string,
    updatedProjectResource: any,
    projectResourceData: IUpdateProjectResource | IUpdateInlineProjectResource,
    userId: string,
    transaction: any
  ) {
    if (!updatedProjectResource) return;

    const existing =
      await this.projectResourceSchema.fetchExistingProjectResource(
        accountNumber,
        projectResourceData.project_resource_rid,
        transaction
      );

    await this.projectResourceSchema.updateProjectResourceTimeline(
      accountNumber,
      "update",
      projectResourceData,
      projectResourceData.project_resource_rid,
      userId,
      transaction
    );

    await this.projectResourceSchema.addProjectResourceHistory(
      accountNumber,
      updatedProjectResource,
      existing,
      projectResourceData.project_resource_rid,
      userId,
      transaction
    );
  }

  getSortParameters(sortBy: string, sortOrder: string): [string, string] {
    const validSortColumns = [
      "fiscal_year",
      "total_hours_pro_res",
      "total_cost_pro_res",
      "qre_percent",
      "qre_final",
      "description",
      "project_resource_code",
      "project_resource_role",
      "r_number"
    ];

    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }

  buildWhereClause(filters: Record<string, any>, search: string): {
    whereClause: Record<string, any>;
  } {
    const whereClause: any = {
      [Op.and]: [],
    };
    if (search) {
      whereClause[Op.and].push({
        [Op.or]: [
          { "$project_resource_resource.resource_name$": { [Op.iLike]: `%${search}%` } },
          { "$project_resource_resource.resource_code$": { [Op.iLike]: `%${search}%` } },
        ],
      });
    }
    const filterConditions = this.applyFilters(filters, {});
    if (Object.keys(filterConditions).length > 0) {
      whereClause[Op.and].push(filterConditions);
    }
    return { whereClause: whereClause[Op.and].length ? whereClause : {} };
  }


  private applyFilters(
    filters: Record<string, any>,
    whereClause: Record<string, any>
  ): Record<string, any> {
    const castToTextFields = [
      "rid",
      "project_startdate",
      "project_enddate",
      "total_effort",
      "total_cost",
      "fiscal_year",
    ];

    const numberFields = [
      "total_hours_pro_res",
      "total_cost_pro_res",
      "qre_percent",
      "qre_final",
    ];

    const enumFields = ["country_rid", "region_rid", "status_rid"];

    const filterFields = this.getFilterFields();

    filterFields.forEach(({ clientField, dbField }) => {
      if (filters[clientField]) {
        const fieldFilter = filters[clientField];
        const isNumber = numberFields.includes(dbField);
        const isEnum = enumFields.includes(dbField);
        const isTextCastNeeded =
          castToTextFields.includes(clientField) && !isNumber;

        if (isTextCastNeeded) {
          whereClause[dbField] = Sequelize.where(
            Sequelize.cast(Sequelize.col(dbField), "TEXT"),
            this.getFieldFilter(fieldFilter, isNumber, isEnum)
          );
        } else {
          whereClause[dbField] = this.getFieldFilter(
            fieldFilter,
            isNumber,
            isEnum
          );
        }
      }
    });

    return whereClause;
  }

  getFilterFields(): { clientField: string; dbField: string }[] {
    const projectFilterFields = [
      { clientField: "region_rid", dbField: "region_rid" },
      { clientField: "country_rid", dbField: "country_rid" },
      { clientField: "total_hours_pro_res", dbField: "total_hours_pro_res" },
      { clientField: "total_cost_pro_res", dbField: "total_cost_pro_res" },
      { clientField: "qre_final", dbField: "qre_final" },
      { clientField: "qre_percent", dbField: "qre_percent" },
      { clientField: "description", dbField: "description" },
      {
        clientField: "project_resource_code",
        dbField: "project_resource_code",
      },
      { clientField: "status_rid", dbField: "status_rid" },
      { clientField: "project_resource_role", dbField: "project_resource_role" },
      { clientField: "r_number", dbField: "r_number" },
    ];

    return projectFilterFields;
  }

  private getFieldFilter(
    fieldFilter: any,
    isNumberField: boolean,
    isEnumField: boolean
  ): any {
    if (isNumberField) {
      if (fieldFilter.equals !== undefined) {
        const value = String(fieldFilter.equals).includes(".")
          ? fieldFilter.equals
          : `${fieldFilter.equals}.00`;
        return { [Op.eq]: value };
      }
      if (fieldFilter.not_equals !== undefined) {
        const value = String(fieldFilter.not_equals).includes(".")
          ? fieldFilter.not_equals
          : `${fieldFilter.not_equals}.00`;
        return {
          [Op.or]: [{ [Op.ne]: value }, { [Op.is]: null }],
        };
      }
      if (fieldFilter.less_than !== undefined) {
        const value = String(fieldFilter.less_than).includes(".")
          ? fieldFilter.less_than
          : `${fieldFilter.less_than}.00`;
        return { [Op.lt]: value };
      }
      if (fieldFilter.greater_than !== undefined) {
        const value = String(fieldFilter.greater_than).includes(".")
          ? fieldFilter.greater_than
          : `${fieldFilter.greater_than}.00`;
        return { [Op.gt]: value };
      }
      if (
        fieldFilter.between &&
        Array.isArray(fieldFilter.between) &&
        fieldFilter.between.length === 2
      ) {
        const value1 = String(fieldFilter.between[0]).includes(".")
          ? fieldFilter.between[0]
          : `${fieldFilter.between[0]}.00`;
        const value2 = String(fieldFilter.between[1]).includes(".")
          ? fieldFilter.between[1]
          : `${fieldFilter.between[1]}.00`;
        return {
          [Op.between]: [value1, value2],
        };
      }
      if (fieldFilter.is_empty === true) {
        return { [Op.or]: [null] };
      }
    }

    if (isEnumField) {
      if (fieldFilter.equals !== undefined) {
        return { [Op.eq]: fieldFilter.equals };
      }
      if (fieldFilter.not_equals !== undefined) {
        return {
          [Op.or]: [{ [Op.ne]: fieldFilter.not_equals }, { [Op.is]: null }],
        };
      }
      if (fieldFilter.in && Array.isArray(fieldFilter.in)) {
        return { [Op.in]: fieldFilter.in };
      }
      if (fieldFilter.is_empty === true) {
        return { [Op.or]: [null] };
      }
    }

    // String (default)
    if (fieldFilter.equals) {
      return { [Op.iLike]: fieldFilter.equals };
    }
    if (fieldFilter.not_equals) {
      return {
        [Op.or]: [{ [Op.notILike]: fieldFilter.not_equals }, { [Op.is]: null }],
      };
    }
    if (fieldFilter.contains) {
      return { [Op.iLike]: `%${fieldFilter.contains}%` };
    }
    if (fieldFilter.not_contains) {
      return {
        [Op.or]: [
          { [Op.notILike]: `%${fieldFilter.not_contains}%` },
          { [Op.is]: null },
        ],
      };
    }
    if (fieldFilter.is_empty === true) {
      return { [Op.or]: [null, ""] };
    }
    if (fieldFilter.value) {
      return fieldFilter.value;
    }

    return undefined;
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
