import { initOrgSequelize } from "../../config/orgDataSource";
import dayjs from "dayjs";
import { initMainDbSequelize } from "../../config/mainDataSource";
import {
  col,
  fn,
  Op,
  QueryTypes,
  Sequelize,
  Transaction,
  UUIDV4,
  where,
} from "sequelize";
import { CaseModelService } from "../caseModelsService";
import {
  ALPHANUMERIC_CONDITIONS,
  filtersColumnsForCaseSummary,
  filtersColumnsForReviewProjects,
  filterTypesForCaseSummary,
  filterTypesForReviewProjects,
  HttpStatus,
  MAIN_SCHEMA_NAME,
  mainTableFilters,
  rawQueries,
  SCHEMANAME_PREFIX,
  STATUS_MESSAGE,
} from "../../utils/constants";
import { buildDatetimeFilterCondition, buildNumericFilterCondition, buildStringFilterCondition, deleteFromAzureBlob, errorLog, generateSasUrl, getColumnsNamesForTaskCommentsUpdate, getColumnsNamesForTaskUpdate, logMessage, uploadToAzureBlob } from "../../utils/helpers";
import {
  AddCommentsType,
  assignProjectType,
  CaseHeadersColumns,
  CaseTaskQueryType,
  CreateCaseTaskType,
  DeleteCommentsType,
  FilterType,
  filterType,
  IActivityTask,
  ICreateCases,
  ICreateCaseTeam,
  ICreateChecklist,
  ICreateChecklistItem,
  TaskTypeResponse,
  TeamMember,
  UpdateCaseTaskType,
  UpdateCommentsType,
} from "../../utils/types";

// Define filterType interface
import { Case, setupCaseSequence } from "../../models/caseModel";
import {
  fetchCaseDetails,
  fetchCasesHeadersDatas,
  fetchCaseSpecificTaskQuery,
  fetchMilestoneTaskTemplate,
  fetchProjectsForCases,
  listAllCasesSummaryQuery,
  listReviewProjectsInfo,
} from "../../utils/rawQueries";
import { CaseProject } from "../../models/caseProjectsModel";
import {
  CaseTimeline,
  setupCaseTimelineSequence,
} from "../../models/caseTimeline";
import {
  CaseHistory,
  setupCaseHistorySequence,
} from "../../models/caseHistory";
import { CaseTeam, setupCaseTeamSequence } from "../../models/caseTeamModel";
import { Jurisdiction } from "../../models/jurisdiction";
import { CaseHistorySubmission, setupCaseHistorySubmissionSequence } from "../../models/caseHistorySubmissionModel";
import { log } from "console";
import { CheckList, setupCheckListSequence } from "../../models/checkListModel";
import { CheckListItem } from "../../models/checkListItemModel";
import { CaseTask, setupCaseTaskSequence } from "../../models/caseTaskModel";
import { CaseMilestone, setupCaseMilestoneSequence } from "../../models/caseMilestoneModel";
import { setupTaskCollaboratorsSequence, TaskCollaborators } from "../../models/taskCollaboratorsModel";
import { setupTaskTagSequence, TaskTag } from "../../models/taskTagsModel";
import { Tags } from "../../models/tagsModel";
import { setupTaskCommentsSequence, TaskComments } from "../../models/taskCommentsModel";
import { CommentsAttachments, setupCommentsAttachmentsSequence } from "../../models/commentsAttachmentModel";
import { setupTaskAttachmentsSequence, TaskAttachments } from "../../models/taskAttachmentModel";

class ActivitySchemaService {
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;
  private caseModelService: CaseModelService;

  constructor() {
    this.caseModelService = new CaseModelService();
  }

