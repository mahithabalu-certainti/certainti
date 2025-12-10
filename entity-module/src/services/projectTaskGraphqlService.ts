import Configurations from "../config/config";
import { initMainDbSequelize } from "../config/mainDataSource";
import { initOrgSequelize } from "../config/orgDataSource";
import {
  HttpStatus,
  rawQueries,
  STATUS_MESSAGE,
} from "../utils/constants";
import { logMessage, setInlineForProjectTask } from "../utils/helpers";
import { ProjectTaskSchemaService } from "../services/projectTask/schemaService";
import { ProjectInjestionTaskService } from "./projectTask/projectTaskService";
import Decimal from "decimal.js";
import { ProjectTask } from "../models/projectTask";
import { getCurrencyThreshold, getResourceStatuses } from "./resourceCostService";
import { Logger } from "winston";
import { ProjectResourceSchemaService } from "./projectResource/schemaService";
import ProjectIngestionService from "./projectIngestionService";
import { Case } from "../models/caseModel";
import { CaseStatusResult } from "../utils/types";



const services = Configurations.getInstance().getServices();
const projectTaskService = services.projectTaskServices;
const projectTaskSchemaService = new ProjectTaskSchemaService();

export default class ProjectTaskGraphqlServies {
  private projectTaskInjestionService: ProjectInjestionTaskService;
  private projectTaskSchema: ProjectTaskSchemaService;
  private projectResourceSchema: ProjectResourceSchemaService;
  private logger: Logger;
  private projectIngestion: ProjectIngestionService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.projectTaskInjestionService = new ProjectInjestionTaskService(this.logger);
    this.projectResourceSchema = new ProjectResourceSchemaService();
    this.projectTaskSchema = new ProjectTaskSchemaService();
    this.projectIngestion = new ProjectIngestionService(this.logger);
  }

  async updateInlineGraphqlDetails(data: any) {
    let total_hours_pro_task;
    let total_cost_pro_task;
    const orgSequelize = await initOrgSequelize();
    const mainSequelize = await initMainDbSequelize();
    logMessage(`Updating inline GraphQL details for project task: ${JSON.stringify(data)}`);

    const checkAccountExists: any = await mainSequelize.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainSequelize)
    );

    if (checkAccountExists[0].length < 1) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        statusMessage: STATUS_MESSAGE.accountNoFound,
        data: null,
      };
    } else {
      const accountNumber = checkAccountExists[0][0].r_number;

      const projectData =
        await this.projectResourceSchema.validateProjectFiscalById(
          accountNumber,
          data.project_fiscal_rid
        );

      if (projectData.is_qualified) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Qualified project cannot be updated.",
        };
      }

      let schemaName = rawQueries.fetchSchemaName(accountNumber);
      const checkForExistingData: any = await orgSequelize.query(
        rawQueries.findProjectTaskDetails(
          schemaName,
          data.rid,
          data.account_rid
        )
      );

      if (checkForExistingData[0].length < 1) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          statusMessage: STATUS_MESSAGE.projectTaskNotFound,
          data: null,
        };
      } else {
        if (data.resource_code) {
          // Fetch resource rid from resources table using resource code
          const resourceQuery = await orgSequelize.query(
            rawQueries.findResourceByCode(schemaName, data.resource_code)
          );
          if (resourceQuery[0].length > 0) {
            data.resource_rid = (resourceQuery[0][0] as { rid: string }).rid;
          } else {
            return {
              statusCode: HttpStatus.NOT_FOUND,
              statusMessage: STATUS_MESSAGE.resourceNotFound,
              data: null,
            };
          }
        }
        if(data.total_hours_pro_task) total_hours_pro_task = data.total_hours_pro_task
        else total_hours_pro_task = checkForExistingData[0][0].total_hours_pro_task

        if(data.total_cost_pro_task) total_cost_pro_task = data.total_cost_pro_task
        else total_cost_pro_task = checkForExistingData[0][0].total_cost_pro_task
        if(data.start_date && data.end_date) {
          const newStartDate = new Date(data.start_date);
          const newEndDate = new Date(data.end_date);
          if(newStartDate > newEndDate) {
            return {
              statusCode: HttpStatus.BAD_REQUEST,
              statusMessage: STATUS_MESSAGE.startDateLessThanEndDate,
              data: null,
            };
          }
        } 
        if(data.start_date && !data.end_date) {
          data.start_date = new Date(data.start_date).toISOString().split('T')[0];
          if(checkForExistingData[0][0].end_date) {
            const existingEndDate = new Date(checkForExistingData[0][0].end_date);
            const newStartDate = new Date(data.start_date);
            if(newStartDate > existingEndDate) {
              return {
                statusCode: HttpStatus.BAD_REQUEST,
                statusMessage: STATUS_MESSAGE.startDateLessThanEndDate,
                data: null,
              };
            }
          }
        }
        if(data.end_date && !data.start_date) {
          data.end_date = new Date(data.end_date).toISOString().split('T')[0];
          if(checkForExistingData[0][0].start_date) {
            const existingStartDate = new Date(checkForExistingData[0][0].start_date);
            const newEndDate = new Date(data.end_date);
            if(newEndDate < existingStartDate) {
              return {
                statusCode: HttpStatus.BAD_REQUEST,
                statusMessage: STATUS_MESSAGE.startDateLessThanEndDate,
                data: null,
              };
            }
          }
        }
        

        const newEffort = new Decimal(data.total_hours_pro_task || "0");

      if (!newEffort.isZero() && !newEffort.isNaN()) {
        const startDate = data.start_date? data.start_date : checkForExistingData[0][0].start_date;
        const endDate = data.end_date? data.end_date : checkForExistingData[0][0].end_date;
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          const diffDays =
            Math.floor(
              (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
            ) + 1;
          const maxAllowedEffort = new Decimal(diffDays * 24);

          const existingProjectTask = checkForExistingData[0][0];

          const newProjectTaskData = {
            ...existingProjectTask,
            ...data
          }

          const existingTasks: ProjectTask[] =
            await this.projectTaskSchema.getExistingEffortInProjectTask(
              accountNumber,
              newProjectTaskData,
              newProjectTaskData.resource_rid!
            );

          const filteredTasks = existingTasks.filter(
            (task) => task.rid !== data.rid 
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
              statusMessage : validation.errorMessage,
              data : null
            };
          }
        } else if (startDate && !endDate) {
          if (newEffort.gt(24)) {
            return {
              statusCode: HttpStatus.BAD_REQUEST,
              statusMessage: STATUS_MESSAGE.effort24HrsExceeded,
              data: null,
            };
          }
        }
      }

        const getAccountCurrencyRid : any = await mainSequelize.query(rawQueries.fetchCurrencyFromAccount(data.account_rid))
        const costFields = {
          total_hours_pro_task,
          total_cost_pro_task
        };
        const costValues : any = Object.entries(costFields).reduce(
          (acc, [key, value]) => {
            // Normalize empty string to null
            if (value === null || value === undefined) {
              acc[key] = null;
            } else {
              try {
                // Convert valid string/number to Decimal
                acc[key] = new Decimal(value).toString();
              } catch (error) {
                logMessage(`Error converting ${key} to Decimal: ${error}`);
                throw new Error(`Invalid number format for ${key}: ${value}`);
              }
            }
            return acc;
          },
          {} as Record<string, string | null>
        );
                
        // Get currency threshold
        const currencyThreshold = await getCurrencyThreshold(mainSequelize,getAccountCurrencyRid[0][0].currency_rid);
        let status = "Active";
        const statusMap = await getResourceStatuses(mainSequelize);
        const activeId : any = await mainSequelize.query(rawQueries.fetchActiveStatusRid(status));
        const activeStatusId : any = statusMap?.get(status);

        if (total_hours_pro_task != null && Number(total_hours_pro_task) > 3000) {
            status = "Anomaly";
        } 
        else if (
          (total_cost_pro_task !== null && currencyThreshold !== null && Number(total_cost_pro_task) > currencyThreshold)) {
          status = "Anomaly";
        }
        const statusRid : any = statusMap?.get(status);
        if(statusRid !== undefined || statusRid !== null) data.status_rid = statusRid
        else data.status_rid = checkForExistingData[0][0].status_rid
        let getSetData = setInlineForProjectTask(
          checkForExistingData[0][0],
          data
        );
        if (getSetData.statusMessage != null) {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            statusMessage: getSetData.statusMessage,
            data: null,
          };
        } else {
          data.status_rid = statusRid
          const updatedProjectTask = await orgSequelize.query(
            rawQueries.updateProjectTaskQuery(schemaName, getSetData, data)
          );

          const {accountNumber: validAccountNumber}  = await this.projectIngestion.fetchValidAccountNumberById(data.account_rid);

          const checkTableExists =  await this.projectIngestion.checkCaseProjectsTableExists(validAccountNumber);  
          if (checkTableExists) {
            const projectCaseMapping = 
            await this.projectIngestion.fetchProjectFiscalCaseMapping(
              accountNumber,
              projectData.rid
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

                  const updatedProjectTask = await orgSequelize.query(
                    rawQueries.updateCaseProjectTaskQuery(schemaName, getSetData, data, caseMapping)
                  );
                  
                }
            }
          }

          if (updatedProjectTask) {
            let fetchLatestUpdatedData =
              await projectTaskService.getProjectTaskById(
                data.account_rid,
                data.rid
              );

            await projectTaskSchemaService.addProjectTaskTimelineForInlineEdit(
              accountNumber,
              "update",
              data.account_rid,
              data.rid,
              data.userId
            );

            await this.projectTaskInjestionService.runAggregationAfterInlineUpdate(
              accountNumber,
              data,
              checkForExistingData[0][0],
              activeId[0][0].rid,
              activeStatusId
            );

            await projectTaskSchemaService.addProjctTaskHistoryForInline(
              accountNumber,
              data,
              checkForExistingData[0][0],
              data.rid,
              data.userId
            );

            let latestData: any = fetchLatestUpdatedData.data;
            let finalStructuredData = {
              rid: latestData.rid,
              r_number: latestData.r_number,
              account_rid: latestData.account_rid,
              account_name: latestData.account_name || null,
              project_rid: latestData.project_rid,
              project_fiscal_rid: latestData.project_fiscal_rid,
              project_name: latestData.project_name || null,
              project_code: latestData.project_code,
              project_resource_code: latestData.project_resource_code,
              resource_rid: latestData.resource_rid,
              resource_code: latestData.resource_code,
              fiscal_year: latestData.fiscal_year,
              start_date: latestData.start_date ? new Date(latestData.start_date).toISOString() : null,
              end_date: latestData.end_date ? new Date(latestData.end_date).toISOString() : null,
              resource_name: latestData.resource_name,
              resource_type_rid: latestData.resource_type_rid,
              resource_type_name: latestData.resource_type_name,
              designation: latestData.designation,
              resource_role: latestData.resource_role,
              status_rid: latestData.status_rid,
              country_rid: latestData.country_rid,
              country_name: latestData.country_name,
              region_rid: latestData.region_rid,
              region_name: latestData.region_name,
              currency_rid: latestData.currency_rid,
              resource_orgname: latestData.resource_orgname,
              total_hours_pro_task: latestData.total_hours_pro_task,
              total_cost_pro_task: latestData.total_cost_pro_task,
              description: latestData.description,
              comments: latestData.comments,
              created_by: latestData.created_by,
              modified_by: latestData.modified_by,
              created_datetime: latestData.created_datetime,
              modified_datetime: latestData.modified_datetime,
              status_name : latestData.status_name,
              project_resource_role : latestData.project_resource_role,
              task_name: latestData.task_name,
              task_description: latestData.task_description,
              task_classification_rid: latestData.task_classification_rid,
              task_type_rid: latestData.task_type_rid,
              task_classification_name: latestData.task_classification_name,
              task_type_name: latestData.task_type_name
            };
            return {
              statusCode: HttpStatus.SUCCESS,
              statusMessage: STATUS_MESSAGE.projectTaskUpdatedSuccess,
              data: finalStructuredData,
            };
          }
        }
      }
    }
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
}
