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


const services = Configurations.getInstance().getServices();
// const taskSummarySchemaService = new TaskSummarySchemaService();

export default class TaskSummaryGraphqlServices {
//   private taskInjestionService: TaskInjestionService;
//   private taskSummarySchema: TaskSummarySchemaService;

  constructor() {
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
    const checkForExistingData: any = await orgSequelize.query(
      rawQueries.findTaskSummaryDetails(schemaName, data.rid, data.account_rid)
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

    if (data.attachment_level === "project") {
      const projectTaskQuery: any = await orgSequelize.query(
        rawQueries.findProjectTaskDetails(schemaName, data.task_rid, data.account_rid)
      );
      attachedTaskExists = projectTaskQuery[0].length > 0;
      attachedTaskDetails = projectTaskQuery[0][0];
    } else if (data.attachment_level === "case") {
      const caseTaskQuery: any = await orgSequelize.query(
        rawQueries.findCaseTaskDetails(schemaName, data.task_rid, data.account_rid)
      );
      attachedTaskExists = caseTaskQuery[0].length > 0;
      attachedTaskDetails = caseTaskQuery[0][0];
    }

    if (!attachedTaskExists) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        statusMessage: STATUS_MESSAGE.attachedTaskNotFound,
        data: null,
      };
    }

    // Date validations
    if (data.effective_start_datetime && data.effective_end_datetime) {
      const newStartDate = new Date(data.effective_start_datetime);
      const newEndDate = new Date(data.effective_end_datetime);
      
      if (newStartDate > newEndDate) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          statusMessage: STATUS_MESSAGE.startDateLessThanEndDate,
          data: null,
        };
      }

      // Validate against attached task dates
      if (attachedTaskDetails) {
        const attachedStart = attachedTaskDetails.start_date || attachedTaskDetails.effective_start_datetime;
        const attachedEnd = attachedTaskDetails.end_date || attachedTaskDetails.effective_end_datetime;
        
        if (attachedStart && newStartDate < new Date(attachedStart)) {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            statusMessage: "Task summary start date cannot be before attached task start date",
            data: null,
          };
        }
        
        if (attachedEnd && newEndDate > new Date(attachedEnd)) {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            statusMessage: "Task summary end date cannot be after attached task end date",
            data: null,
          };
        }
      }
    }

    // Single date updates with validation
    if (data.effective_start_datetime && !data.effective_end_datetime) {
      const newStartDate = new Date(data.effective_start_datetime);
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

    if (data.effective_end_datetime && !data.effective_start_datetime) {
      const newEndDate = new Date(data.effective_end_datetime);
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

    // Fetch status map
    const statusMap = await this.getTaskStatusMap(mainSequelize);
    
    // Update status_rid if status name provided
    if (data.status_name && statusMap.has(data.status_name)) {
      data.status_rid = statusMap.get(data.status_name);
    }

    // Update priority_rid if priority name provided
    if (data.priority_name) {
      const priorityMap = await this.getPriorityMap(mainSequelize);
      if (priorityMap.has(data.priority_name)) {
        data.priority_rid = priorityMap.get(data.priority_name);
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
    const updatedTaskSummary = await orgSequelize.query(
      rawQueries.updateTaskSummaryQuery(schemaName, getSetData, data)
    );

    if (updatedTaskSummary) {
      // Fetch latest updated data
      const fetchLatestUpdatedData = await this.taskSummarySchema.getTaskSummaryById(
        data.account_rid,
        data.rid
      );

      // Add timeline entry
      await taskSummarySchemaService.addTaskSummaryTimelineForInlineEdit(
        accountNumber,
        "update",
        data.account_rid,
        data.rid,
        data.userId
      );

      // Run aggregation/injestion after update
      await this.taskInjestionService.runAggregationAfterInlineUpdate(
        accountNumber,
        data,
        existingTaskSummary,
        data.userId
      );

      // Add history entry
      await taskSummarySchemaService.addTaskSummaryHistoryForInline(
        accountNumber,
        data,
        existingTaskSummary,
        data.rid,
        data.userId
      );

      // Structure response
      const latestData: any = fetchLatestUpdatedData.data;
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
        modified_datetime: latestData.modified_datetime
      };

      return {
        statusCode: HttpStatus.SUCCESS,
        statusMessage: STATUS_MESSAGE.taskSummaryUpdatedSuccess,
        data: finalStructuredData,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      statusMessage: STATUS_MESSAGE.updateFailed,
      data: null,
    };
  }

  private async getTaskStatusMap(mainSequelize: any): Promise<Map<string, string>> {
    const statusQuery: any = await mainSequelize.query(
      rawQueries.fetchTaskStatuses()
    );
    
    const statusMap = new Map<string, string>();
    statusQuery[0].forEach((status: any) => {
      statusMap.set(status.status_name, status.rid);
    });
    
    return statusMap;
  }

  private async getPriorityMap(mainSequelize: any): Promise<Map<string, string>> {
    const priorityQuery: any = await mainSequelize.query(
      rawQueries.fetchPriorities()
    );
    
    const priorityMap = new Map<string, string>();
    priorityQuery[0].forEach((priority: any) => {
      priorityMap.set(priority.priority_name, priority.rid);
    });
    
    return priorityMap;
  }
}
