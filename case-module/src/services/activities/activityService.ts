import { Op, QueryTypes, Sequelize } from "sequelize";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { Logger } from "winston";
import { CaseModelService } from "../caseModelsService";
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
  IActivityCall,
  IActivityEmail,
  IActivityMeeting,
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
import {
  generateExcelBase64,
  generateSasUrl,
  isValidTimezone,
  logMessage,
} from "../../utils/helpers";
import {
  caseStatuses,
  HttpStatus,
  STATUS_MESSAGE,
  rawQueries,
  MAIN_SCHEMA_NAME,
} from "../../utils/constants";
import { CaseManagementSchemaService } from "../casesManagement/schemaService";

import ActivitySchemaService from "./schemaService";
import CaseSchemaService from "../cases/schemaService";
import { CaseTaskSchemaService } from "../cases/caseTask/caseTaskSchemaService";
import { ChecklistSchemaService } from "../cases/caseChecklist/checklistSchemaService";
import { HelperMethods } from "../cases/helperMethods";
export class ActivityService {
  private caseModelService: CaseModelService; // Assuming this is defined somewhere in your code
  private caseManagementService: CaseManagementSchemaService;
  private activitySchemaService: ActivitySchemaService;
  private caseSchemaService: CaseSchemaService;
  private logger: Logger;
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;
  private caseTaskSchemaService : CaseTaskSchemaService
  private checklistSchemaService : ChecklistSchemaService
  private helperMethod : HelperMethods

