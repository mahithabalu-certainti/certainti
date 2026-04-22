import { initSequelize } from "../config/maindbDataSource";
import { Sequelize, Op } from "sequelize";
import { Logger } from "winston";
import { logMessage } from "../utils/helpers";
import { initOrgSequelize } from "../config/orgDataSource";
import {
  schedulerStatus,
  rawQueries,
  schedulerTaskName,
  ruleTemplateNames,
  ruleNames,
} from "../utils/constants";
import { WorkFlowService } from "./workflowService";

export class SchedulerService {
  private logger: Logger;
  private mainDbSequelize: Sequelize | null = null;
  private orgDbSequelize: Sequelize | null = null;
  private workflowService: WorkFlowService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.workflowService = new WorkFlowService(logger);
  }

  private async getMainDb() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initSequelize();
    }
    return this.mainDbSequelize;
  }
  private async getOrgDb() {
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await initOrgSequelize();
    }
    return this.orgDbSequelize;
  }

  async createSchedulerRecords() {
    const mainDb = await this.getMainDb();
    // Use a raw query to check for running scheduler
    const [findSchedulerExists]: any[] = await mainDb.query(
      rawQueries.schedulerSelectRunning(),
      {
        replacements: { status: schedulerStatus.Running ,
        scheduler_name : 'RuleEngine'
        },
        type: "SELECT",
      }
    );
    if (!findSchedulerExists) {
      const now = new Date();
      const [result]: any = await mainDb.query(
        rawQueries.schedulerInsertRunning(),
        {
          replacements: {
            created_datetime: now,
            started_at: now,
            status: schedulerStatus.Running,
            scheduler_name : 'RuleEngine'
          },
          type: "INSERT",
        }
      );
      return result && result[0] ? result[0] : null;
    }
  }

  async triggerRuleFromScheduler(schedulerRecord: any) {
    const mainDb = await this.getMainDb();
    const orgDb = await this.getOrgDb();
    try {
      logMessage("AI Trigger Scheduler started");
      const isRecordExists = await this.findTaskRecordExists(
        schedulerRecord.rid,
        schedulerTaskName.caseSubmissionOverDue
      );
      if (isRecordExists == null) {
        await this.createSchedulerTaskRecords(
          schedulerRecord.rid,
          schedulerTaskName.caseSubmissionOverDue
        );
      }
      await this.fetchCasesForRuleTrigger(mainDb, orgDb);
      await this.updateSchedulerTaskRecords(
        schedulerRecord.rid,
        schedulerTaskName.caseSubmissionOverDue,
        schedulerStatus.Success,
        ""
      );
      await this.updateSchedulerRecords(
        schedulerRecord.rid,
        schedulerStatus.Success
      );
    } catch (error: any) {
      this.logger.error(`Scheduler error: ${error?.message || error}`);
      await this.updateSchedulerTaskRecords(
        schedulerRecord.rid,
        schedulerTaskName.caseSubmissionOverDue,
        schedulerStatus.Failed,
        error?.message || String(error)
      );
      await this.updateSchedulerRecords(
        schedulerRecord.rid,
        schedulerStatus.Failed
      );
    }
  }

  fetchCasesForRuleTrigger = async (mainDb: Sequelize, orgDb: Sequelize) => {
    // Helper to map status names
    const mapStatusNames = (
      records: any[],
      mapCaseStatus: Map<string, string>
    ) =>
      records.map((d: any) => ({
        ...d,
        status_name:
          mapCaseStatus.get(d.status_rid) == undefined
            ? null
            : mapCaseStatus.get(d.status_rid)?.toLowerCase(),
      }));

     
    // Helper to build rule engine payload
    const buildPayload = (
      data: any,
      eventName: string,
      templateName: string,
      entityType: string
    ) => {
      if (entityType === "Task") {
        return {
          entity:entityType,
          entityName: data.task_name,
          caseName: data.case_name,
          status: data.status_name,
          eventName: eventName,
          triggerType: "scheduler",
          userId: data.assigned_to,
          accountRid: data.account_rid,
          plannedStartDate: data.effective_start_datetime,
          dueDate: data.effective_end_datetime,
          entityRid: data.task_rid,
          targetUserID: data.assigned_to,
          targetEmail: data.email,
        };
      } else {
        return {
          entity:entityType,
          entityName: data.case_name,
          accountName: data.account_name,
          triggerType: "scheduler",
          status: data.status_name,
          eventName: eventName,
          userId: data.created_by,
          targetUserID: data.case_owner_rid,
          targetEmail: data.email,
          accountRid: data.account_rid,
          plannedSubmissionDate: data.planned_submission_date,
          statutorySubmissionDate: data.statutory_submission_date,
          entityRid: data.rid,
        };
      }
    };

    // Fetch in-progress status and build status map
    let fetchInProgressCaseStatus: any = await mainDb.query(
      rawQueries.fetchCaseStatus()
    );
    const mapCaseStatus: Map<string, string> = new Map();
    if (
      fetchInProgressCaseStatus &&
      fetchInProgressCaseStatus.length > 0
    ) {
      for (const d of fetchInProgressCaseStatus[0]) {
        mapCaseStatus.set(d.rid, d.status_name);
      }
    }
   

    // 1. Planned Submission Date Overdue
    const [inProgressCasesOverdue]: any[] = await mainDb.query(
      rawQueries.fetchAllCases()
    );
    const updatedResponse = mapStatusNames(
      inProgressCasesOverdue,
      mapCaseStatus
    );
    await Promise.all(
      updatedResponse.map(async (data: any) => {
        try {
          await this.workflowService.execute(
            buildPayload(
              data,
              ruleNames.caseCreated,
              ruleTemplateNames.caseCreated,
              "Case"
            ),
            data.userId || data.created_by
          );
        } catch (err) {
          this.logger.error(
            `Workflow execution failed  ${data.rid}: ${err}`
          );
        }
      })
    );
    // 2. In Progress Case Task
    // Fetch in-progress status and build status map
    let [fetchTaskType]: any[] = await mainDb.query(
      rawQueries.fetchTaskTypes()
    );
    let fetchInProgressTaskStatus: any = await mainDb.query(
      rawQueries.fetchTaskStatus(),
      { type: "SELECT" }
      
    );
    const mapTaskStatus: Map<string, string> = new Map();
    if (
      fetchInProgressTaskStatus &&
      fetchInProgressTaskStatus.length > 0
    ) {
      for (const d of fetchInProgressTaskStatus) {
        mapTaskStatus.set(d.rid, d.task_status_name);
      }
    }
    const inProgressTask: any = await mainDb.query(
      rawQueries.fetchAllCaseTask(
        fetchTaskType[0]?.rid
      )
    );
    const updatedTaskResponse = mapStatusNames(
      inProgressTask[0],
      mapTaskStatus
    );
    await Promise.all(
      updatedTaskResponse.map(async (data: any) => {
        try {
          await this.workflowService.execute(
            buildPayload(
              data,
              ruleNames.taskCreated,
              ruleTemplateNames.taskCreated,
              "Task"
            ),
            data.userId || data.created_by
          );
        } catch (err) {
          this.logger.error(
            `Workflow execution failed for planned overdue case ${data.rid}: ${err}`
          );
        }
      })
    );

    // 2. Statutory Submission Date Overdue
    // const statutoryOverdueCases: any = await mainDb.query(
    //   rawQueries.fetchCasesStatutoryOverdue(inProgressStatusRid)
    // );
    // const statutoryResponse = mapStatusNames(statutoryOverdueCases[0], mapCaseStatus);
    // await Promise.all(
    //   statutoryResponse.map(async (data: any) => {
    //     try {
    //       await this.workflowService.execute(
    //         buildPayload(data, 'statutory'),
    //         data.userId || data.created_by
    //       );
    //     } catch (err) {
    //       this.logger.error(`Workflow execution failed for statutory overdue case ${data.rid}: ${err}`);
    //     }
    //   })
    // );
  };

  async updateSchedulerTaskRecords(
    executionRid: string,
    taskName: string,
    status: string,
    errorMessage: string
  ) {
    const mainDb = await this.getMainDb();
    await mainDb.query(rawQueries.schedulerTaskExecutionUpdate(), {
      replacements: {
        status: status,
        errorMessage: errorMessage,
        completedAt: status == schedulerStatus.Success ? new Date() : null,
        executionRid: executionRid,
        taskName: taskName,
      },
      type: "UPDATE",
    });
  }

  async updateSchedulerRecords(executionRid: string, status: string) {
    const mainDb = await this.getMainDb();
    await mainDb.query(rawQueries.schedulerExecutionUpdate(), {
      replacements: {
        status: status,
        executionRid: executionRid,
      },
      type: "UPDATE",
    });
  }
  async findTaskRecordExists(executionRid: string, taskName: string) {
    const mainDb = await this.getMainDb();
    const [result]: any = await mainDb.query(
      rawQueries.schedulerTaskExecutionSelect(),
      {
        replacements: {
          executionRid: executionRid,
          taskName: taskName,
        },
        type: "SELECT",
      }
    );
    return result || null;
  }

  async createSchedulerTaskRecords(executionRid: string, taskName: string) {
    const mainDb = await this.getMainDb();
    // Check if the scheduler execution is running
    const [findTaskAlreadyRunning]: any = await mainDb.query(
      rawQueries.schedulerExecutionSelect(),
      {
        replacements: {
          executionRid: executionRid,
          status: schedulerStatus.Running,
        },
        type: "SELECT",
      }
    );
    if (findTaskAlreadyRunning) {
      const now = new Date();
      const [result]: any = await mainDb.query(
        rawQueries.schedulerTaskExecutionInsert(),
        {
          replacements: {
            taskName: taskName,
            executionRid: executionRid,
            startedAt: now,
            createdDatetime: now,
            status: schedulerStatus.Running,
          },
          type: "INSERT",
        }
      );
      return result && result[0] ? result[0] : null;
    }
  }
}
