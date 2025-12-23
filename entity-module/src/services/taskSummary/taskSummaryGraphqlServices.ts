import Configurations from "../../config/config";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import {
  HttpStatus,
  rawQueries,
  STATUS_MESSAGE,
} from "../../utils/constants";
import { logMessage, setInlineForTaskSummary } from "../../utils/helpers";
import Decimal from "decimal.js";
import { TaskService } from "./taskService";
import { ProjectInjestionTaskService } from "../projectTask/projectTaskService";
import { CaseService } from "../cases/caseService";
import { Logger } from "winston";
import {
  IFetchTaskDetailsInput,
  IUpdateProjectTask,
  UpdateCaseTaskType,
  IActivityTask
} from "../../utils/types";
import { ActivityService } from "../activities/activityService";
import { DataTypes, Op, QueryTypes, Sequelize } from "sequelize";




const services = Configurations.getInstance().getServices();
// const taskService = services.taskService;
// const projectTaskService = services.projectTaskService;
// const taskSummarySchemaService = new TaskSummarySchemaService();

export default class TaskSummaryGraphqlServices {
  private logger: Logger;
  private taskService: TaskService
  private projectInjestionTaskService: ProjectInjestionTaskService
  private caseService: CaseService
  private activityService: ActivityService;
  //   private taskInjestionService: TaskInjestionService;
  //   private taskSummarySchema: TaskSummarySchemaService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.taskService = new TaskService(logger);
    this.projectInjestionTaskService = new ProjectInjestionTaskService(logger);
    this.caseService = new CaseService(logger);
    this.activityService = new ActivityService(logger);
    // this.taskInjestionService = new TaskInjestionService();
    // this.taskSummarySchema = new TaskSummarySchemaService();
  }

  async updateInlineGraphqlDetailsForTaskSummary(data: any) {
    const orgSequelize = await initOrgSequelize();
    const mainSequelize = await initMainDbSequelize();

    logMessage(`Updating inline GraphQL details for task summary: ${JSON.stringify(data)}`);

    // Validate account exists
    const checkAccountExists: any = await mainSequelize.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainSequelize)
    );

    if (checkAccountExists[0].length < 1) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        statusMessage: STATUS_MESSAGE.accountNoFound,
        data: null,
      };
    }

    const accountNumber = checkAccountExists[0][0].r_number;
    const schemaName = rawQueries.fetchSchemaName(accountNumber);

    // Validate task summary exists
    const checkForExistingData: any = await mainSequelize.query(
      rawQueries.findTaskSummaryDetails(data.rid, data.account_rid)
    );

    if (checkForExistingData[0].length < 1) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        statusMessage: STATUS_MESSAGE.taskSummaryNotFound,
        data: null,
      };
    }

    const existingTaskSummary = checkForExistingData[0][0];

    // Validate attached task exists based on attachment level
    let attachedTaskExists = false;
    let attachedTaskDetails = null;
    let projectTaskUpdateResult = null;
    let caseTaskUpdateResult = null;
    let activityTaskUpdateResult = null;

    // Define editable fields from task summary
    const editableFields = [
      'task_name',
      'description',
      'fiscal_year',
      'status_rid',
      'priority_rid',
      'effective_start_datetime',
      'effective_end_datetime'
    ];

    let fieldsToPropagate: string[] = [];

    const userId = data.userId


    if (data.task_type_name === "Milestone") {
      const caseTaskQuery: any = await orgSequelize.query(
        rawQueries.findCaseTaskDetails(schemaName, data.task_rid, data.account_rid)
      );

      attachedTaskExists = caseTaskQuery[0].length > 0;

      const getTaskDetailsByIdParam: IFetchTaskDetailsInput = {
        task_rid: data.task_rid,
        account_rid: data.account_rid,
        user_rid: userId,
        attachment_level: data.attachment_level,
        attach_to: data.attach_to,
        task_type_name: data.task_type_name,
      }

      attachedTaskDetails = await this.taskService.getTaskDetailsById(getTaskDetailsByIdParam)

      // Check if any editable fields from task summary need to be propagated to case task
      fieldsToPropagate = editableFields.filter(field =>
        data[field] !== undefined && data[field] !== null
      );

      // Always propagate if there are date changes (for validation)
      const hasDateChanges = data.effective_start_datetime || data.effective_end_datetime;

      if (fieldsToPropagate.length > 0 || hasDateChanges) {
        try {
          const currentDate = new Date();

          // We need to fetch more complete case task details to get all required fields
          const fullCaseTaskDetails = attachedTaskDetails.data;

          // Create the UpdateCaseTaskType object by merging existing data with task summary updates
          const caseTaskUpdateData: UpdateCaseTaskType = {
            // Required fields from existing case task
            rid: data.task_rid, // Case task RID
            account_rid: data.account_rid,
            case_rid: fullCaseTaskDetails.case_rid || data.attach_to,

            // Fields that can be overridden from task summary
            task_name: data.task_name || fullCaseTaskDetails.task_name,
            task_description: data.description || fullCaseTaskDetails.description || fullCaseTaskDetails.task_description,

            // Map status fields
            task_status_rid: data.status_rid || fullCaseTaskDetails.task_status_rid || fullCaseTaskDetails.status_rid,

            // Priority mapping
            priority_rid: data.priority_rid || fullCaseTaskDetails.priority_rid,

            // Date fields - convert format if needed
            effective_start_datetime: data.effective_start_datetime
              ? new Date(data.effective_start_datetime)
              : (fullCaseTaskDetails.effective_start_datetime ? new Date(fullCaseTaskDetails.effective_start_datetime) : currentDate),

            effective_end_datetime: data.effective_end_datetime
              ? new Date(data.effective_end_datetime)
              : (fullCaseTaskDetails.effective_end_datetime ? new Date(fullCaseTaskDetails.effective_end_datetime) : null),

            // Fields from existing case task (not editable from task summary)
            modified_by: userId,
            modified_datetime: currentDate,
            sequence_no: fullCaseTaskDetails.sequence_no || 0,
            case_team_member_role_rid: fullCaseTaskDetails.case_team_member_role_rid,
            assigned_to: fullCaseTaskDetails.assigned_to,
            milestone_template_rid: fullCaseTaskDetails.milestone_template_rid,
            checklist_template_rid: fullCaseTaskDetails.checklist_template_rid,
            task_type_rid: fullCaseTaskDetails.task_type_rid,
            tags: fullCaseTaskDetails.tags || [],
            workflow_connector: fullCaseTaskDetails.workflow_connector,
            weightage_rid: fullCaseTaskDetails.weightage_rid,
            task_category_rid: fullCaseTaskDetails.task_category_rid,

            // Handle fiscal year
            ...(data.fiscal_year && { fiscal_year: data.fiscal_year }),
          };

          logMessage(`Propagating task summary changes to case task: ${JSON.stringify({
            fieldsPropagated: fieldsToPropagate,
            caseTaskData: {
              rid: caseTaskUpdateData.rid,
              task_name: caseTaskUpdateData.task_name,
              task_description: caseTaskUpdateData.task_description,
              task_status_rid: caseTaskUpdateData.task_status_rid,
              priority_rid: caseTaskUpdateData.priority_rid,
              effective_start_datetime: caseTaskUpdateData.effective_start_datetime,
              effective_end_datetime: caseTaskUpdateData.effective_end_datetime
            }
          })}`);
          // Call updateUserLevelTask with the prepared data
          const updateResult = await this.caseService.updateUserLevelTask(caseTaskUpdateData);

          caseTaskUpdateResult = updateResult;

          if (updateResult.statusCode !== HttpStatus.SUCCESS) {
            return {
              statusCode: updateResult.statusCode,
              statusMessage: updateResult.statusMessage || STATUS_MESSAGE.updateFailed,
              data: null,
            };
          }

          // If successful, update attached task details
          if (updateResult.statusCode === HttpStatus.SUCCESS) {
            // Fetch updated case task details
            const updatedCaseTaskQuery: any = await orgSequelize.query(
              rawQueries.findCaseTaskDetails(schemaName, data.task_rid, data.account_rid)
            );
            if (updatedCaseTaskQuery[0].length > 0) {
              attachedTaskDetails = updatedCaseTaskQuery[0][0];
            }
          }

        } catch (error) {
          logMessage(`Error updating case task: ${error}`);
          return {
            statusCode: HttpStatus.FAILED,
            statusMessage: "Failed to update associated case task",
            data: null,
          };
        }
      }
    } else if (data.task_type_name === "Action") {
      const accTaskQuery: any = await orgSequelize.query(
        rawQueries.findAccountTaskDetails(schemaName, data.task_rid, data.account_rid)
      );
      attachedTaskExists = accTaskQuery[0].length > 0;
      attachedTaskDetails = accTaskQuery[0][0];

      // Check if any editable fields from task summary need to be propagated to activity task
      fieldsToPropagate = editableFields.filter(field =>
        data[field] !== undefined && data[field] !== null
      );

      // Always propagate if there are date changes (for validation)
      const hasDateChanges = data.effective_start_datetime || data.effective_end_datetime;

      if (fieldsToPropagate.length > 0 || hasDateChanges) {
        try {
          // Extract userId from context or data
          const currentDate = new Date();

          // We need to fetch more complete account task details to get all required fields
          const fullAccountTaskDetails = attachedTaskDetails;

          // Create the IActivityTask object by merging existing data with task summary updates
          const activityTaskUpdateData: IActivityTask = {
            // Required fields from existing activity task
            task_rid: data.task_rid, // Activity task RID
            account_rid: data.account_rid,
            accountRid: data.account_rid,
            attach_to: fullAccountTaskDetails.attach_to || data.attach_to,

            // Fields that can be overridden from task summary
            task_name: data.task_name || fullAccountTaskDetails.task_name,
            description: data.description || fullAccountTaskDetails.description,

            // Map status fields
            status_rid: data.status_rid || fullAccountTaskDetails.status_rid,

            // Priority mapping
            priority_rid: data.priority_rid || fullAccountTaskDetails.priority_rid,

            // Date fields
            effective_start_datetime: data.effective_start_datetime
              ? new Date(data.effective_start_datetime)
              : (fullAccountTaskDetails.effective_start_datetime ? new Date(fullAccountTaskDetails.effective_start_datetime) : currentDate),

            effective_end_datetime: data.effective_end_datetime
              ? new Date(data.effective_end_datetime)
              : (fullAccountTaskDetails.effective_end_datetime ? new Date(fullAccountTaskDetails.effective_end_datetime) : currentDate),

            // Fields from existing activity task (not editable from task summary)
            created_by: fullAccountTaskDetails.created_by,
            modified_by: userId,
            created_datetime: fullAccountTaskDetails.created_datetime ? new Date(fullAccountTaskDetails.created_datetime) : currentDate,
            modified_datetime: currentDate,

            // Other required fields
            activity_type: fullAccountTaskDetails.activity_type || 'general',
            fiscal_year: data.fiscal_year || fullAccountTaskDetails.fiscal_year || new Date().getFullYear(),
            attachment_level: fullAccountTaskDetails.attachment_level || 'account',

            // Optional fields
            assigned_to: fullAccountTaskDetails.assigned_to,
            remainder_interval: fullAccountTaskDetails.remainder_interval,
            checklist_rid: fullAccountTaskDetails.checklist_rid,
            task_template_rid: fullAccountTaskDetails.task_template_rid,
            tags: fullAccountTaskDetails.tags || [],
          };

          logMessage(`Propagating task summary changes to activity task: ${JSON.stringify({
            fieldsPropagated: fieldsToPropagate,
            activityTaskData: {
              task_rid: activityTaskUpdateData.task_rid,
              task_name: activityTaskUpdateData.task_name,
              description: activityTaskUpdateData.description,
              status_rid: activityTaskUpdateData.status_rid,
              priority_rid: activityTaskUpdateData.priority_rid,
              effective_start_datetime: activityTaskUpdateData.effective_start_datetime,
              effective_end_datetime: activityTaskUpdateData.effective_end_datetime
            }
          })}`);

          // Call updateActivityTask with the prepared data
          const updateResult = await this.activityService.updateActivityTask(
            activityTaskUpdateData,
            userId
          );

          activityTaskUpdateResult = updateResult;

          if (updateResult.statusCode !== HttpStatus.SUCCESS) {
            return {
              statusCode: updateResult.statusCode,
              statusMessage: updateResult.errorMessage || STATUS_MESSAGE.updateFailed,
              data: null,
            };
          }

          // If successful, update attached task details
          if (updateResult.statusCode === HttpStatus.SUCCESS && updateResult.data?.task) {
            attachedTaskDetails = updateResult.data.task;
          }

        } catch (error) {
          logMessage(`Error updating activity task: ${error}`);
          return {
            statusCode: HttpStatus.FAILED,
            statusMessage: "Failed to update associated activity task",
            data: null,
          };
        }
      }
    }

    if (!attachedTaskExists) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        statusMessage: STATUS_MESSAGE.attachedTaskNotFound,
        data: null,
      };
    }

    // Date validations (only if we're not already updating the attached task)
    // OR if dates are being updated in task summary only
    const hasDateChangesInSummary = data.effective_start_datetime || data.effective_end_datetime;

    if (hasDateChangesInSummary) {
      const newStartDate = data.effective_start_datetime ? new Date(data.effective_start_datetime) : null;
      const newEndDate = data.effective_end_datetime ? new Date(data.effective_end_datetime) : null;

      // Validate start date <= end date if both provided
      if (newStartDate && newEndDate && newStartDate > newEndDate) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          statusMessage: STATUS_MESSAGE.startDateLessThanEndDate,
          data: null,
        };
      }

      // Validate against attached task dates (after update)
      if (attachedTaskDetails) {
        const attachedStart = attachedTaskDetails.start_date || attachedTaskDetails.effective_start_datetime;
        const attachedEnd = attachedTaskDetails.end_date || attachedTaskDetails.effective_end_datetime;

        if (attachedStart && newStartDate && newStartDate < new Date(attachedStart)) {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            statusMessage: "Task summary start date cannot be before attached task start date",
            data: null,
          };
        }

        if (attachedEnd && newEndDate && newEndDate > new Date(attachedEnd)) {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            statusMessage: "Task summary end date cannot be after attached task end date",
            data: null,
          };
        }
      }

      // Single date updates with validation against existing task summary dates
      if (newStartDate && !newEndDate) {
        const existingEndDate = existingTaskSummary.effective_end_datetime
          ? new Date(existingTaskSummary.effective_end_datetime)
          : null;

        if (existingEndDate && newStartDate > existingEndDate) {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            statusMessage: STATUS_MESSAGE.startDateLessThanEndDate,
            data: null,
          };
        }
      }

      if (newEndDate && !newStartDate) {
        const existingStartDate = existingTaskSummary.effective_start_datetime
          ? new Date(existingTaskSummary.effective_start_datetime)
          : null;

        if (existingStartDate && newEndDate < existingStartDate) {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            statusMessage: STATUS_MESSAGE.startDateLessThanEndDate,
            data: null,
          };
        }
      }
    }

    // Prepare update data using helper
    const getSetData = setInlineForTaskSummary(existingTaskSummary, data);

    if (getSetData.statusMessage != null) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        statusMessage: getSetData.statusMessage,
        data: null,
      };
    }

    // Update task summary
    const replacements = {
      ...getSetData.values,
      rid: data.rid,
      account_rid: data.account_rid
    };

    // Update task summary
    const updatedTaskSummary = await mainSequelize.query(
      rawQueries.updateTaskSummaryQuery(getSetData, data),
      {
        replacements: replacements, // Pass as object for named parameters
        type: QueryTypes.UPDATE
      }
    );

    if (updatedTaskSummary) {
      // Fetch latest updated data
      const fetchLatestUpdatedData: any = await mainSequelize.query(
        await rawQueries.fetchTaskSummaryDetails(data.rid, data.account_rid)
      );

      // Structure response
      const latestData: any = fetchLatestUpdatedData[0][0];
      const finalStructuredData = {
        rid: latestData.rid,
        r_number: latestData.r_number,
        account_rid: latestData.account_rid,
        attach_to: latestData.attach_to,
        attachment_level: latestData.attachment_level,
        task_name: latestData.task_name,
        description: latestData.description,
        fiscal_year: latestData.fiscal_year,
        assigned_to: latestData.assigned_to,
        assigned_to_name: latestData.assigned_to_name,
        status_rid: latestData.status_rid,
        status_name: latestData.status_name,
        priority_rid: latestData.priority_rid,
        priority_name: latestData.priority_name,
        effective_start_datetime: latestData.effective_start_datetime
          ? new Date(latestData.effective_start_datetime).toISOString()
          : null,
        effective_end_datetime: latestData.effective_end_datetime
          ? new Date(latestData.effective_end_datetime).toISOString()
          : null,
        task_rid: latestData.task_rid,
        task_details: latestData.task_details,
        created_by: latestData.created_by,
        modified_by: latestData.modified_by,
        created_datetime: latestData.created_datetime,
        modified_datetime: latestData.modified_datetime,
        attach_to_name: latestData.attach_to_name,
        account_status_name: latestData.account_status_name,
        created_by_name: latestData.created_by_name,
        modified_by_name: latestData.modified_by_name,
        account_name: latestData.account_name,
      };

      return {
        statusCode: HttpStatus.SUCCESS,
        statusMessage: STATUS_MESSAGE.taskSummaryUpdatedSuccess,
        data: finalStructuredData,
      };
    }

    return {
      statusCode: HttpStatus.FAILED,
      statusMessage: STATUS_MESSAGE.updateFailed,
      data: null,
    };
  }

}