  constructor(logger: Logger) {
    this.logger = logger;
    this.caseModelService = new CaseModelService(); // Initialize your model service here
    this.caseManagementService = new CaseManagementSchemaService();
    this.activitySchemaService = new ActivitySchemaService();
    this.caseSchemaService = new CaseSchemaService();
    this.caseTaskSchemaService = new CaseTaskSchemaService()
    this.checklistSchemaService = new ChecklistSchemaService()
    this.helperMethod = new HelperMethods(
      this.caseModelService
    );
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
    data?: { task: any };
  }> {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.getMainDb();
    }
    const dbInit = await this.caseModelService.getSequelize();
    const transaction = await dbInit.transaction();
    try {
      taskRequest.created_by = userId;
      const { accountNumber, parentAccountId } =
        await this.caseSchemaService.fetchValidAccountNumberById(
          taskRequest.account_rid!
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }
      const isUnique =
        await this.activitySchemaService.checkIsActivityTaskUnique(
          taskRequest,
          accountNumber
        );
      if (!isUnique) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: `An Task with the name "${taskRequest.task_name}" already exists. Please choose a different name.`,
        };
      }

      const taskResponse = await this.activitySchemaService.createActivityTask(
        accountNumber,
        taskRequest,
        transaction
      );

      if(taskResponse)
      {
        if(!this.mainDbSequelize)
        {
          this.mainDbSequelize = await this.getMainDb();
        }
        const [taskTypeResponse]: any[] = await this.mainDbSequelize.query(
          rawQueries.getActivityTaskType(),
          {type: QueryTypes.SELECT}
        );
        taskRequest.task_type_rid = taskTypeResponse.rid;
        await this.activitySchemaService.addTaskSummary(
          accountNumber,
          taskRequest,
          taskResponse.rid,
          taskResponse.get("r_number") || ""
        )
      }
        
      if (taskRequest?.checklist_rid) {
        const response =
          await this.caseManagementService.fetchChecklistTemplateDetailsById(
            taskRequest.checklist_rid
          );
        response.checklist_items.map((item: any) => (item.action_type = "add"));
        let caseRequest = {
          account_rid: taskRequest.account_rid!,
          checklist_name: response.checklist_name,
          checklist_description: response.description,
          checklist_items: response.checklist_items,
          attach_to: taskResponse.rid,
          attachment_level: "task",
          created_by: userId,
          created_datetime: new Date(),
          fiscal_year: taskRequest.fiscal_year,
          checklist_rid: taskRequest.checklist_rid,
          checklist_template_rid: taskRequest.checklist_rid,
        };

        const checklistResponse = await this.checklistSchemaService.createCheckList(
          accountNumber,
          caseRequest,
          transaction
        );
        const checklistItems =
          await this.helperMethod.manageCheckListItems(
            accountNumber,
            caseRequest,
            checklistResponse.rid,
            transaction
          );
      }
      if (taskRequest?.tags.length > 0) {
        const [activeStatusRid]: any[] = await this.mainDbSequelize.query(
          rawQueries.getActiveStatusId()
        );
        for (let d of taskRequest.tags) {
          await this.caseTaskSchemaService .createOrUpdateTags(
            taskResponse.rid,
            taskRequest.account_rid!,
            "",
            d.tag_rid,
            d.is_new_tag,
            accountNumber,
            taskRequest.created_by,
            activeStatusRid,
            "activity"
          );
        }
      }

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
          task: taskResponse,
        },
      };
    } catch (err) {
      logMessage(`Error creating activity task, ${err}`);
      await transaction.rollback();
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: STATUS_MESSAGE.taskCreateFailed,
      };
    }
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
        await this.caseSchemaService.fetchValidAccountNumberById(
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
  async getAllActivities(
    userId: string,
    attachmentLevel?: string,
    entityId?: string,
    accountRid?: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    filters: Record<string, any> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "DESC",
    fiscalYear: number = 0,
    apiType: string = "list",
    activityType: string = "All",
    graphqlData?: any
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { activities: any[]; totalCount: number };
  }> {
    try {
      const { accountNumber } =
        await this.caseSchemaService.fetchValidAccountNumberById(accountRid!);

      if (!accountNumber) {
        logMessage(`Invalid account ID ${accountRid!}`);
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid account ID",
        };
      }
        const userGroupType = await this.caseSchemaService.getUserGroupType(
              userId
            );
            const userProfileType = await this.caseSchemaService.getUserProfileType(
              userId
            );
            const isCustomGlobal = userGroupType === "DEFAULT";
            const isDefaultParent = userGroupType === "AUTO_ASSIGNED_PARENT";
            const isPOCProfile =
              userProfileType?.profileName === "Project Point of Contact";
            let accessibleIds: string[] = [];
            if (!isCustomGlobal) {
              accessibleIds = await this.getAccessibleProjectIds(
                userId,
                isDefaultParent,
                isPOCProfile,
                userProfileType?.email,
                isCustomGlobal
              );
              if (accessibleIds.length === 0) {
                return {
                  message: 'No accessible checklist found for the user.',
                  statusCode: HttpStatus.NOT_FOUND,
                  data: {
                      totalCount: 0,
                    activities: [],
                  },
                };
              }
            }
      
            if (isCustomGlobal && isPOCProfile) {
              accessibleIds = await this.getAccessibleProjectIds(
                userId,
                isDefaultParent,
                isPOCProfile,
                userProfileType?.email,
                isCustomGlobal
              );
              if (accessibleIds.length === 0) {
                return {
                  message: 'No accessible checklist found for the user.',
                  statusCode: HttpStatus.NOT_FOUND,
                  data: {
                  
                    totalCount: 0,
                    activities: [],
                  },
                };
              }
            }
      const checklistResponse: any =
        await this.activitySchemaService.fetchActivities(
          accountNumber,
          fiscalYear,
          attachmentLevel,
          entityId,
          accountRid,
          page,
          limit,
          search,
          filters,
          sortBy,
          sortOrder,
          apiType,
          accessibleIds,
          activityType,
          userId,
          graphqlData
        );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          activities: checklistResponse.activities || [],
          totalCount: checklistResponse.totalCount || 0,
        },
      };
    } catch (error) {
      logMessage(`Error fetching activities task, ${error}`);
      return {
        statusCode: 500,
        message: "Failed to fetch activities task",
        errorMessage:
          error instanceof Error ? error.message : "An unknown error occurred",
        data: { activities: [], totalCount: 0 },
      };
    }
  }
  async createActivityEmail(
    data: IActivityEmail,
    userId: string,
    files?: Express.Multer.File[]
  ) {
    try {
      const { accountNumber } =
        await this.caseSchemaService.fetchValidAccountNumberById(
          data.account_rid!
        );
      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }
      const result = await this.activitySchemaService.createActivityEmail(
        accountNumber,
        data,
        userId,
        files
      );
      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.activityCreated,
        data: result,
      };
    } catch (err) {
      logMessage(`Error updating activity email, ${err}`);
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: STATUS_MESSAGE.activityCreationFailed,
      };
    }
  }
  async updateActivityEmail(
    data: IActivityEmail,
    userId: string,
    files?: Express.Multer.File[]
  ) {
    try {
      const { accountNumber } =
        await this.caseSchemaService.fetchValidAccountNumberById(
          data.account_rid!
        );
      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }
      const result = await this.activitySchemaService.updateActivityEmail(
        accountNumber,
        data,
        userId,
        files
      );
      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.activityUpdated,
        data: result,
      };
    } catch (err) {
      logMessage(`Error updating activity email, ${err}`);
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: STATUS_MESSAGE.activityUpdateFailed,
      };
    }
  }

  async deleteActivityAttachments(data: IActivityEmail, userId: string) {
    const { accountNumber } =
      await this.caseSchemaService.fetchValidAccountNumberById(
        data.account_rid!
      );
    if (!accountNumber) {
      throw new Error("Invalid account ID");
    }
    const result = await this.activitySchemaService.deleteEmailAttachment(
      accountNumber,
      data,
      userId
    );
    return result;
  }
  async getEmailActivityDetailsById(
    activityRid: string,
    accountRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { emailActivityDetails: any };
  }> {
    try {
      const { accountNumber } =
        await this.caseSchemaService.fetchValidAccountNumberById(accountRid);
      const emailActivityDetails =
        await this.activitySchemaService.fetchEmailActivityDetailsById(
          activityRid,
          accountNumber,
          accountRid
        );

      if (!emailActivityDetails) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid Email Template ID",
        };
      }
      let isSubscriptionCreated = false;
        const accountData = await this.helperMethod.fetchAccountById(accountRid);
        let accountRNumber = accountData.r_number;

      let childRNumber = await this.caseSchemaService.fetchParentAccount(
          accountData.parent_account_rid
        );
        if (accountData.storage_type === "store_in_parent") {
          accountRNumber = childRNumber;
        }
        isSubscriptionCreated = (await this.caseSchemaService.getSubscriptionDetailsByProjectId(accountData.parent_account_rid, childRNumber,accountRid)) ?? false;
        emailActivityDetails.is_email_configured = isSubscriptionCreated


      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          emailActivityDetails,
        },
      };
    } catch (err) {
      logMessage(`Error fetching email activity details, ${err}`);
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: STATUS_MESSAGE.checkListError,
      };
    }
  }

  async getMeetingActivityDetailsById(
    activityRid: string,
    accountRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { activityDetails: any };
  }> {
    try {
      const { accountNumber } =
        await this.caseSchemaService.fetchValidAccountNumberById(accountRid);
      const activityDetails =
        await this.activitySchemaService.fetchMeetingActivityDetailsById(
          activityRid,
          accountNumber,
          accountRid
        );

      if (!activityDetails) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid Activity ID",
        };
      }
      let isSubscriptionCreated = false;
        const accountData = await this.helperMethod.fetchAccountById(accountRid);
        let accountRNumber = accountData.r_number;

      let childRNumber = await this.caseSchemaService.fetchParentAccount(
          accountData.parent_account_rid
        );
        if (accountData.storage_type === "store_in_parent") {
          accountRNumber = childRNumber;
        }
        isSubscriptionCreated = (await this.caseSchemaService.getSubscriptionDetailsByProjectId(accountData.parent_account_rid, childRNumber,accountRid)) ?? false;
        activityDetails.is_email_configured = isSubscriptionCreated

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          activityDetails,
        },
      };
    } catch (err) {
      logMessage(`Error fetching meeting activity details, ${err}`);
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: STATUS_MESSAGE.checkListError,
      };
    }
  }

  async getCallActivityDetailsById(
    activityRid: string,
    accountRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { activityDetails: any };
  }> {
    try {
      const { accountNumber } =
        await this.caseSchemaService.fetchValidAccountNumberById(accountRid);
      const activityDetails =
        await this.activitySchemaService.fetchCallActivityDetailsById(
          activityRid,
          accountNumber,
          accountRid
        );

      if (!activityDetails) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid Activity ID",
        };
      }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          activityDetails,
        },
      };
    } catch (err) {
      logMessage(`Error fetching call activity details, ${err}`);
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: STATUS_MESSAGE.detailFetchedFailed,
      };
    }
  }

  async createActivityMeeting(
    data: IActivityMeeting,
    userId: string,
    files?: Express.Multer.File[]
  ) {
    try {
      const { accountNumber } =
        await this.caseSchemaService.fetchValidAccountNumberById(
          data.account_rid!
        );
      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }
      const result = await this.activitySchemaService.createActivityMeeting(
        accountNumber,
        data,
        userId,
        files
      );
      if (result.success === false) 
        {
          return {
            statusCode: HttpStatus.FAILED,
            message: HttpStatus.FAILED_MESSAGE,
            errorMessage: result.error,
        }
      }
    
      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.activityCreated,
        data: result,
      };
    } catch (err) {
      logMessage(`Error adding comments to task, ${err}`);
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: STATUS_MESSAGE.activityCreationFailed,
      };
    }
  }

   async createActivityCall(
    data: IActivityCall,
    userId: string,
    files?: Express.Multer.File[]
  ) {
    try {
      const { accountNumber } =
        await this.caseSchemaService.fetchValidAccountNumberById(
          data.account_rid!
        );
      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }
      const result = await this.activitySchemaService.createActivityCall(
        accountNumber,
        data,
        userId,
        files
      );
      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.activityCreated,
        data: result,
      };
    } catch (err) {
      logMessage(`Error adding call to task, ${err}`);
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: STATUS_MESSAGE.activityCreationFailed,
      };
    }
  }

  async updateActivityCall(
    data: IActivityCall,
    userId: string,
    files?: Express.Multer.File[]
  ) {
    try {
      const { accountNumber } =
        await this.caseSchemaService.fetchValidAccountNumberById(
          data.account_rid!
        );
      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }
      const result = await this.activitySchemaService.updateActivityCall(
        accountNumber,
        data,
        userId,
        files
      );
      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.activityUpdated,
        data: result,
      };
    } catch (err) {
      logMessage(`Error updating call activity, ${err}`);
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: STATUS_MESSAGE.activityUpdateFailed,
      };
    }
  }

  async updateActivityMeeting(
    data: IActivityMeeting,
    userId: string,
    files?: Express.Multer.File[]
  ) {
    try {
      const { accountNumber } =
        await this.caseSchemaService.fetchValidAccountNumberById(
          data.account_rid!
        );
      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }
      const result = await this.activitySchemaService.updateActivityMeeting(
        accountNumber,
        data,
        userId,
        files
      );
      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.activityCreated,
        data: result,
      };
    } catch (err) {
      logMessage(`Error updating meeting activity, ${err}`);
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: STATUS_MESSAGE.activityCreationFailed,
      };
    }
  }
  async getActivityStatus(activityType: string): Promise<{
      statusCode: number;
      message: string;
      errorMessage?: string;
      data?: { activityStatus: any };
    }> {
      try {
        const activityStatus = await this.activitySchemaService.getActivityStatus(activityType);
  
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.SUCCESS_MESSAGE,
          data: {
            activityStatus,
          },
        };
      } catch (err) {
        logMessage(`Error fetching activity status, ${err}`);
        throw this.throwServiceError(err as Error);
      }
    }
  
   async getAccessibleProjectIds(
      userId: string,
      isdefaultparent: boolean,
      isPOC: boolean = false,
      userEmail?: string,
      isCustomGlobal: boolean = false
    ): Promise<string[]> {
      const mainDbSequelize = await initMainDbSequelize();
      const MAIN_SCHEMA_NAME = "trd365";
  
      const replacements: any[] = [];
  
      let accessControlWhere = "WHERE 1=1";
      logMessage(
        `isCustomGlobal: ${isCustomGlobal}, isPOC: ${isPOC}, isdefaultparent: ${isdefaultparent}, userEmail: ${userEmail}, userId: ${userId}`
      );
  
      if (isCustomGlobal) {
        // If isPOC is also true, restrict to POC email
        if (isPOC && userEmail) {
          accessControlWhere += ` AND (ps.project_point_of_contact_email = ? OR pfs.project_point_of_contact_email = ?)`;
          replacements.push(userEmail, userEmail);
        }
        // Else allow all projects (no extra access checks)
      } else {
        // Non-global user – apply account/project access checks
        const accountAccessSubquery = rawQueries.GET_ACCOUNT_ACCESS;
        replacements.push(userId, userId, userId, userId);
        accessControlWhere += ` AND ${accountAccessSubquery}`;
  
        if (!isdefaultparent) {
          // Add project-level access checks if not a parent group
          accessControlWhere += rawQueries.GET_PROJECT_ACCESS;
          replacements.push(userId, userId, userId, userId);
        }
  
        // Only non-global users can be further filtered by POC
        if (isPOC && userEmail) {
          accessControlWhere += ` AND (ps.project_point_of_contact_email = ? OR pfs.project_point_of_contact_email = ?)`;
          replacements.push(userEmail, userEmail);
        }
      }
  
      const query = rawQueries.fetchProjectFiscalSummary(accessControlWhere);
  
      const results = await mainDbSequelize.query(query, {
        replacements,
        type: "SELECT",
      });
  
      return results.map((row: any) => row.project_fiscal_rid);
    }
    /**
     * Formats an error response to be returned from service methods.
     *
     * @param {Error} err - The caught error object containing error details.
     *
     * @returns {{
     *   statusCode: number;
     *   message: string;
     *   errorMessage: string;
     * }} - Standardized error response object with consistent structure.
     *
     * @description
     * - Converts any caught error into a standardized service error format.
     * - Sets status code to FAILED (500) for consistent error handling.
     * - Preserves the original error message for debugging purposes.
     * - Used across all service methods to maintain consistent error response structure.
     * - Ensures all service errors follow the same format for frontend consumption.
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
