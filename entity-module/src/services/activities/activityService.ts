import { Op, QueryTypes, Sequelize } from "sequelize";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { Logger } from "winston";
import { CaseModelService } from "../cases/caseModelsService";
import {
    // AccountType,
    // ActivityType,
    // AddCommentsType,
    // CaseOwnerType,
    // CaseStatusType,
    // caseTaskStatusTypes,
    // ChecklistItems,
    // checklistType,
    // CommentsListType,
    // CountryType,
    // CreateCaseTaskType,
    // CurrencyType,
    // DeleteCommentsType,
    // FilingType,
    // IActivityCall,
    // IActivityEmail,
    // IActivityMeeting,
    IActivityTask,
    // ICreateCases,
    // ICreateCaseTeam,
    // ICreateChecklist,
    // priorityTypes,
    // TagsTypes,
    // TaskCardDetailsType,
    // TaskCardResponse,
    // taskTags,
    // TaskTypeResponse,
    // UpdateCaseTaskType,
    // UpdateCommentsType,
} from "../../utils/types";
import {
    generateExcelBase64,
    // generateSasUrl,
    // isValidTimezone,
    logMessage,
} from "../../utils/helpers";
import {
    // caseStatuses,
    HttpStatus,
    STATUS_MESSAGE,
    rawQueries,
    MAIN_SCHEMA_NAME,
} from "../../utils/constants";
// import { CaseManagementSchemaService } from "../casesManagement/schemaService";

import ActivitySchemaService from "./schemaService";
import CaseSchemaService from "../cases/schemaService";
export class ActivityService {
    private caseModelService: CaseModelService; // Assuming this is defined somewhere in your code
    // private caseManagementService: CaseManagementSchemaService;
    private activitySchemaService: ActivitySchemaService;
    private caseSchemaService: CaseSchemaService;
    private logger: Logger;
    private orgDbSequelize: Sequelize | null = null;
    private mainDbSequelize: Sequelize | null = null;

    constructor(logger: Logger) {
        this.logger = logger;
        this.caseModelService = new CaseModelService(); // Initialize your model service here
        // this.caseManagementService = new CaseManagementSchemaService();
        this.activitySchemaService = new ActivitySchemaService();
        this.caseSchemaService = new CaseSchemaService();
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

    async updateActivityTask(
        taskRequest: IActivityTask,
        userId: string
    ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { task: any };
    }> {
        const dbInit = await this.caseModelService.getSequelize();
        const transaction = await dbInit.transaction();
        try {
            taskRequest.modified_by = userId;
            const { accountNumber, parentAccountId } =
                await this.activitySchemaService.fetchValidAccountNumberById(
                    taskRequest.account_rid!
                );

            if (!accountNumber) {
                throw new Error("Invalid account ID");
            }

            const isUnique =
                await this.activitySchemaService.checkIsExistingActivityTaskUnique(
                    taskRequest,
                    accountNumber
                );
            if (!isUnique) {
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: HttpStatus.BAD_REQUEST_MESSAGE,
                    errorMessage: `A Task with the name "${taskRequest.task_name}" already exists. Please choose a different name.`,
                };
            }

            const response = await this.activitySchemaService.updateActivityTask(
                accountNumber,
                taskRequest,
                transaction,
                userId
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
                message: STATUS_MESSAGE.taskUpdatedSuccess,
                data: {
                    task: response,
                },
            };
        } catch (err) {
            logMessage(`Error updating activity task, ${err}`);
            await transaction.rollback();
            return {
                statusCode: HttpStatus.FAILED,
                message: HttpStatus.FAILED_MESSAGE,
                errorMessage: STATUS_MESSAGE.taskUpdateFailed,
            };
        }
    }

}