  /**
   * Checks if a table exists in the specified schema
   */
  private async checkTableExists(
    schemaName: string,
    tableName: string
  ): Promise<boolean> {
    try {
      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.caseModelService.getSequelize();
      }

  
      const checkTableQuery = rawQueries.checkCaseTableExists(schemaName);

      const [tableExists] = await this.orgDbSequelize.query(checkTableQuery, {
        type: "SELECT",
      });

      if ((tableExists as any).exists === false) {
        return false;
      }
      return true;
    } catch (error) {
      logMessage(`Error checking table existence: ${error}`);
      return false;
    }
  }

  async fetchValidAccountNumberById(accountId: string) {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.caseModelService.getMainSequelize();
      }

      const [account]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchParentAccountDetails,
        {
          replacements: { rid: accountId },
          type: "SELECT",
        }
      );

      let accountRnumber = account?.r_number;

      if (account?.storage_type === "store_in_parent") {
        const [accountData]: any[] = await this.mainDbSequelize.query(
          rawQueries.fetchParentAccountDetails,
          {
            replacements: { rid: account?.parent_account_rid },
            type: "SELECT",
          }
        );
        accountRnumber = accountData?.r_number;
      }

      return {
        accountNumber: accountRnumber,
        accountId: account?.rid,
        accountName: account?.account_name,
        parentAccountId: account?.parent_account_rid,
      };
    } catch (err) {
      logMessage(`Error fetching account: ${err}`);
      throw new Error("Error fetching account : " + (err as Error).message);
    }
  }





  async fetchCheckListForTask (accountNumber : string, caseRid : string) {
    try {
      const {CheckList, CheckListItem} = await this.caseModelService.getModels(accountNumber);
      const checklistData = await CheckList.findOne({
        where : {rid : caseRid}
      })
        const checklistItems = await CheckListItem.findAll({
          attributes: ["checklist_item_name", "checklist_item_description", "status_rid"],
          where: { checklist_rid: checklistData?.rid }
        })

      // Fetch status names for each status_rid
      const statusRids = [...new Set(checklistItems.map(item => item.status_rid).filter(Boolean))].filter((rid): rid is string => typeof rid === 'string');
      let statusMap: Record<string, string> = {};
      if (statusRids.length > 0) {
        if (!this.mainDbSequelize) {
          this.mainDbSequelize = await this.caseModelService.getMainSequelize();
        }
        const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(/\D/g, "")}`;
        const statusQuery = rawQueries.fetchCheckListStatusNamesByRids(schemaName, statusRids);
        const statusResults = await this.mainDbSequelize.query(statusQuery, { type: "SELECT" });
        statusMap = Object.fromEntries(statusResults.map((s: any) => [s.rid, s.status_name]));
      }

      // Attach status_name to each checklist item
      const response = checklistItems.map(item => ({
        ...item.get ? item.get({ plain: true }) : item,
        status_name: item.status_rid ? statusMap[item.status_rid] || null : null
      }));

      return {
        checklistData,
        checklistItems: response
      }
    } catch (err) {
      logMessage(`Error fetching checklist for task: ${err}`);
      throw new Error(    
        "Error fetching checklist for task: " + (err as Error).message
      );
    }
  } 
  async getTaskType () {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const [result] = await this.mainDbSequelize.query<TaskTypeResponse>(rawQueries.getSpecificTaskType(), {type : QueryTypes.SELECT});
    if(result) return result
    else return null;
  }
  async getTaskStatus () {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const [result] = await this.mainDbSequelize.query<TaskTypeResponse>(rawQueries.getSpecificTaskStatus(), {type : QueryTypes.SELECT});
    if(result) return result
    else return null;
  }
   async createActivityTask(
      accountNumber: string,
      taskRequest: IActivityTask,
      transaction: Transaction
    ) {
      // Implementation for creating interactions in the database
      try {
        const { Activities } = await this.caseModelService.getModels(accountNumber);
        taskRequest.activity_type = "Task";
        const casecreationResponse = await Activities.create(taskRequest, {
          transaction,
        });
  
      
  
        return casecreationResponse;
      } catch (error) {
        logMessage(`Error creating case: ${error}`);
        throw new Error("Error creating case: " + error);
      }
    }

}




export default ActivitySchemaService;
