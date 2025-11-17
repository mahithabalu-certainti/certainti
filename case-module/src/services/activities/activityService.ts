import { Op, QueryTypes, Sequelize } from "sequelize";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { Logger } from "winston";
import { CaseModelService } from "../caseModelsService";
import CaseSchemaService from "./schemaService";
import {
  AccountType,
  ActivityType,
  AddCommentsType,
  CaseOwnerType,
  CaseStatusType,
  caseTaskStatusTypes,
  ChecklistItems,
  checklistType,
  CommentsListType,
  CountryType,
  CreateCaseTaskType,
  CurrencyType,
  DeleteCommentsType,
  FilingType,
  IActivityTask,
  ICreateCases,
  ICreateCaseTeam,
  ICreateChecklist,
  priorityTypes,
  TagsTypes,
  TaskCardDetailsType,
  TaskCardResponse,
  taskTags,
  TaskTypeResponse,
  UpdateCaseTaskType,
  UpdateCommentsType,
} from "../../utils/types";
import { generateExcelBase64, generateSasUrl, isValidTimezone, logMessage } from "../../utils/helpers";
import {
  caseStatuses,
  HttpStatus,
  STATUS_MESSAGE,
  rawQueries,
  MAIN_SCHEMA_NAME,
} from "../../utils/constants";
import { query } from "express";
import currency from "currency.js";
import moment from "moment";
import { CaseManagementSchemaService } from "../casesManagement/schemaService";
import { fetchTaskActivities, fetchTaskComments, listAllTaskStatus, taskCardDetails } from "../../utils/rawQueries";
import ActivitySchemaService from "./schemaService";
export class ActivityService {
  private caseSchemaService: CaseSchemaService;
  private caseModelService: CaseModelService; // Assuming this is defined somewhere in your code
  private caseManagementService : CaseManagementSchemaService
  private activitySchemaService: ActivitySchemaService;
  private logger: Logger;
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;

  constructor(logger: Logger) {
    this.logger = logger;
    this.caseSchemaService = new CaseSchemaService();
    this.caseModelService = new CaseModelService(); // Initialize your model service here
    this.caseManagementService = new CaseManagementSchemaService()
    this.activitySchemaService = new ActivitySchemaService();
  }

  private async getMainDb() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    return this.mainDbSequelize;
  }

  private async getOrgDb() {
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await initOrgSequelize();
    }
    return this.orgDbSequelize;
  }

   async createActivityTask(
      taskRequest: IActivityTask,
      userId: string
    ): Promise<{
      statusCode: number;
      message: string;
      errorMessage?: string;
      data?: { cases: any };
    }> {
      const dbInit = await this.caseModelService.getSequelize();
      const transaction = await dbInit.transaction();
      try {
        taskRequest.created_by = userId;
        const { accountNumber, parentAccountId } =
          await this.caseSchemaService.fetchValidAccountNumberById(
            taskRequest.account_rid
          );
  
        if (!accountNumber) {
          throw new Error("Invalid account ID");
        }
  
        const response = await this.activitySchemaService.createActivityTask(
          accountNumber,
          taskRequest,
          transaction
        );
      /*  if (response) {
          logMessage(`Case created with RID: ${response.rid}`);
          await this.activitySchemaService.addTaskSummary(
            accountNumber,
            taskRequest,
            response.rid,
            response.get("r_number") || ""
          );
        } */
  
        await transaction.commit();
  
        return {
          statusCode: HttpStatus.SUCCESS,
          message: STATUS_MESSAGE.caseCreated,
          data: {
            cases: response,
          },
        };
      } catch (err) {
        logMessage(`Error creating activity task, ${err}`);
        await transaction.rollback();
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: STATUS_MESSAGE.caseCreationFailed,
        };
      }
    }
 
}
 
