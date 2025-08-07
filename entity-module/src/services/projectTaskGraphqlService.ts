import Configurations from "../config/config";
import { initMainDbSequelize } from "../config/mainDataSource";
import { initOrgSequelize } from "../config/orgDataSource";
import {
  HttpStatus,
  MAIN_SCHEMA_NAME,
  rawQueries,
  STATUS_MESSAGE,
} from "../utils/constants";
import { setInlineForProjectTask } from "../utils/helpers";
import { ProjectTaskSchemaService } from "../services/projectTask/schemaService";
import { ProjectInjestionTaskService } from "./projectTask/projectTaskService";
import Decimal from "decimal.js";
import { ProjectTask } from "../models/projectTask";
import { ProjectResourceSchemaService } from "./projectResource/schemaService";

const services = Configurations.getInstance().getServices();
const projectTaskService = services.projectTaskServices;
const projectTaskSchemaService = new ProjectTaskSchemaService();

export default class ProjectTaskGraphqlServies {
  private projectTaskInjestionService: ProjectInjestionTaskService;
  private projectTaskSchema: ProjectTaskSchemaService;
;


  constructor() {
    this.projectTaskInjestionService = new ProjectInjestionTaskService();
    this.projectTaskSchema = new ProjectTaskSchemaService();
  }

  async updateInlineGraphqlDetails(data: any) {
    const orgSequelize = await initOrgSequelize();
    const mainSequelize = await initMainDbSequelize();

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

          const totalExistingEffort = filteredTasks.reduce(
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
              statusMessage: STATUS_MESSAGE.effortExceeded,
              data: null
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
          const updatedProjectTask = await orgSequelize.query(
            rawQueries.updateProjectTaskQuery(schemaName, getSetData, data)
          );

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
              checkForExistingData[0][0]
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
}
