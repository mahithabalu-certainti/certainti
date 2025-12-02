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
  ENV_PREFIX,
  filtersColumnsForCaseSummary,
  filtersColumnsForReviewProjects,
  filterTypesForCaseSummary,
  filterTypesForReviewProjects,
  HttpStatus,
  MAIN_SCHEMA_NAME,
  mainTableFilters,
  rawQueries,
  relationshipTypes,
  SCHEMANAME_PREFIX,
  STATUS_MESSAGE,
} from "../../utils/constants";
import { buildDatetimeFilterCondition, buildNumericFilterCondition, buildStringFilterCondition, decryptClientSecret, deleteFromAzureBlob, errorLog, generateSasUrl, getColumnsNamesForTaskCommentsUpdate, getColumnsNamesForTaskUpdate, logMessage, uploadToAzureBlob } from "../../utils/helpers";
import {
  AddCommentsType,
  assignProjectType,
  CaseHeadersColumns,
  CaseTaskQueryType,
  CaseTaskWorkFlowCreate,
  CaseTaskWorkFlowDelete,
  CreateCaseTaskType,
  DeleteCommentsType,
  FilterType,
  filterType,
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
  fetchChecklistAttachToDetails,
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
import { CaseTeam } from "../../models/caseTeamModel";
import { Jurisdiction } from "../../models/jurisdiction";
import { CaseHistorySubmission, setupCaseHistorySubmissionSequence } from "../../models/caseHistorySubmissionModel";
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
import { CaseTaskWorkflowConnector, setupCaseTaskWorkflowConnectorSequence } from "../../models/caseTaskWorkflowConnectorModel";
import {v4 as uuidv4} from 'uuid'
import { TaskHistory } from "../../models/taskHistory";
import { WorkflowConnector } from "../../models/workflowConnectorModel";

class CaseSchemaService {
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
        currencyRid : account?.currency_rid
      };
    } catch (err) {
      logMessage(`Error fetching account: ${err}`);
      throw new Error("Error fetching account : " + (err as Error).message);
    }
  }

  async fetchCountryByAccountId(accountId: string) {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.caseModelService.getMainSequelize();
      }
      const [account]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchCountryByAccountId(accountId),
        {
          replacements: { rid: accountId },
          type: "SELECT",
        }
      );
      return {
        country_rid: account?.country_rid,
      };
    } catch (err) {
      logMessage(`Error fetching country: ${err}`);
      throw new Error("Error fetching country: " + (err as Error).message);
    }
  }

  async createCases(
    accountNumber: string,
    caseRequest: ICreateCases,
    transaction: Transaction
  ) {
    // Implementation for creating interactions in the database
    try {
      const { Case } = await this.caseModelService.getModels(accountNumber);
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(
        /\D/g,
        ""
      )}`;
      const tableExists = await this.checkTableExists(schemaName, "cases");
      if (!tableExists) {
         await this.createCaseTables(accountNumber);
      }
      await this.createCaseTables(accountNumber);
      const casecreationResponse = await Case.create(caseRequest, {
        transaction,
      });

      // Add timeline entry for case creation
      if (casecreationResponse && casecreationResponse.rid) {
        const fetchTaskTypeRid = await this.getTaskType();
        const fetchTaskStatusRid = await this.getTaskStatus()
        if(fetchTaskTypeRid) {
          await this.cloneDefaultMilestoneTaskTemplate(casecreationResponse.account_rid, casecreationResponse.rid,
          casecreationResponse.filing_type_rid, fetchTaskTypeRid.rid, accountNumber, transaction, casecreationResponse.case_startdate,
        fetchTaskStatusRid?.rid!)
        }
        await this.addCaseManagementTimeline(
          accountNumber,
          casecreationResponse.rid,
          caseRequest.account_rid,
          caseRequest,
          caseRequest.created_by || "",
          "created"
        );
        await this.addJurisdiction(
          casecreationResponse.account_rid,
          casecreationResponse.rid,
          accountNumber,
          caseRequest,
          transaction
        );
      }

      return casecreationResponse;
    } catch (error) {
      logMessage(`Error creating case: ${error}`);
      throw new Error("Error creating case: " + error);
    }
  }

  async addJurisdiction (accountRid : string, caseRid : string, accountNumber : string, caseRequest: ICreateCases, transaction: Transaction) {
    const { Jurisdiction} = await this.caseModelService.getModels(accountNumber);
    
    const accountJurisdictionData = await Jurisdiction.findOne({
      where : {
        entity_rid : accountRid
      }
    })

    if(accountJurisdictionData) {
      await Jurisdiction.create(
      {
        created_by: caseRequest.created_by,
        entity_rid: caseRid,
        is_federal_level: accountJurisdictionData.is_federal_level,
        is_state_level: accountJurisdictionData.is_state_level,
        states: accountJurisdictionData.states,
        level : "case",
      },
      { transaction }
      );
    }
  }

  async checkIsCaseNameUnique(
      caseReq: any,
      accountNumber: string
    ): Promise<boolean> {
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(
        /\D/g,
        ""
      )}`;
      const tableExists = await this.checkTableExists(schemaName, "cases");
      if (!tableExists) {
        logMessage(
          `Cases table does not exist for account ${accountNumber}, returning empty result`
        );
        return true;
      }
      const { Case } = await this.caseModelService.getModels(accountNumber);
      const response = await Case.findOne({
        where: {
          [Op.and]: [
            where(
              fn("LOWER", col("case_name")),
              Op.eq,
              caseReq.case_name.toLowerCase(),
              
            ),
            { fiscal_year: caseReq.fiscal_year }
          ]
        }
      });
      return !response;
    }
    async checkIsChecklistNameUnique(
      caseReq: any,
      accountNumber: string
    ): Promise<boolean> {
     
      const { CheckList } = await this.caseModelService.getModels(accountNumber);
      const response = await CheckList.findOne({
        where: {
          [Op.and]: [
            where(
              fn("LOWER", col("checklist_name")),
              Op.eq,
              caseReq.checklist_name.toLowerCase()
            ),
            { fiscal_year: { [Op.eq]: caseReq.fiscal_year } },
            { account_rid: { [Op.eq]: caseReq.account_rid } },
            {attachment_level: { [Op.eq]:caseReq.attachment_level } }
          ]
        }
      });
      return !response;
    }
    async  checkisExistingCheckilistUnique(caseReq: any, accountNumber: string): Promise<boolean> {
    const { CheckList } = await this.caseModelService.getModels(accountNumber);
    const response = await CheckList.findOne({
    where: {
    [Op.and]: [
      where(
        fn("LOWER", col("checklist_name")),
        Op.eq,
        caseReq.checklist_name.toLowerCase()
      ),
      { rid: { [Op.ne]: caseReq.checklist_rid } },
      { fiscal_year: { [Op.eq]: caseReq.fiscal_year } },
      { account_rid: { [Op.eq]: caseReq.account_rid } },
      {attachment_level: { [Op.eq]:caseReq.attachment_level } }
      ]
  }
});
return !response;
}

  async  checkisExistingCaseUnique(caseReq: any, accountNumber: string): Promise<boolean> {
    const { Case } = await this.caseModelService.getModels(accountNumber);
    const response = await Case.findOne({
    where: {
    [Op.and]: [
      where(
        fn("LOWER", col("case_name")),
        Op.eq,
        caseReq.case_name.toLowerCase()
      ),
      { rid: { [Op.ne]: caseReq.case_rid } },
       { fiscal_year: caseReq.fiscal_year }
    ]
  }
});
return !response;
}
  async addCaseSummary(
    accountNumber: string,
    caseData: ICreateCases,
    caseRid: string,
    caseRnumber: string
  ) {
    try {
      const { CaseSummary } = await this.caseModelService.getModels(
        accountNumber
      );

      await CaseSummary.create({
        case_rid: caseRid,
        r_number: caseRnumber,
        ...caseData,
      });
    } catch (error) {
      logMessage(`Error creating case summary: ${error}`);
      throw new Error(
        "Error creating case summary: " + (error as Error).message
      );
    }
  }

  async updateCases(
    accountNumber: string,
    userId: string,
    caseRequest: ICreateCases,
    transaction: Transaction
  ) {
    // Implementation for creating interactions in the database
    try {
      const { Case, CaseSummary } = await this.caseModelService.getModels(
        accountNumber
      );

      const existingCase = await Case.findOne({
        where: { rid: caseRequest.case_rid },
        transaction,
      });

      const caseUpdateResponse = await Case.update(
        {
          ...caseRequest,
          modified_by: userId,
          modified_datetime: new Date(),
        },
        {
          where: { rid: caseRequest.case_rid },
          transaction,
        }
      );
      await CaseSummary.update(
        {
          ...caseRequest,
          modified_by: userId,
          modified_datetime: new Date(),
        },
        {
          where: {
            case_rid: caseRequest.case_rid,
          },
        }
      );
      await this.updateCaseHistory(
        accountNumber,
        caseRequest.case_rid as string,
        { ...caseRequest, modified_by: userId },
        existingCase
      );

      // Add timeline entry for case update
      if (caseRequest.case_rid) {
        await this.addCaseManagementTimeline(
          accountNumber,
          caseRequest.case_rid,
          caseRequest.account_rid,
          caseRequest,
          userId,
          "updated",
          "success",
          existingCase
        );
      }

      return caseUpdateResponse;
    } catch (error) {
      logMessage(`Error updating cases: ${error}`);
      throw new Error("Error updating cases: " + error);
    }
  }

  async updateCaseHistory(
    accountNumber: string,
    caseId: string,
    newCaseData: any,
    existingCaseData: any
  ) {
    try {
      const { CaseHistory } = await this.caseModelService.getModels(
        accountNumber
      );

      const excludedFields = [
        "created_by",
        "modified_by",
        "case_rid",
        "account_rid",
        "modified_datetime",
      ];

      const cleanedNewData = Object.fromEntries(
        Object.entries(newCaseData).filter(
          ([key]) => !excludedFields.includes(key)
        )
      );

      const historyChanges = Object.entries(cleanedNewData)
        .filter(([key, newValue]) => {
          const oldValue = existingCaseData[key];

          if (newValue == null && oldValue == null) return false;

          if (typeof newValue === "number" || typeof oldValue === "number") {
            return Number(newValue) !== Number(oldValue);
          }

          return String(newValue ?? "") !== String(oldValue ?? "");
        })
        .map(([key, newValue]) => ({
          case_rid: caseId,
          attribute_name: key,
          old_value:
            existingCaseData[key] !== null &&
            existingCaseData[key] !== undefined
              ? String(existingCaseData[key])
              : "",
          new_value:
            newValue !== null && newValue !== undefined ? String(newValue) : "",
          created_by: newCaseData["modified_by"],
        }));

      if (historyChanges.length === 0) return;

      // Use individual create operations to avoid sequence conflicts
      for (const historyChange of historyChanges) {
        await CaseHistory.create(historyChange);
      }
    } catch (err) {
      logMessage(`Error updating project history : ${JSON.stringify(err)}`);
      errorLog("Error updating project history : " + (err as Error).message);
      throw new Error(
        "Error updating project history : " + (err as Error).message
      );
    }
  }

  async createCaseTables(accountNumber: string) {
    try {
      const orgDbSequlize = await initOrgSequelize();
      const mainDbSequlize = await initMainDbSequelize();
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(
        /\D/g,
        ""
      )}`;

      const CaseModel = await Case.initialize(orgDbSequlize, schemaName);
      const caseTimelineModel = await CaseTimeline.initialize(
        orgDbSequlize,
        schemaName
      );
      const CaseProjectModel = await CaseProject.initialize(
        orgDbSequlize,
        schemaName
      );

      const caseHistoryModel = await CaseHistory.initialize(
        orgDbSequlize,
        schemaName
      );
      const caseTeamModel = await CaseTeam.initialize(
        orgDbSequlize,
        schemaName
      );
      const caseHistorySubmissionModel = await CaseHistorySubmission.initialize(
        orgDbSequlize,
        schemaName
      );
      const checkListModel = await CheckList.initialize(  
        orgDbSequlize,
        schemaName
      );
      const checkListItemModel = await CheckListItem.initialize(
        orgDbSequlize,
        schemaName
      );
      
      const CaseTaskModel = CaseTask.initialise(
        orgDbSequlize,
        schemaName
      )
      const CaseMilestoneModel = CaseMilestone.initialise(
        orgDbSequlize,
        schemaName
      )
      const TaskCollaboratorsModel = TaskCollaborators.initialise(
        orgDbSequlize,
        schemaName
      )
      const TaskTagsModel = TaskTag.initialise(
        orgDbSequlize,
        schemaName
      )

      const TaskCommentsModel = TaskComments.initialise(
        orgDbSequlize,
        schemaName
      )
      const CommentsAttachmentsModel = CommentsAttachments.initialise(
        orgDbSequlize,
        schemaName
      )
      const TaskAttachmentsModel = TaskAttachments.initialise(
        orgDbSequlize,
        schemaName
      )
      const CaseTaskWorkflowConnectorModel = CaseTaskWorkflowConnector.initialize(
        orgDbSequlize,
        schemaName
      )

      await CaseModel.sync({ force: false });
      await setupCaseSequence(orgDbSequlize, schemaName);
      await CaseProjectModel.sync({ force: false });
      await setupCaseSequence(orgDbSequlize, schemaName);
      await caseTimelineModel.sync({ force: false });
      await setupCaseTimelineSequence(orgDbSequlize, schemaName);
      await caseHistoryModel.sync({ force: false });
      await setupCaseHistorySequence(orgDbSequlize, schemaName);
      await caseTeamModel.sync({ force: false });
      await checkListModel.sync({ force: false });
      await setupCheckListSequence(orgDbSequlize, schemaName);
      await checkListItemModel.sync({ force: false });
      await CaseMilestoneModel.sync({ force : false});
      await setupCaseMilestoneSequence(orgDbSequlize, schemaName);
      await CaseTaskModel.sync({force : false});
      await setupCaseTaskSequence(orgDbSequlize, schemaName);
      await TaskCollaboratorsModel.sync({force : false});
      await setupTaskCollaboratorsSequence(orgDbSequlize, schemaName)
      await TaskTagsModel.sync({force : false})
      await setupTaskTagSequence(orgDbSequlize, schemaName)
      await TaskCommentsModel.sync({force : false})
      await setupTaskCommentsSequence(orgDbSequlize, schemaName)
      await CommentsAttachmentsModel.sync({force : false})
      await setupCommentsAttachmentsSequence(orgDbSequlize, schemaName)
      await TaskAttachmentsModel.sync({force : false})
      await setupTaskAttachmentsSequence(orgDbSequlize, schemaName)
      await caseHistorySubmissionModel.sync({ force: false });
      await setupCaseHistorySubmissionSequence(orgDbSequlize, schemaName);
      await CaseTaskWorkflowConnectorModel.sync({force : false});
      await setupCaseTaskWorkflowConnectorSequence(orgDbSequlize, schemaName)
    } catch (err) {
      console.log(err)
      errorLog("Error creating case tables", (err as Error).message);
      return this.throwServiceError(err as Error);
    }
  }

  async getCaseStatusByType(type: string) {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }

    const caseStatus = await this.mainDbSequelize.query(
      rawQueries.fetchCaseStatusByType(type),
      {
        replacements: { type },
        type: "SELECT",
      }
    );

    const sourceArr = caseStatus as Array<{
      rid: string;
      case_status_name: string;
    }>;
    return sourceArr.length > 0 ? sourceArr[0]?.rid : null;
  }

  async listAllCasesAccount(
    accountNumber: string,
    filters: Record<string, any>,
    data: any,
    page: number = 1,
    limit: number = 100,
    sortBy: string = "r_number",
    sortOrder: string = "ASC",
    userId: string,
    type: string = "list"
  ) {
    try {
      const offset = (page - 1) * limit;
      let modifiedByFilter;
      let modifiedByConditions;
      let caseOwnerFilter;
      let caseOwnerConditions;
      let caseNameFilter;
      let caseNameConditions;
      let totalResults: number = 0;
      let disablePagination = false;

      if (type === "download") {
        disablePagination = true;
      }
      const detectConditions = (filters: any) => {
        if (!filters) return null;

        for (let conditions of Object.values(ALPHANUMERIC_CONDITIONS)) {
          if (Object.keys(filters).includes(conditions)) {
            return conditions;
          }
        }
        return null;
      };
      if (filters?.modified_by) {
        modifiedByFilter = filters.modified_by;
        modifiedByConditions = detectConditions(modifiedByFilter);
      }
      if( filters?.case_name) {
        caseNameFilter = filters.case_name;
        caseNameConditions = detectConditions(caseNameFilter);
      }
      if (filters) {
        ["modified_by","case_name"].forEach((key) => {
          if (filters[key]) {
            disablePagination = true;
            delete filters[key];
          }
        });
      }
      if (mainTableFilters[sortBy] !== undefined) {
        disablePagination = true;
      }
      const { whereClause } = this.buildWhereClause(filters, data.search);
      const [finalSortBy, finalSortOrder] = this.getSortParameters(
        sortBy,
        sortOrder
      );
      const { Case } = await this.caseModelService.getModels(accountNumber);
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.caseModelService.getMainSequelize();
      }

      // Fetch technical summaries and count
      const whereConditions: any = {
        account_rid: data.account_rid,
        ...whereClause,
      };

      // Add fiscal year filter only if not 0
      if (
        data.fiscal_year != null &&
        data.fiscal_year !== 0 &&
        data.fiscal_year !== "0"
      ) {
        whereConditions.fiscal_year = data.fiscal_year;
      }

      // Check if cases table exists before querying
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(
        /\D/g,
        ""
      )}`;
      const tableExists = await this.checkTableExists(schemaName, "cases");

      if (!tableExists) {
        logMessage(
          `Cases table does not exist for account ${accountNumber}, returning empty result`
        );
        return {
          caseInfo: [],
          count: 0,
        };
      }

      const { rows: caseDetails, count } = await Case.findAndCountAll({
        where: whereConditions,
        order: [[finalSortBy, finalSortOrder]],
        ...(disablePagination ? {} : { limit: limit, offset: offset }),
      });

      if (caseDetails.length === 0) {
        return {
          caseInfo: [],
          count: 0,
        };
      }
      
      let createdByIds: any[] = [
        ...new Set(caseDetails.map((caseDetail: any) => caseDetail.created_by)),
      ];
      let modifiedByIds: any[] = [
        ...new Set(
          caseDetails.map((caseDetail: any) => caseDetail.modified_by)
        ),
      ];
      let statusIds: any[] = [
        ...new Set(caseDetails.map((caseDetail: any) => caseDetail.status_rid)),
      ];
      let filingTypeIds: any[] = [
        ...new Set(
          caseDetails.map((caseDetail: any) => caseDetail.filing_type_rid)
        ),
      ];
      let caseOwnerIds: any[] = [
        ...new Set(
          caseDetails.map((caseDetail: any) => caseDetail.case_owner_rid)
        ),
      ];
      let fetchCreatedByUsers = await this.mainDbSequelize.query(
        rawQueries.fetchUser(createdByIds)
      );
      let fetchModifiedByUsers = await this.mainDbSequelize.query(
        rawQueries.fetchUser(modifiedByIds)
      );
      let fetchStatusInfo = await this.mainDbSequelize.query(
        rawQueries.fetchStatus(statusIds)
      );
      let fetchFilingTypeInfo = await this.mainDbSequelize.query(
        rawQueries.fetchFilingType(filingTypeIds)
      );
      let fetchCaseOwnerInfo = await this.mainDbSequelize.query(
        rawQueries.fetchUser(caseOwnerIds)
      );

      let [accountInfo]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchAccountAndCountryDetails(data.account_rid),
        { type: QueryTypes.SELECT }
      );
      let createdMap: Map<string, string> = new Map(
        fetchCreatedByUsers[0].map((user: any) => [
          user.rid,
          `${user.first_name} ${user.last_name}`,
        ])
      );
      let modifiedMap: Map<string, string> = new Map(
        fetchModifiedByUsers[0].map((user: any) => [
          user.rid,
          `${user.first_name} ${user.last_name}`,
        ])
      );
      let statusMap: Map<string, string> = new Map(
        fetchStatusInfo[0].map((status: any) => [status.rid, status.name])
      );
      let filingTypeMap: Map<string, string> = new Map(
        fetchFilingTypeInfo[0].map((type: any) => [type.rid, type.name])
      );
      let caseOwnerMap: Map<string, string> = new Map(
        fetchCaseOwnerInfo[0].map((user: any) => [
          user.rid,
          `${user.first_name} ${user.last_name}`,
        ])
      );
      let finalData =
        caseDetails == null
          ? []
          : caseDetails.map((d: any) => {
              return {
                rid: d.rid,
                r_number: d.r_number,
                account_rid: d.account_rid,
                account_name: accountInfo?.account_name,
                country_code: accountInfo?.country_code,
                case_name: d.case_name,
                case_full_name: accountInfo?.account_name + '-' + accountInfo?.country_code + '-' + d.fiscal_year + '-' + d.case_name,
                description: d.description,
                fiscal_year: d.fiscal_year,
                case_owner_rid: d.case_owner_rid,
                case_owner_name: caseOwnerMap.get(d.case_owner_rid) || null,
                country_rid: d.country_rid,
                case_total_projects: d.case_total_projects,
                case_total_qualified_projects: d.case_total_qualified_projects,
                case_total_qualified_project_cost: d.case_total_qualified_project_cost,
                case_total_project_cost: d.case_total_project_cost,
                case_total_rd_cost: d.case_total_rd_cost,
                case_total_qre_cost: d.case_total_qre_cost,
                filing_type_rid: d.filing_type_rid,
                filing_type_name: filingTypeMap.get(d.filing_type_rid) || null,
                status_rid: d.status_rid,
                status_name: statusMap.get(d.status_rid) || null,
                created_by: d.created_by,
                created_user_name: createdMap.get(d.created_by) || null,
                modified_by: d.modified_by,
                modified_user_name: modifiedMap.get(d.modified_by) || null,
                created_datetime: d.created_datetime,
                modified_datetime: d.modified_datetime,
                submitted_datetime: d.submitted_datetime,
                approved_datetime: d.approved_datetime,
              };
            });
      const applyFilters = (
        data: any[],
        conditions: any,
        value: any,
        field: any
      ) => {

        if (!conditions || !field) return data;
        const val = value[conditions];
        let result;
        switch (conditions) {
          case ALPHANUMERIC_CONDITIONS.equals:
            result = data.filter((d: any) => {
              const fieldValue = d[field];
              const filterValue = val;
              return fieldValue?.toLowerCase() === filterValue?.toLowerCase();
            });
            break;
          case ALPHANUMERIC_CONDITIONS.notEquals:
            result = data.filter(
              (d: any) => d[field]?.toLowerCase() != val?.toLowerCase()
            );
            break;
          case ALPHANUMERIC_CONDITIONS.contains:
            result = data.filter((d: any) =>
              d[field]?.toLowerCase().includes(val?.toLowerCase())
            );
            break;
          case ALPHANUMERIC_CONDITIONS.IN:
            if (Array.isArray(val)) {
              result = data.filter((d: any) =>
                val.map((v: any) => v?.toLowerCase()).includes(d[field]?.toLowerCase())
              );
            } else {
              result = data;
            }
            break;
          case ALPHANUMERIC_CONDITIONS.isEmpty:
            result = data.filter((d: any) => d[field] == null);
            break;
          default:
            result = data;
        }

        return result;
      };

      if (caseOwnerConditions != null && caseOwnerConditions != undefined) {
        finalData = applyFilters(
          finalData,
          caseOwnerConditions,
          caseOwnerFilter,
          "case_owner_name"
        );
      }
      if (caseNameConditions != null && caseNameConditions != undefined) {
        finalData = applyFilters(
          finalData,
          caseNameConditions,
          caseNameFilter,
          "case_full_name"
        );
      }
      if (
        mainTableFilters[sortBy] != undefined &&
        sortOrder.toLowerCase() == "asc"
      ) {
        finalData = finalData.sort((a: any, b: any) => {
          if (!a?.[sortBy]) return 1;
          if (!b?.[sortBy]) return -1;
          return a[sortBy].localeCompare(b[sortBy]);
        });
      } else if (
        mainTableFilters[sortBy] != undefined &&
        sortOrder.toLowerCase() == "desc"
      ) {
        finalData = finalData.sort((a: any, b: any) => {
          if (!b?.[sortBy]) return 1;
          if (!a?.[sortBy]) return -1;
          return b[sortBy].localeCompare(a[sortBy]);
        });
      }
      totalResults = disablePagination ? finalData.length : count;
      let finalPaginatedData = [];
      if (type === "download") {
        finalPaginatedData = finalData;
      } else {
        finalPaginatedData = disablePagination
          ? finalData.slice((page - 1) * limit, page * limit)
          : finalData;
      }

      return {
        caseInfo: finalPaginatedData,
        count: totalResults,
      };
    } catch (err) {
      logMessage(`Error listing case information: ${err as Error}`);
      throw new Error(
        "Error listing case information: " + (err as Error).message
      );
    }
  }

  async getAllowedExportFields(
    userId: string,
    permission_name: string
  ): Promise<any[]> {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const [userInfo] = (await this.mainDbSequelize.query(
      rawQueries.fetchUserProfileId(),
      {
        replacements: { userId },
        type: QueryTypes.SELECT,
      }
    )) as [{ profile_rid: string }] | [];

    if (!userInfo?.profile_rid) {
      return [];
    }

    const [profileFields, userFields] = await Promise.all([
      this.mainDbSequelize.query(rawQueries.fetchProfilePermissions(), {
        replacements: {
          permissionName: permission_name,
          profileId: userInfo?.profile_rid,
        },
        type: "SELECT",
      }),
      this.mainDbSequelize.query(rawQueries.fetchUserPermissions(), {
        replacements: {
          permissionName: permission_name,
          userId,
        },
        type: QueryTypes.SELECT,
      }),
    ]);

    // Merge: user overrides profile
    const userFieldMap = new Map<string, any>();
    for (const field of userFields as any[]) {
      userFieldMap.set(field.field_name, field);
    }

    const merged = (profileFields as any[]).map((pf) => {
      const userPerm = userFieldMap.get(pf.field_name);
      if (userPerm) {
        userFieldMap.delete(pf.field_name);
        return {
          field_desc: pf.field_desc,
          field_name: pf.field_name,
          read: pf.read ? true : userPerm?.read === true,
        };
      }
      return {
        field_desc: pf.field_desc,
        field_name: pf.field_name,
        read: pf.read,
      };
    });

    const userOnly = Array.from(userFieldMap.values()).map((uf) => ({
      field_desc: uf.field_desc,
      field_name: uf.field_name,
      read: uf.read,
    }));

    const exportableFields = [...merged, ...userOnly].filter((f) => f.read);
    return exportableFields;
  }

  /**
   * Validates and normalizes sort parameters
   *
   * @param {string} sortBy - Field to sort by
   * @param {string} sortOrder - Sort order (ASC or DESC)
   * @returns {[string, string]} - Tuple of validated sort parameters
   */
  private getSortParameters(
    sortBy: string,
    sortOrder: string
  ): [string, string] {
    const validSortColumns = [
      "r_number",
      "created_datetime",
      "modified_datetime",
      "case_name",
      "fiscal_year",
      "case_total_projects",
      "case_total_qualified_projects",

      "case_total_project_cost",
      "case_total_rd_cost",
      "case_total_qre_cost",
      "status",
    ];
    if (sortBy === "createdAt") {
      sortBy = "created_datetime";
    }

    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }

  private buildSearchCondition(
    search: string,
    whereClause: Record<string, any>
  ): Record<string, any> {
    const searchCondition = {
      [Op.or]: [
        { case_name: { [Op.iLike]: `%${search}%` } },
        { r_number: { [Op.iLike]: `%${search}%` } },
      ],
    };

    return Object.keys(whereClause).length > 0
      ? { [Op.and]: [whereClause, searchCondition] }
      : searchCondition;
  }
   buildRawWhereClause(
      filters: Record<string, any>,
      search?: string
    ): { whereClause: any } {
    
      const whereClause: any = {
        [Op.and]: []
      };
    
      // Search logic
      if (search) {
        whereClause[Op.and].push({
          [Op.or]: [
            { checklist_name: { [Op.iLike]: `%${search}%` } },
            { r_number: { [Op.iLike]: `%${search}%` } },
            { checklist_description: { [Op.iLike]: `%${search}%` } },
            { attachment_level : { [Op.iLike]: `%${search}%` } }
          ]
        });
      }
    
      // Filter logic for your input structure
      Object.entries(filters).forEach(([field, filter]) => {
        if (!filter || typeof filter !== 'object') {
          return;
        }

        const operator = Object.keys(filter)[0];
        const value = operator ? filter[operator] : undefined;

        if (!operator || value === undefined) {
          return;
        }

        const condition: any = {};

        switch (field) {
          case 'checklist_name':
          case 'attachment_level':  
          case 'descriptions':
          case 'checklist_description':
          case 'attached_to':
          case 'attach_to':
          case 'r_number':
            switch (operator.toLowerCase()) {
              case 'equals': condition[field] = { [Op.iLike]: value }; break;
              case 'not_equals': condition[field] = { [Op.or]: [{ [Op.notILike]: value }, { [Op.is]: null }] }; break;          
              case 'contains': condition[field] = { [Op.iLike]: `%${value}%` }; break;
              case 'is_empty': condition[field] = { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: '' }] }; break;
              case 'in': condition[field] = { [Op.in]: Array.isArray(value) ? value : [value] }; break;
            }
            break;
          case 'created_datetime':
          case 'modified_datetime':
            switch (operator.toLowerCase()) {
              case 'equals': {
                const date = new Date(value);
                condition[field] = Sequelize.literal(`DATE("${field}") = DATE('${date.toISOString()}')`);
                break;
              }
              case 'before': {
                const date = new Date(value);
                condition[field] = Sequelize.literal(`DATE("${field}") < DATE('${date.toISOString()}')`);
                break;
              }
              case 'after': {
                const date = new Date(value);
                condition[field] = Sequelize.literal(`DATE("${field}") > DATE('${date.toISOString()}')`);
                break;
              }
              case 'between': {
                if (Array.isArray(value)) {
                  const startDate = new Date(value[0]);
                  const endDate = new Date(value[1]);
                  condition[field] = Sequelize.literal(
                    `DATE("${field}") BETWEEN DATE('${startDate.toISOString()}') AND DATE('${endDate.toISOString()}')`
                  );
                }
                break;
              }
              case 'is_empty': condition[field] = { [Op.is]: null }; break;
            }
            break;
          case 'fiscal_year':  
            switch (operator.toLowerCase()) {
              case 'equals': condition[field] = { [Op.eq]: value }; break;
              case 'not_equals': condition[field] = { [Op.or]: [{ [Op.ne]: value }, { [Op.is]: null }] }; break;          
              case 'in': condition[field] = { [Op.in]: Array.isArray(value) ? value : [value] }; break;
              case 'is_empty': condition[field] = { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: '' }] }; break;
            }
            break;

          default:
            logMessage(`Unhandled filter field: ${field}`);
        }

        if (Object.keys(condition).length > 0) {
          whereClause[Op.and].push(condition);
        }
      });
    
      return { whereClause: whereClause[Op.and].length > 0 ? whereClause : {} };
    }


















  private buildWhereClause(
    filters: Record<string, any>,
    search?: string
  ): {
   
    whereClause: Record<string, any>;
  } {
    let whereClause: Record<string, any> = {};
    if (search) {
      whereClause = this.buildSearchCondition(search, whereClause);
    }
    let includeClause: Array<any> = [];
    if (filters) {
      const filterProcessors: Record<string, Function> = {
        r_number: (value: any) =>
          this.processTextFilter("r_number", value, whereClause),
        created_datetime: (value: any) =>
          this.processDateFilter("created_datetime", value, whereClause),
        modified_datetime: (value: any) =>
          this.processDateFilter("modified_datetime", value, whereClause),
        status_rid: (value: any) =>
          this.processTextFilter("status_rid", value, whereClause),
        case_name: (value: any) =>
          this.processTextFilter("case_name", value, whereClause),
        filing_type_name: (value: any) =>
          this.processTextFilter("filing_type_rid", value, whereClause),
        case_owner_name: (value: any) =>
          this.processTextFilter("case_owner_rid", value, whereClause),
        fiscal_year: (value: any) =>
          this.processNumberFilter("fiscal_year", value, whereClause),
        case_total_projects: (value: any) =>
          this.processNumberFilter("case_total_projects", value, whereClause),
        case_total_qualified_projects: (value: any) =>
          this.processNumberFilter(
            "case_total_qualified_projects",
            value,
            whereClause
          ),
        case_total_project_cost: (value: any) =>
          this.processNumberFilter(
            "case_total_project_cost",
            value,
            whereClause
          ),
        case_total_rd_cost: (value: any) =>
          this.processNumberFilter("case_total_rd_cost", value, whereClause),
        case_total_qre_cost: (value: any) =>
          this.processNumberFilter("case_total_qre_cost", value, whereClause),
        submitted_datetime: (value: any) =>
          this.processDateFilter("submitted_datetime", value, whereClause),
        approved_datetime: (value: any) =>
          this.processDateFilter("approved_datetime", value, whereClause),
      };
      Object.keys(filters).forEach((key) => {
        const value = filters[key];
        if (value === undefined || value === null) return;
        if (filterProcessors[key]) {
          filterProcessors[key](value);
        } else if (value !== "") {
          whereClause[key] = value;
        }
      });
    }
    return { whereClause };
  }

  private processTextFilter(
    field: string,
    value: any,
    whereClause: Record<string | symbol, any>
  ): void {
    if (typeof value === "string") {
      // Simple string value - treat as equals
      whereClause[field] = value;
      
    } else if (typeof value === "object") {
      if (value.equals !== undefined) {
        whereClause[field] = Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col(field)),
          value.equals.toLowerCase()
        );
      } else if (value.not_equals !== undefined) {
        whereClause[field] = Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col(field)),
          "!=",
          value.not_equals.toLowerCase()
        );
      } else if (value.contains !== undefined) {
        whereClause[field] = { [Op.iLike]: `%${value.contains}%` };
      } else if (Array.isArray(value.in) && value.in.length > 0) {
        whereClause[Op.or] = value.in.map((val: string) =>
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col(field)),
            "=",
            val.toLowerCase()
          )
        );
      } else if (value.is_empty !== undefined) {
        if (value.is_empty) {
          whereClause[field] = { [Op.or]: [null, ""] };
        } else {
          whereClause[field] = {
            [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: "" }],
          };
        }
      }
    }
  }
  private processNumberFilter(
    field: string,
    value: any,
    whereClause: Record<string | symbol, any>
  ): void {
    if (typeof value === "number") {
      // Simple number value - treat as equals
      whereClause[field] = value;
    } else if (typeof value === "object") {
      if (value.equals !== undefined) {
        whereClause[field] = value.equals;
      } else if (value.not_equals !== undefined) {
        whereClause[field] = { [Op.ne]: value.not_equals };
      } else if (value.greater_than !== undefined) {
        whereClause[field] = {
          ...(whereClause[field] || {}),
          [Op.gt]: value.greater_than,
        };
      }
      if (value.less_than !== undefined) {
        whereClause[field] = {
          ...(whereClause[field] || {}),
          [Op.lt]: value.less_than,
        };
      }
      if (Array.isArray(value.in) && value.in.length > 0) {
        whereClause[field] = { [Op.in]: value.in };
      }
      // Support for between operator (e.g., { between: [min, max] })
      if (
        "between" in value &&
        Array.isArray(value.between) &&
        value.between.length === 2
      ) {
        whereClause[field] = {
          ...(whereClause[field] || {}),
          [Op.gte]: value.between[0],
          [Op.lte]: value.between[1],
        };
      }
    }
    if (value.is_empty !== undefined) {
      if (value.is_empty) {
        whereClause[field] = null;
      } else {
        whereClause[field] = { [Op.ne]: null };
      }
    }
  }

  private processDateFilter(
    field: string,
    value: any,
    whereClause: Record<string, any>
  ): void {
    if (typeof value === "string") {
      const date = dayjs(value, "YYYY-MM-DD").startOf("day").toDate();
      const nextDay = dayjs(date).add(1, "day").toDate();

      whereClause[field] = {
        [Op.gte]: date,
        [Op.lt]: nextDay,
      };
    } else if (typeof value === "object") {
      if (value.equals !== undefined) {
        const date = dayjs(value.equals, "YYYY-MM-DD")
          .startOf("day")
          .format("YYYY-MM-DDTHH:mm:ss[Z]");
        const nextDay = dayjs(date).add(1, "day").toDate();

        whereClause[field] = {
          [Op.gte]: date,
          [Op.lt]: nextDay,
        };
      } else if (value.before !== undefined) {
        const beforeDate = dayjs(value.before, "YYYY-MM-DD")
          .startOf("day")
          .format("YYYY-MM-DDTHH:mm:ss[Z]");
        whereClause[field] = { [Op.lt]: beforeDate };
      } else if (value.after !== undefined) {
        const afterDate = dayjs(value.after, "YYYY-MM-DD")
          .endOf("day")
          .format("YYYY-MM-DDTHH:mm:ss[Z]");
        whereClause[field] = { [Op.gt]: afterDate };
      } else if (value.between[0] && value.between[1]) {
        const fromDate = dayjs(value.between[0], "YYYY-MM-DD")
          .startOf("day")
          .format("YYYY-MM-DDTHH:mm:ss[Z]");
        const toDate = dayjs(value.between[1], "YYYY-MM-DD")
          .endOf("day")
          .format("YYYY-MM-DDTHH:mm:ss[Z]");

        whereClause[field] = {
          [Op.gte]: fromDate,
          [Op.lte]: toDate,
        };
      } else if (value.is_empty !== undefined) {
        if (value.is_empty) {
          whereClause[field] = null;
        } else {
          whereClause[field] = { [Op.ne]: null };
        }
      }
    }
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

  async getCaseFilingType() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const caseFilingType = await this.mainDbSequelize.query(
      rawQueries.getCaseFilingType(),
      {
        type: "SELECT",
      }
    );

    return caseFilingType;
  }

  async getCaseStatus() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const caseStatus = await this.mainDbSequelize.query(
      rawQueries.getCaseStatus(),
      {
        type: "SELECT",
      }
    );

    return caseStatus;
  }

  async getChecklistStatus() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const caseStatus = await this.mainDbSequelize.query(
      rawQueries.getChecklistStatus(),
      {
        type: "SELECT",
      }
    );

    return caseStatus;
  }

  async getCasesHeadersSectionList(
    caseRid: string,
    schemaName: string,
    orgDb: Sequelize
  ) {
    const [result] = await orgDb.query<CaseHeadersColumns>(
      fetchCasesHeadersDatas(schemaName, caseRid),
      { type: QueryTypes.SELECT }
    );
    if (result) {
      return result;
    }
  }

  async fetchParentAccount(parentAccountId: string): Promise<string> {
      try {
        const sequelize = await initMainDbSequelize();
  
        const [account]: any[] = await sequelize.query(
          rawQueries.fetchAccountDetailsByRid(parentAccountId),
          {
            type: "SELECT",
          }
        );
  
        return account?.r_number;
      } catch (err) {
        errorLog("Error fetching parent account : " + (err as Error).message);
        throw new Error(
          "Error fetching parent account : " + (err as Error).message
        );
      }
    }

  async getSubscriptionDetailsByProjectId(parentaccountId:string,schemaName:string,accountId:string) {
    try {
     let schemaNameParent = `trd365_${schemaName.replace(/\D/g, "")}`;
     const query = rawQueries.fetchAccountInfos(schemaNameParent,accountId);
     const sequelize = await initOrgSequelize();
     const users: any = await sequelize.query(query, {
       replacements: { account_rid: accountId },
       type: "SELECT",
     });
     const parentquery = rawQueries.fetchAccountInfos(schemaNameParent, parentaccountId);
     const parentSubscriptioninfo: any = await sequelize.query(parentquery, {
       replacements: { accountId: parentaccountId },
       type: "SELECT",
     });
      if(parentSubscriptioninfo && parentSubscriptioninfo.length > 0)
      {
        const parentDetails = parentSubscriptioninfo[0];
        const isSubscriptionCreated = Boolean(
        parentDetails.subscription_created &&
        parentDetails.tenant_id &&
        parentDetails.client_id &&
        parentDetails.client_secret);
        return  isSubscriptionCreated;
      }else{
        return false;
      }
    } catch (err) {
      return false
    }
  }

  async fetchProjectsForCasesResult(
    data: any,
    orgDb: Sequelize,
    schemaName: string,
    pocRid: string,
    tPocRid: string,
    isSorting: boolean,
    assignedApi: boolean,
    accessibleIds: string[],
    isExport: boolean
  ) {
    const result = await orgDb.query(
      fetchProjectsForCases(
        schemaName,
        data.page,
        data.limit,
        data.sort,
        data.sort_by,
        data.filter,
        data.account_rid,
        data.fiscal_year,
        pocRid,
        tPocRid,
        isSorting,
        data.search,
        data.case_rid,
        assignedApi,
        accessibleIds,
        isExport
      )
    );
    return result[0];
  }

  async listReviewProjectsInfo(
    accountNumber: string,
    caseRid: string,
    filters: Record<string, any>,
    fiscalYear: number =0,
    apiType: string,
    page: number = 1,
    limit: number = 100,
    sortBy: string,
    sortOrder: string,
    search: string = "",
    projectIds?: string[]
 
) {
   const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(
        /\D/g,
        ""
      )}`;
    
    filters = filters || {};
    let offset = (page - 1) * limit;
    let pagination = `LIMIT ${limit} OFFSET ${offset}`;
      if (apiType === "download") {
        pagination = ``;
      }
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await this.caseModelService.getSequelize();
    }
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    let [pointOfContactRoleid]:any[] = await this.mainDbSequelize.query(
        rawQueries.fetchPOCRoleId(),
        { type: "SELECT" }
      );
    let filteredQueryArray: string[] = [];
    let andConditions = ``;
    let filterQueryValues;
    let whereKey: string = ``;
    let fiscalYearQuery: string = ``;
    let projectIdQuery: string = ``;
    let sortValue;
    let searchValue: string;
    let disablePagination: boolean = false;
    let createdByFilter;
    let totalResults: number = 0;
    let createdByConditions;
    let modifiedByFilter;
    let modifiedByConditions;
    let industryFilter;
    let industryConditions;
    let classificationFilter;
    let classificationConditions;
      const detectConditions = (filters: any) => {
      if (!filters) return null;
      for (let conditions of Object.values(ALPHANUMERIC_CONDITIONS)) {
        if (Object.keys(filters).includes(conditions)) return conditions;
      }
      return null;
    };

    if (filters?.created_user_name) {
      createdByFilter = filters.created_user_name;
      createdByConditions = detectConditions(createdByFilter);
    }
    if (filters?.updated_user_name) {
      modifiedByFilter = filters.updated_user_name;
      modifiedByConditions = detectConditions(modifiedByFilter);
    }
    if (filters?.industry_name) {
      industryFilter = filters.industry_name;
      industryConditions = detectConditions(industryFilter);
    }
    if (filters?.project_classification_name) {
      classificationFilter = filters.project_classification_name;
      classificationConditions = detectConditions(classificationFilter);
    }


      [
      "created_user_name",
      "updated_user_name",
    ].forEach((key) => {
      if (filters[key]) {
        disablePagination = true;
        delete filters[key];
      }
    });
    if (mainTableFilters[filters.sort] !== undefined) {
      disablePagination = true;
    }
      let filterDatas = filterForReviewProjects(
        filters,
        andConditions,
        filteredQueryArray,
        filterTypesForReviewProjects,
        filtersColumnsForReviewProjects
      );
      // Optimize filter query processing
      filterQueryValues = filterDatas?.filteredQueryArray?.length
        ? filterDatas.filteredQueryArray.join(" AND ")
        : "";
      if (fiscalYear == 0) fiscalYearQuery = ``;
      else fiscalYearQuery = ` c.fiscal_year = ${fiscalYear}`;
      if(projectIds && projectIds.length > 0){
          projectIdQuery += `c.rid IN (${projectIds.map(id => `'${id}'`).join(",")})`;
      }
      searchValue = search ? `%${search}%` : `%%`;
      whereKey = `1 = 1`;
      const conditions = [
        fiscalYearQuery,
        filterQueryValues,projectIdQuery
      ].filter(Boolean);

      const joinedConditions =
        conditions.length > 0 ? " AND " + conditions.join(" AND ") : "";

      // Optimized sorting logic using extracted utility function
      const sortColumn = getSortColumnForReviewProjects(sortBy);
      const sortDirection = sortOrder || "ASC";
      logMessage(
        `Sorting by column: ${sortColumn}, direction: ${sortDirection}`
      );
      sortValue = `ORDER BY ${sortColumn} ${sortDirection}`;
      let projectQuery = await listReviewProjectsInfo(
        searchValue,
        caseRid,
        whereKey,
        joinedConditions,
        sortValue,
        pagination,
        schemaName,
        pointOfContactRoleid.rid
      );
      
      const [projectInfo]: any[] = await this.orgDbSequelize.query(
        projectQuery,
        { type: "SELECT" }
      );
       let result = projectInfo.cases_summary;
       if(!Array.isArray(result)){
        return {
          data: [],
          count: 0,
        };  
       }
      
      let createdByIds: any[] = [
        ...new Set(result.map((projectInfo: any) => projectInfo?.created_by)),
      ];
      let modifiedByIds: any[] = [
        ...new Set(
          result.map((projectInfo: any) => projectInfo?.modified_by)
        ),
      ];
      let statusIds: any[] = [
        ...new Set(result.map((projectInfo: any) => projectInfo?.status_rid)),
      ];
      let industryIds: any[] = [
        ...new Set(result.map((projectInfo: any) => projectInfo?.industry_rid)),
      ];
      let classificationIds: any[] = [
        ...new Set(result.map((projectInfo: any) => projectInfo?.project_classification_rid)),
      ];
      let projectTypeIds: any[] = [
        ...new Set(result.map((projectInfo: any) => projectInfo?.project_type_rid)),
      ];
      let fetchCreatedByUsers = await this.mainDbSequelize.query(
        rawQueries.fetchUser(createdByIds)
      );
      let fetchModifiedByUsers = await this.mainDbSequelize.query(
        rawQueries.fetchUser(modifiedByIds)
      );
      let fetchStatusInfo = await this.mainDbSequelize.query(
        rawQueries.fetchStatus(statusIds)
      );
      let fetchIndustryInfo = await this.mainDbSequelize.query(
        rawQueries.fetchIndustry(industryIds)
      );
      let fetchClassificationInfo = await this.mainDbSequelize.query(
        rawQueries.fetchClassification(classificationIds)
      );
      let fetchProjectTypeInfo = await this.mainDbSequelize.query(
        rawQueries.fetchProjectType(projectTypeIds)
      );
      let createdMap: Map<string, string> = new Map(
        fetchCreatedByUsers[0].map((user: any) => [
          user.rid,
          `${user.first_name} ${user.last_name}`,
        ])
      );
      let modifiedMap: Map<string, string> = new Map(
        fetchModifiedByUsers[0].map((user: any) => [
          user.rid,
          `${user.first_name} ${user.last_name}`,
        ])
      );
      let statusMap: Map<string, string> = new Map(
        fetchStatusInfo[0].map((status: any) => [status.rid, status.name])
      );
      let industryMap: Map<string, string> = new Map(
        fetchIndustryInfo[0].map((industry: any) => [industry.rid, industry.name])
      );
      let classificationMap: Map<string, string> = new Map(
        fetchClassificationInfo[0].map((classification: any) => [classification.rid, classification.name])
      );
      let projectTypeMap: Map<string, string> = new Map(
        fetchProjectTypeInfo[0].map((projectType: any) => [projectType.rid, projectType.name])
      );
      
      let finalData =
              Array.isArray(result) && result.length > 0
                ? result.map((d: any) => {
                    return {
                      ...d,
                      project_type_rid: d.project_type_rid,
                      created_user_name: createdMap.get(d.created_by) || null,
                      modified_user_name: modifiedMap.get(d.modified_by) || null,
                      status_name: statusMap.get(d.status_rid) || null,
                      industry_name: industryMap.get(d.industry_rid) || null,
                      project_classification_name: classificationMap.get(d.project_classification_rid) || null,
                      project_type_name: projectTypeMap.get(d.project_type_rid) || null,
                    };
                  })
                : [];
          const applyFilters = (
        data: any[],
        conditions: any,
        value: any,
        field: any
      ) => {
        if (!conditions || !field) return data;
        const val = value[conditions];
        switch (conditions) {
          case ALPHANUMERIC_CONDITIONS.equals:
            return data.filter(
              (d: any) => d[field]?.toLowerCase() === val?.toLowerCase()
            );
          case ALPHANUMERIC_CONDITIONS.notEquals:
            return data.filter(
              (d: any) => d[field]?.toLowerCase() != val?.toLowerCase()
            );
          case ALPHANUMERIC_CONDITIONS.contains:
            return data.filter((d: any) =>
              d[field]?.toLowerCase().includes(val?.toLowerCase())
            );
          case ALPHANUMERIC_CONDITIONS.isEmpty:
            return data.filter((d: any) => d[field] == null);
          case ALPHANUMERIC_CONDITIONS.IN:
            return data.filter((d: any) =>
              val .includes(d[field])
            );
          default:
            return data;
        }
      };
      if (createdByConditions != null && createdByConditions != undefined)
        finalData = applyFilters(
          finalData,
          createdByConditions,
          createdByFilter,
          "created_user_name"
        );
      if (modifiedByConditions != null && modifiedByConditions != undefined)
        finalData = applyFilters(
          finalData,
          modifiedByConditions,
          modifiedByFilter,
          "modified_user_name"
        );
      if (industryConditions != null && industryConditions != undefined)
        finalData = applyFilters(
          finalData,
          industryConditions,
          industryFilter,
          "industry_name"
        );
      if (classificationConditions != null && classificationConditions != undefined)
        finalData = applyFilters(
          finalData,
          classificationConditions,
          classificationFilter,
          "project_classification_name"
        );
     if (
        mainTableFilters[sortBy] != undefined &&
        sortOrder.toLowerCase() == "asc"
      ) {
        finalData = finalData.sort((a: any, b: any) => {
          if (!a?.[sortBy]) return 1;
          if (!b?.[sortBy]) return -1;
          return a[sortBy].localeCompare(b[sortBy]);
        });
      } else if (
        mainTableFilters[sortBy] != undefined &&
        sortOrder.toLowerCase() == "desc"
      ) {
        finalData = finalData.sort((a: any, b: any) => {
          if (!b?.[sortBy]) return 1;
          if (!a?.[sortBy]) return -1;
          return b[sortBy].localeCompare(a[sortBy]);
        });
      }

      totalResults = disablePagination
        ? finalData.length
        : (result && result[0] && result[0].total_records ? result[0].total_records : finalData.length);
      let finalPaginatedData: any[] = [];
      if (apiType === "download") {
        finalPaginatedData = finalData;
      } else {
        finalPaginatedData = disablePagination
          ? finalData.slice(
              (page - 1) * limit,
              page * limit
            )
          : finalData;
      }        
    
      return {
        data: finalPaginatedData,
        count: totalResults,
      };

}

  async assignProjectToCase(
    data: assignProjectType,
    accountNumber: string,
    schemaName: string
  ) {
    const { CaseProject, Case, CaseSummary } =
      await this.caseModelService.getModels(accountNumber);
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await this.caseModelService.getSequelize();
    }
    // await this.createCaseProjectTables(accountNumber);
    let iterationCount: number = 0;
    let totalCount: number = 0;
    totalCount = data.projects.length;
    const collectProjectFiscalIds = [...new Set(data.projects.map((d : any) => d.project_fiscal_rid))];

    const findProjects = await this.orgDbSequelize.query(rawQueries.getProjectByIds(collectProjectFiscalIds, schemaName))
    const mapProjectById : Map<string, any> = new Map(findProjects[0].map((d : any) => [d.rid, d]));
    for (let p of data.projects) {
      const projectData = mapProjectById.get(p.project_fiscal_rid);

      await CaseProject.create({
        case_rid: data.case_rid,
        account_rid: data.account_rid,
        created_by: data.created_by,
        created_datetime: new Date(),
        project_rid: p.project_rid,
        project_group: p.project_group,
        project_fiscal_rid: p.project_fiscal_rid,
        project_code : projectData.project_code,
        fiscal_year : projectData.fiscal_year,
        max_ai_interaction : projectData.max_ai_interaction
      });
      iterationCount += 1;
    }
    if (totalCount === iterationCount) {
      const getTotalProjects : any = await this.orgDbSequelize.query(
        rawQueries.getTotalProjectsCountInCase(schemaName, data.fiscal_year, data.account_rid, data.case_rid)
      )
      await this.orgDbSequelize.query(
        rawQueries.updateCostCountInCase(
          schemaName,
          data.case_rid,
          getTotalProjects[0][0].total_projects,
          getTotalProjects[0][0].total_projects_cost,
          getTotalProjects[0][0].total_projects_qre_cost
        )
      );
      await this.mainDbSequelize.query(
        rawQueries.updateCostCountInCaseSummary(
          data.case_rid,
          getTotalProjects[0][0].total_projects,
          getTotalProjects[0][0].total_projects_cost,
          getTotalProjects[0][0].total_projects_qre_cost
        )
      );
      if (totalCount === 1) {
        return {
          statusCode: HttpStatus.SUCCESS,
          statusMessage: STATUS_MESSAGE.singleProjectAssignedSuccess,
        };
      } else {
        return {
          statusCode: HttpStatus.SUCCESS,
          statusMessage: STATUS_MESSAGE.multipleProjectAssignedSuccess,
        };
      }
    } else {
      return {
        statusCode: HttpStatus.FAILED,
        statusMessage: STATUS_MESSAGE.multipleProjectAssignedSuccess,
      };
    }
  }

  async createCaseProjectTables(accountNumber: string) {
    try {
      const orgDbSequlize = await initOrgSequelize();
      const mainDbSequlize = await initMainDbSequelize();
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(
        /\D/g,
        ""
      )}`;

      const CaseProjectModel = await CaseProject.initialize(
        orgDbSequlize,
        schemaName
      );

      await CaseProjectModel.sync({ force: false });
      await setupCaseSequence(orgDbSequlize, schemaName);
    } catch (err) {
      errorLog("Error creating case tables", (err as Error).message);
      return this.throwServiceError(err as Error);
    }
  }
  async isCaseExistsForAccount(
    accountRid: string,
    caseRid: string,
    accountNumber: string
  ) {
    const { Case } = await this.caseModelService.getModels(accountNumber);
    const result = await Case.findOne({
      where: {
        account_rid: accountRid,
        rid: caseRid,
      },
      raw: true,
    });
    if (result) return result;
    else null;
  }
  async isProjectAlreadyAssigned(
    data: assignProjectType,
    accountNumber: string
  ) {
    const { CaseProject } = await this.caseModelService.getModels(
      accountNumber
    );
    for (let p of data.projects) {
      const checkProjectAlreadyMapped = await CaseProject.findOne({
        where: {
          account_rid: data.account_rid,
          case_rid: data.case_rid,
          project_fiscal_rid: p.project_fiscal_rid,
          project_rid: p.project_rid,
          project_group: p.project_group,
        },
      });
      if (checkProjectAlreadyMapped) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          statusMessage: STATUS_MESSAGE.projectAlreadyMapped,
        };
      }
    }
  }

  async deletedAssignedProject(
    data: assignProjectType,
    accountNumber: string,
    schemaName: string
  ) {
    const { CaseProject } = await this.caseModelService.getModels(
      accountNumber
    );
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await this.caseModelService.getSequelize();
    }
    //  await this.createCaseProjectTables(accountNumber);
    let iterationCount: number = 0;
    let totalCount: number = 0;
    totalCount = data.projects.length;

    for (let p of data.projects) {
      await CaseProject.destroy({
        where: {
          case_rid: data.case_rid,
          account_rid: data.account_rid,
          project_fiscal_rid: p.project_fiscal_rid,
        },
      });
      iterationCount += 1;
    }
    if (totalCount === iterationCount) {
      const getTotalProjects : any = await this.orgDbSequelize.query(
        rawQueries.getTotalProjectsCountInCase(schemaName, data.fiscal_year, data.account_rid, data.case_rid)
      );
      await this.orgDbSequelize.query(
        rawQueries.updateCostCountInCase(
          schemaName,
          data.case_rid,
          getTotalProjects[0][0].total_projects,
          getTotalProjects[0][0].total_projects_cost,
          getTotalProjects[0][0].total_projects_qre_cost
        )
      );
      await this.mainDbSequelize.query(
        rawQueries.updateCostCountInCaseSummary(
          data.case_rid,
          getTotalProjects[0][0].total_projects,
          getTotalProjects[0][0].total_projects_cost,
          getTotalProjects[0][0].total_projects_qre_cost
        )
      );
      if (totalCount === 1) {
        return {
          statusCode: HttpStatus.SUCCESS,
          statusMessage: STATUS_MESSAGE.singleProjectDeletedSuccess,
        };
      } else {
        return {
          statusCode: HttpStatus.SUCCESS,
          statusMessage: STATUS_MESSAGE.multipleProjectDeletedSuccess,
        };
      }
    } else {
      return {
        statusCode: HttpStatus.FAILED,
        statusMessage: STATUS_MESSAGE.projectAssignFailed,
      };
    }
  }

  async isProjectAssignedInCase(
    data: assignProjectType,
    accountNumber: string
  ) {
    const { CaseProject } = await this.caseModelService.getModels(
      accountNumber
    );
    for (let p of data.projects) {
      const checkProjectAlreadyMapped = await CaseProject.findOne({
        where: {
          account_rid: data.account_rid,
          case_rid: data.case_rid,
          project_fiscal_rid: p.project_fiscal_rid,
          project_rid: p.project_rid,
          project_group: p.project_group,
        },
      });
      if (!checkProjectAlreadyMapped) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          statusMessage: STATUS_MESSAGE.projectNotAssigned,
        };
      }
    }
  }

  async getUserProfileType(
    userRid: string
  ): Promise<{ profileName: string; email: string } | null> {
    const mainDbSequelize = await initMainDbSequelize();

    try {
      const results = await mainDbSequelize.query<{
        profile_name: string;
        email: string;
      }>(rawQueries.getUserProfileAndEmailByUserRidQuery(), {
        replacements: { userRid },
        type: QueryTypes.SELECT,
      });

      if (!results || results.length === 0) {
        return null;
      }

      // Return renamed keys to match camelCase (optional)
      return {
        profileName: results[0]?.profile_name ?? "",
        email: results[0]?.email ?? "",
      };
    } catch (error) {
      console.error("Error fetching user profile info:", error);
      throw new Error("Failed to get user profile information");
    }
  }

  async getCurrencyDetails(currencyRid: string) {
    const mainDbSequelize = await initMainDbSequelize();
    const result = await mainDbSequelize.query(
      rawQueries.getCurrencyDetails(currencyRid)
    );
    return result[0][0];
  }

  async getAccountDetails(accountRid: string) {
    const mainDbSequelize = await initMainDbSequelize();
    const result = await mainDbSequelize.query(
      rawQueries.fetchAccountDetails(accountRid)
    );
    return result[0][0];
  }

  async getUserGroupType(userRid: string): Promise<string | null> {
    const mainDbSequelize = await initMainDbSequelize();

    try {
      const results = await mainDbSequelize.query<{ group_type: string }>(
        rawQueries.fetchUserGroupType,
        {
          replacements: { userRid },
          type: QueryTypes.SELECT,
        }
      );

      if (!results || results.length === 0) {
        return null;
      }

      return results[0]?.group_type || null;
    } catch (error) {
      // Log the error for debugging
      logMessage(`Error fetching user group type: ${error}`);
      throw new Error("Failed to get user group type");
    }
  }
  async getAccessibleAccountInfo(userRid: string): Promise<
    Array<{
      id: string;
      isChild: boolean;
      parentId: string | null;
    }>
  > {
    const mainDbSequelize = await initMainDbSequelize();

    try {
      // 1. Direct access with account info
      const directAccess = await mainDbSequelize.query<{
        entity_rid: string;
        parent_account_rid: string | null;
        is_child: boolean;
      }>(rawQueries.GET_ACCOUNT_DIRECT_ACCESS_USER_IDS, {
        replacements: { userRid },
        type: QueryTypes.SELECT,
      });

      // 2. Direct EXCLUDE access — normalize and store in a Set
      const directExclude = await mainDbSequelize.query<{ entity_rid: string }>(
        rawQueries.GET_ACCOUNT_DIRECT_EXCLUDE_ACCESS_USER_IDS,
        {
          replacements: { userRid },
          type: QueryTypes.SELECT,
        }
      );

      const excludedEntityRids = new Set(
        directExclude.map((e) => e.entity_rid?.trim().toLowerCase())
      );

      // 3. Group INCLUDE access
      const groupAccess = await mainDbSequelize.query<{
        entity_rid: string;
        parent_account_rid: string | null;
        is_child: boolean;
      }>(rawQueries.GET_GROUP_ACCESS, {
        replacements: { userRid },
        type: QueryTypes.SELECT,
      });

      // 3. Combine and deduplicate
      const allAccess = [...directAccess, ...groupAccess];
      const uniqueAccess = new Map<
        string,
        {
          id: string;
          isChild: boolean;
          parentId: string | null;
        }
      >();

      allAccess.forEach((access) => {
        const normalizedEntityId = access.entity_rid?.trim().toLowerCase();
        if (
          !excludedEntityRids.has(normalizedEntityId) &&
          !uniqueAccess.has(normalizedEntityId)
        ) {
          uniqueAccess.set(normalizedEntityId, {
            id: access.entity_rid,
            isChild: access.is_child,
            parentId: access.parent_account_rid,
          });
        }
      });

      return Array.from(uniqueAccess.values());
    } catch (err) {
      errorLog("Error in getAccessibleAccountInfo:", (err as Error).message);
      return [];
    }
  }

  async fetchEmailRecipientsForReviewProjects(caseRid: string, accountNumber: string) {
    if(!this.orgDbSequelize){
      this.orgDbSequelize = await this.caseModelService.getSequelize();
    }
    if(!this.mainDbSequelize){
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(
      /\D/g,
      ""
    )}`;
    const roleName = 'Client Finance & Tax Team';
    const [roleRid]: any[] = await this.mainDbSequelize.query(
      rawQueries.getCaseTeamRoleByName(roleName),
      { type: "SELECT" }
    );
    const [statusActiveRid]: any[] = await this.mainDbSequelize.query(
      rawQueries.getActiveStatusId(),
      { type: "SELECT" }
    );
    const emailRecipientsQuery = rawQueries.fetchEmailRecipientsForReviewProjects(schemaName, caseRid, roleRid.rid, statusActiveRid.rid);
    const [emailRecipientRid]: any[] = await this.orgDbSequelize.query(
      emailRecipientsQuery,
      { type: "SELECT" }
    );
    if(!emailRecipientRid || emailRecipientRid.length === 0){
      return [];
    }
    else
    {
    if (!emailRecipientRid.user_rid) {
      return [];
    }
    // Ensure user_rid is always a non-empty array of strings
    let userRids: string[] = [];
    if (Array.isArray(emailRecipientRid.user_rid)) {
      userRids = emailRecipientRid.user_rid.filter((rid: any) => typeof rid === "string" && rid);
    } else if (typeof emailRecipientRid.user_rid === "string" && emailRecipientRid.user_rid) {
      userRids = [emailRecipientRid.user_rid];
    }
    if (userRids.length === 0) {
      return [];
    }
    const emailRecipientsQuery = rawQueries.fetchEmailRecipientsByRids(userRids);
    if (!emailRecipientsQuery || typeof emailRecipientsQuery !== "string") {
      return [];
    }
    const emailRecipients: any = await this.mainDbSequelize.query(
      emailRecipientsQuery,
      { type: "SELECT" }
    );
    let result = Array.isArray(emailRecipients)
      ? emailRecipients.map((d: any) => d.email)
      : [];
     const [caseInfo]: any[] = await this.orgDbSequelize.query(
                rawQueries.fetchCaseInfo(schemaName,caseRid),
                { type: "SELECT" }
              );
    return {
      emails: result,
      caseInfo: caseInfo || {}
    };

    }
    
  }

  async getTemplateDetailsByCategory(categoryName: string) {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();  
    }
    const [templateDetails]:any[] = await this.mainDbSequelize.query(
      rawQueries.fetchEmailTemplateByCategory(categoryName),
      {
        type: "SELECT",
      }
    );


    return templateDetails;  }
  

  async listAllCaseSummary(
    page: number,
    limit: number,
    filters: filterType,
    globalFilters: any = {},
    fiscal_year: number,
    sortBy: string,
    sortOrder: string,
    accessibleIds: string[] = [],
    search: string,
    apiType?: string,
    case_rid?: string
  ) {
    try {
      // Ensure filters is not null or undefined
      filters = filters || {};
      globalFilters = globalFilters || {};

      let offset = (page - 1) * limit;
      let pagination = `LIMIT ${limit} OFFSET ${offset}`;
      if (apiType === "download") {
        pagination = ``;
      }
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.caseModelService.getMainSequelize();
      }
      let filteredQueryArray: string[] = [];
      let andConditions = ``;
      let filterQueryValues;
      let whereKey: string = ``;
      let accountIdsArray: string[] = [];
      let globalFiltersQueryConditions: string = ``;
      let fiscalYearQuery: string = ``;
      let caseRidQuery: string = ``;
      let sortValue;
      let searchValue: string;
      let filterDatas = filterForCases(
        filters,
        andConditions,
        filteredQueryArray,
        filterTypesForCaseSummary,
        filtersColumnsForCaseSummary
      );
      // Optimize filter query processing
      filterQueryValues = filterDatas?.filteredQueryArray?.length
        ? filterDatas.filteredQueryArray.join(" AND ")
        : "";

      // Optimize global filters processing
      if (Object.keys(globalFilters).length > 0) {
        accountIdsArray = globalFiltersforCaseSummary(globalFilters);
      }
      if (accessibleIds.length > 0) {
        accountIdsArray.push(...accessibleIds);
      }

      // Optimize conditions building
      globalFiltersQueryConditions =
        accountIdsArray.length > 0
          ? ` cs.account_rid IN (${accountIdsArray
              .map((d) => `'${d}'`)
              .join(",")})`
          : "";

      if (fiscal_year == 0) fiscalYearQuery = ``;
      else fiscalYearQuery = ` cs.fiscal_year = ${fiscal_year}`;
      if (apiType === "graphql") {
        caseRidQuery = ` cs.case_rid = '${case_rid}'`;
      }
      searchValue = search ? `%${search}%` : `%%`;
      whereKey = `1 = 1`;

      // Optimized conditions joining
      const conditions = [
        globalFiltersQueryConditions,
        fiscalYearQuery,
        filterQueryValues,
        caseRidQuery,
      ].filter(Boolean);

      const joinedConditions =
        conditions.length > 0 ? " AND " + conditions.join(" AND ") : "";

      // Optimized sorting logic using extracted utility function
      const sortColumn = getSortColumn(sortBy);
      const sortDirection = sortOrder || "ASC";
      logMessage(
        `Sorting by column: ${sortColumn}, direction: ${sortDirection}`
      );
      sortValue = `ORDER BY ${sortColumn} ${sortDirection}`;
      let caseSummaryQuery = await listAllCasesSummaryQuery(
        searchValue,
        whereKey,
        joinedConditions,
        sortValue,
        pagination,
        accessibleIds
      );
      const [result]: any[] = await this.mainDbSequelize.query(
        caseSummaryQuery,
        { type: "SELECT" }
      );
      return result;
    } catch (err) {
      logMessage(`Error in fetch cases summary: ${err}`);
      errorLog("Error in fetch cases summary:", (err as Error).message);
      return [];
    }
  }

  /**
   * Adds a case timeline entry for team management operations
   */
  async addCaseTimeline(
    accountNumber: string,
    caseRid: string,
    accountRid: string,
    description: string,
    userId: string,
    eventStatus: string = "success",
    eventName: string = "",
    eventType: string = "ui handler"
  ) {
    try {
      const { CaseTimeline } = await this.caseModelService.getModels(
        accountNumber
      );

      await CaseTimeline.create({
        account_rid: accountRid,
        event_name: eventName,
        event_status: eventStatus,
        event_type: eventType,
        entity_rid: caseRid,
        description: description,
        created_by: userId,
        event_datetime: new Date(),
        created_datetime: new Date(),
      });
    } catch (err) {
      logMessage(`Error creating case team timeline: ${err}`);
      // Don't throw error for timeline issues to avoid breaking main functionality
    }
  }

  /**
   * Adds a case timeline entry for case management operations (create/update)
   */
  async addCaseManagementTimeline(
    accountNumber: string,
    caseRid: string,
    accountRid: string,
    caseData: any,
    userId: string,
    operation: "created" | "updated",
    eventStatus: string = "success",
    existingCaseData?: any
  ) {
    try {
      const eventName =
        operation === "created" ? "Case Created" : "Case Updated";
      let description = "";

      if (operation === "created") {
        description = `Case created with title: ${
          caseData.case_title || caseData.case_name || "N/A"
        }`;
      } else {
        // For updates, show specific fields that changed
        const changes = this.generateCaseChangeDescription(
          caseData,
          existingCaseData
        );
        description =
          changes.length > 0
            ? `Case updated: ${changes.join(", ")}`
            : "Case updated";
      }

      await this.addCaseTimeline(
        accountNumber,
        caseRid,
        accountRid,
        description,
        userId,
        eventStatus,
        eventName,
        "ui handler"
      );
    } catch (err) {
      logMessage(`Error creating case management timeline: ${err}`);
      // Don't throw error for timeline issues to avoid breaking main functionality
    }
  }

  /**
   * Generates description of changed fields for case updates
   */
  private generateCaseChangeDescription(
    newData: any,
    existingData: any
  ): string[] {
    if (!existingData) return [];

    const changes: string[] = [];
    const fieldMappings: { [key: string]: string } = {
      case_owner_rid: "case owner",
      case_name: "case name",
      description: "description",
      fiscal_year: "fiscal year",
      filing_type_rid: "filing type",
      case_startdate: "case start date",
      planned_submission_date: "planned submission date",
      statutory_submission_date: "statutory submission date",
    };

    // Define which fields are dates
    const dateFields = [
      "case_startdate",
      "planned_submission_date",
      "statutory_submission_date",
    ];

    for (const [field, displayName] of Object.entries(fieldMappings)) {
      if (
        newData[field] !== undefined &&
        newData[field] !== existingData[field]
      ) {
        let oldValue = existingData[field] || "N/A";
        let newValue = newData[field] || "N/A";

        // Format dates using the same function as case team timeline
        if (dateFields.includes(field)) {
          oldValue =
            oldValue !== "N/A" ? this.formatDateForDisplay(oldValue) : "N/A";
          newValue =
            newValue !== "N/A" ? this.formatDateForDisplay(newValue) : "N/A";
        }

        changes.push(`${displayName} changed to "${newValue}"`);
      }
    }

    return changes;
  }

  /**
   * Generates timeline entry for case team management operations
   */
  private async addCaseTeamTimelineEntry(
    accountNumber: string,
    caseRid: string,
    accountRid: string,
    results: any[],
    userId: string,
    eventStatus: string,
    eventName: string = "",
    eventType: string = "",
    errorMessage?: string
  ) {
    try {
      let description = "";

      if (errorMessage) {
        description = `${errorMessage}`;
      } else {
        const summary = await this.generateTimelineDescription(results);
        description = `${summary}`;
      }

      await this.addCaseTimeline(
        accountNumber,
        caseRid,
        accountRid,
        description,
        userId,
        eventStatus,
        eventName,
        eventType
      );
    } catch (err) {
      logMessage(`Error adding case team timeline entry: ${err}`);
    }
  }

  /**
   * Fetches user names from the main database for given user RIDs
   */
  private async fetchUserNames(
    userRids: string[]
  ): Promise<Map<string, string>> {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.caseModelService.getMainSequelize();
      }

      if (userRids.length === 0) {
        return new Map();
      }

      const users = await this.mainDbSequelize.query(
        rawQueries.fetchUser(userRids)
      );

      const userMap = new Map<string, string>();
      if (
        users &&
        Array.isArray(users) &&
        users[0] &&
        Array.isArray(users[0])
      ) {
        (users[0] as any[]).forEach((user: any) => {
          const fullName = `${user.first_name || ""} ${
            user.last_name || ""
          }`.trim();
          userMap.set(user.rid, fullName || user.email || user.rid);
        });
      }

      return userMap;
    } catch (error) {
      logMessage(`Error fetching user names: ${error}`);
      return new Map();
    }
  }

  /**
   * Fetches role names from the main database for given role RIDs
   */
  private async fetchRoleNames(
    roleRids: string[]
  ): Promise<Map<string, string>> {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.caseModelService.getMainSequelize();
      }

      if (roleRids.length === 0) {
        return new Map();
      }

      const roles = await this.mainDbSequelize.query(
        rawQueries.getCaseTeamRoles()
      );

      const roleMap = new Map<string, string>();
      if (
        roles &&
        Array.isArray(roles) &&
        roles[0] &&
        Array.isArray(roles[0])
      ) {
        (roles[0] as any[]).forEach((role: any) => {
          if (roleRids.includes(role.rid)) {
            roleMap.set(role.rid, role.role_name || role.name || role.rid);
          }
        });
      }

      return roleMap;
    } catch (error) {
      logMessage(`Error fetching role names: ${error}`);
      return new Map();
    }
  }

  /**
   * Generates a descriptive summary of team management operations for timeline
   */
  private async generateTimelineDescription(results: any[]): Promise<string> {
    const successful = results.filter((r) => r.status === "success");
    const failed = results.filter((r) => r.status === "failed");
    const skipped = results.filter((r) => r.status === "skipped");

    // Collect all unique user RIDs and role RIDs
    const allUserRids = [
      ...new Set(
        [
          ...successful.map((r) => r.user_rid),
          ...failed.map((r) => r.user_rid),
          ...skipped.map((r) => r.user_rid),
        ].filter(Boolean)
      ),
    ];

    const allRoleRids = [
      ...new Set(
        [
          ...successful.map((r) => r.role_rid),
          ...failed.map((r) => r.role_rid),
          ...skipped.map((r) => r.role_rid),
        ].filter(Boolean)
      ),
    ];

    // Fetch user names and role names
    const [userNameMap, roleNameMap] = await Promise.all([
      this.fetchUserNames(allUserRids),
      this.fetchRoleNames(allRoleRids),
    ]);

    const summaryParts: string[] = [];

    // Group successful operations by action type
    const successfulByAction = {
      added: successful.filter((r) => r.action === "inserted"),
      updated: successful.filter((r) => r.action === "updated"),
      deleted: successful.filter((r) => r.action === "deleted"),
    };

    // Helper function to get user names with roles
    const getUserDisplayNamesWithRoles = (operations: any[]): string => {
      return operations
        .map((r) => {
          const userName = userNameMap.get(r.user_rid) || r.user_rid;
          const roleName = roleNameMap.get(r.role_rid) || r.role_rid;
          return `${userName} as ${roleName}`;
        })
        .join(", ");
    };

    // Add success descriptions with member names and roles
    if (successfulByAction.added.length > 0) {
      const memberDetails = getUserDisplayNamesWithRoles(
        successfulByAction.added
      );
      summaryParts.push(`Added team members: ${memberDetails}`);
    }
    if (successfulByAction.updated.length > 0) {
      const memberDetails = getUserDisplayNamesWithRoles(
        successfulByAction.updated
      );
      summaryParts.push(`Updated team members: ${memberDetails}`);
    }
    if (successfulByAction.deleted.length > 0) {
      const memberDetails = getUserDisplayNamesWithRoles(
        successfulByAction.deleted
      );
      summaryParts.push(`Deleted team members: ${memberDetails}`);
    }

    // Add failure details with member names and roles if any
    if (failed.length > 0) {
      const failedMembers = getUserDisplayNamesWithRoles(failed);
      summaryParts.push(`Failed operations for: ${failedMembers}`);
    }

    // Add skip details with member names and roles if any
    if (skipped.length > 0) {
      const skippedMembers = getUserDisplayNamesWithRoles(skipped);
      summaryParts.push(`Skipped operations for: ${skippedMembers}`);
    }

    // Return formatted description
    if (summaryParts.length === 0) {
      return "No operations performed";
    }

    return summaryParts.join("; ") + ".";
  }

  async createCaseTeam(
    accountNumber: string,
    caseTeamRequest: ICreateCaseTeam,
    userId: string
  ) {
    try {
      const { CaseTeam } = await this.caseModelService.getModels(accountNumber);
      const results: any[] = [];

      // Check if case team already exists
      const existingTeamMembers = await CaseTeam.findAll({
        where: {
          case_rid: caseTeamRequest.case_rid,
          account_rid: caseTeamRequest.account_rid,
        },
        raw: true,
      });

      const hasExistingTeam = existingTeamMembers.length > 0;

      // Group operations by type for ordered processing
      const operationGroups = this.groupTeamMembersByActionType(
        caseTeamRequest.team_members
      );

      // Process operations in sequence: delete -> edit -> add
      await this.processDeleteOperations(
        CaseTeam,
        operationGroups.deleteOperations,
        results
      );
      await this.processEditOperations(
        CaseTeam,
        operationGroups.editOperations,
        caseTeamRequest,
        userId,
        results
      );
      await this.processAddOperations(
        CaseTeam,
        operationGroups.addOperations,
        caseTeamRequest,
        userId,
        results
      );

      // Generate response summary
      const response = this.generateCaseTeamResponse(results);

      // Determine event name based on existing team and operations
      let eventName = "Case Team Management";
      if (!hasExistingTeam && operationGroups.addOperations.length > 0) {
        eventName = "Case Team Member Added";
      } else if (
        hasExistingTeam &&
        (operationGroups.editOperations.length > 0 ||
          operationGroups.deleteOperations.length > 0 ||
          operationGroups.addOperations.length > 0)
      ) {
        eventName = "Case Team Member Updated";
      }

      // Add timeline entry for the team management request
      await this.addCaseTeamTimelineEntry(
        accountNumber,
        caseTeamRequest.case_rid,
        caseTeamRequest.account_rid,
        results,
        userId,
        response.success ? "success" : "partial_success",
        eventName,
        "ui_handler"
      );

      return response;
    } catch (error) {
      logMessage(`Error managing case team: ${error}`);

      // Add timeline entry for failed operation
      try {
        await this.addCaseTeamTimelineEntry(
          accountNumber,
          caseTeamRequest.case_rid,
          caseTeamRequest.account_rid,
          [],
          userId,
          "failed",
          "Case Team Management Failed",
          "team_management",
          `Error: ${(error as Error).message}`
        );
      } catch (timelineError) {
        logMessage(
          `Error adding timeline for failed operation: ${timelineError}`
        );
      }

      throw new Error("Error managing case team: " + error);
    }
  }

  async assignCaseTeamToTasks(
    accountNumber: string,
    caseReq: any,
    userId: string
  ) {
    try {
      const { CaseTask, CaseTeam } =
        await this.caseModelService.getModels(accountNumber); 
      const teamMembers = await CaseTeam.findAll({
        attributes: ['user_rid', 'role_rid'],
        where: {
          case_rid: caseReq.case_rid,
          account_rid: caseReq.account_rid,
          is_primary: true,
        },
        raw: true,
      });

      // Fetch user names from mainDbSequelize using rawQueries
      const userRids = teamMembers.map((tm: any) => tm.user_rid);
      let userNamesMap: Map<string, string> = new Map();
      if (userRids.length > 0 && this.mainDbSequelize) {
        const users = await this.mainDbSequelize.query(
          rawQueries.fetchUser(userRids)
        );
        if (users && Array.isArray(users) && users[0] && Array.isArray(users[0])) {
          users[0].forEach((user: any) => {
            userNamesMap.set(user.rid, `${user.first_name} ${user.last_name}`);
          });
        }
      }

      // Enrich teamMembers with user_name
      const enrichedTeamMembers = teamMembers.map((tm: any) => ({
        ...tm,
        user_name: userNamesMap.get(tm.user_rid) || null
      }));
      for (const member of teamMembers) {
        await CaseTask.update(
          {
            assigned_to: enrichedTeamMembers.find(etm => etm.user_rid === member.user_rid)?.user_rid || null,
          },
          {
            where: {
              case_rid: caseReq.case_rid,
              account_rid: caseReq.account_rid,
              case_team_member_role_rid: member.role_rid,
            },
          }
        );
      }
      
    } catch (error) {
      logMessage(`Error assigning case team to tasks: ${error}`);
      throw new Error("Error assigning case team to tasks: " + error);
    }
  }

  /**
   * Formats dates for display in error messages
   */
  private formatDateForDisplay(date: Date | string | null): string {
    if (!date) return "";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toISOString().split("T")[0] || "invalid-date";
  }

  /**
   * Groups team members by their action type for ordered processing
   */
  private groupTeamMembersByActionType(teamMembers: TeamMember[]) {
    return {
      deleteOperations: teamMembers.filter((tm) => tm.action_type === "delete"),
      editOperations: teamMembers.filter((tm) => tm.action_type === "edit"),
      addOperations: teamMembers.filter((tm) => tm.action_type === "add"),
      unknownOperations: teamMembers.filter(
        (tm) => !["delete", "edit", "add"].includes(tm.action_type)
      ),
    };
  }

  /**
   * Validates that a team member's date range doesn't overlap with existing assignments
   */
  private async validateNoOverlappingDates(
    CaseTeam: any,
    teamMember: TeamMember,
    caseTeamRequest: ICreateCaseTeam
  ): Promise<string | null> {
    try {
      const whereCondition: any = {
        account_rid: caseTeamRequest.account_rid,
        case_rid: caseTeamRequest.case_rid,
        user_rid: teamMember.user_rid,
        role_rid: teamMember.role_rid,
      };

      // Exclude current record for edit operations
      if (teamMember.case_team_rid && teamMember.action_type === "edit") {
        whereCondition.rid = { [Op.ne]: teamMember.case_team_rid };
      }

      const existingRecords = await CaseTeam.findAll({
        where: whereCondition,
        raw: true,
      });

      // Check for overlapping date ranges
      const hasOverlap = existingRecords.some((existing: any) =>
        this.checkDateRangeOverlap(existing, teamMember)
      );

      if (hasOverlap) {
        const formattedStartDate = this.formatDateForDisplay(
          teamMember.effective_from
        );
        const formattedEndDate = this.formatDateForDisplay(
          teamMember.effective_to
        );

        return (
          `Date range overlap detected for user ${teamMember.user_rid} with role ${teamMember.role_rid}. ` +
          `Effective dates from ${formattedStartDate} to ${formattedEndDate} ` +
          `overlap with existing assignment.`
        );
      }

      return null;
    } catch (error) {
      return `Validation error for user ${teamMember.user_rid}: ${
        (error as Error).message
      }`;
    }
  }

  /**
   * Checks if two date ranges overlap
   */
  private checkDateRangeOverlap(
    existing: any,
    teamMember: TeamMember
  ): boolean {
    const existingStart = new Date(existing.effective_startdate);
    const existingEnd = existing.effective_enddate
      ? new Date(existing.effective_enddate)
      : null;
    const newStart = new Date(teamMember.effective_from);
    const newEnd = teamMember.effective_to
      ? new Date(teamMember.effective_to)
      : null;

    // Check for overlap conditions
    const startOverlaps =
      newStart >= existingStart &&
      (existingEnd === null || newStart <= existingEnd);

    const endOverlaps =
      newEnd &&
      newEnd >= existingStart &&
      (existingEnd === null || newEnd <= existingEnd);

    const encompassesExisting =
      newStart <= existingStart &&
      (newEnd === null || (existingEnd !== null && newEnd >= existingEnd));

    const encompassedByExisting =
      existingStart <= newStart &&
      (existingEnd === null || (newEnd !== null && existingEnd >= newEnd));

    return (
      startOverlaps ||
      endOverlaps ||
      encompassesExisting ||
      encompassedByExisting
    );
  }

  /**
   * Processes delete operations for team members
   */
  private async processDeleteOperations(
    CaseTeam: any,
    deleteOperations: TeamMember[],
    results: any[]
  ): Promise<void> {
    logMessage(`Processing ${deleteOperations.length} delete operations...`);

    for (const teamMember of deleteOperations) {
      try {
        const deletedRowsCount = await CaseTeam.destroy({
          where: {
            rid: teamMember.case_team_rid,
          },
        });

        results.push({
          action: "deleted",
          affectedRows: deletedRowsCount,
          user_rid: teamMember.user_rid,
          role_rid: teamMember.role_rid,
          status: "success",
        });
      } catch (memberError) {
        logMessage(
          `Error deleting team member ${teamMember.user_rid}: ${memberError}`
        );
        results.push({
          action: "delete",
          user_rid: teamMember.user_rid,
          role_rid: teamMember.role_rid,
          status: "failed",
          error: (memberError as Error).message,
        });
      }
    }
  }

  /**
   * Processes edit operations for team members
   */
  private async processEditOperations(
    CaseTeam: any,
    editOperations: TeamMember[],
    caseTeamRequest: ICreateCaseTeam,
    userId: string,
    results: any[]
  ): Promise<void> {
    logMessage(`Processing ${editOperations.length} edit operations...`);

    for (const teamMember of editOperations) {
      try {
     /*   const validationError = await this.validateNoOverlappingDates(
          CaseTeam,
          teamMember,
          caseTeamRequest
        );

        if (validationError) {
          results.push({
            action: "edit",
            user_rid: teamMember.user_rid,
            role_rid: teamMember.role_rid,
            status: "failed",
            error: validationError,
          });
        } else {
        */
          const [updatedRowsCount] = await CaseTeam.update(
            {
              role_rid: teamMember.role_rid,
              user_rid: teamMember.user_rid,
              effective_startdate: teamMember.effective_from,
              effective_enddate: teamMember.effective_to || null,
              is_primary: teamMember.is_primary || false,
              status_rid: teamMember.status_rid || null,
              modified_by: userId,
              modified_datetime: new Date(),
            },
            {
              where: {
                rid: teamMember.case_team_rid,
              },
            }
          );

          results.push({
            action: "updated",
            affectedRows: updatedRowsCount,
            user_rid: teamMember.user_rid,
            role_rid: teamMember.role_rid,
            status: "success",
          });
        //}
      } catch (memberError) {
        logMessage(
          `Error editing team member ${teamMember.user_rid}: ${memberError}`
        );
        results.push({
          action: "edit",
          user_rid: teamMember.user_rid,
          role_rid: teamMember.role_rid,
          status: "failed",
          error: (memberError as Error).message,
        });
      }
    }
  }

  /**
   * Processes add operations for team members
   */
  private async processAddOperations(
    CaseTeam: any,
    addOperations: TeamMember[],
    caseTeamRequest: ICreateCaseTeam,
    userId: string,
    results: any[]
  ): Promise<void> {
    logMessage(`Processing ${addOperations.length} add operations...`);

    for (const teamMember of addOperations) {
      try {
       /* const validationError = await this.validateNoOverlappingDates(
          CaseTeam,
          teamMember,
          caseTeamRequest
        );

        if (validationError) {
          results.push({
            action: "add",
            user_rid: teamMember.user_rid,
            role_rid: teamMember.role_rid,
            status: "failed",
            error: validationError,
          });
        } else { */
          const newTeamMember = await CaseTeam.create({
            account_rid: caseTeamRequest.account_rid,
            case_rid: caseTeamRequest.case_rid,
            role_rid: teamMember.role_rid,
            user_rid: teamMember.user_rid,
            effective_startdate: teamMember.effective_from,
            effective_enddate: teamMember?.effective_to || null,
            created_by: userId,
            is_primary: teamMember.is_primary || false,
            status_rid: teamMember.status_rid || null,
            created_datetime: new Date(),
          });

          results.push({
            action: "inserted",
            data: newTeamMember,
            user_rid: teamMember.user_rid,
            role_rid: teamMember.role_rid,
            status: "success",
          });
      //  }
      } catch (memberError) {
        logMessage(
          `Error adding team member ${teamMember.user_rid}: ${memberError}`
        );
        results.push({
          action: "add",
          user_rid: teamMember.user_rid,
          role_rid: teamMember.role_rid,
          status: "failed",
          error: (memberError as Error).message,
        });
      }
    }
  }

  /**
   * Generates the final response for case team operations
   */
  private generateCaseTeamResponse(results: any[]) {
    const failedOperations = results.filter((r) => r.status === "failed");
    const successfulOperations = results.filter((r) => r.status === "success");
    const skippedOperations = results.filter((r) => r.status === "skipped");

    // Create summary message
    let summaryMessage = "";
    if (failedOperations.length === 0) {
      summaryMessage = "All case team operations completed successfully";
    } else {
      const messages = [];
      if (successfulOperations.length > 0) {
        messages.push(`${successfulOperations.length} operations succeeded`);
      }
      if (failedOperations.length > 0) {
        messages.push(`${failedOperations.length} operations failed`);
      }
      if (skippedOperations.length > 0) {
        messages.push(`${skippedOperations.length} operations skipped`);
      }
      summaryMessage = messages.join(", ");
    }

    return {
      success: failedOperations.length === 0,
      message: summaryMessage,
      results: results,
      validationErrors: failedOperations.map((r) => ({
        user_rid: r.user_rid,
        role_rid: r.role_rid,
        error: r.error,
      })),
    };
  }

  async getCaseTeamRoles() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const caseRoles = await this.mainDbSequelize.query(
      rawQueries.getCaseTeamRoles(),
      {
        type: "SELECT",
      }
    );

    return caseRoles;
  }

  async listCaseTeamMembers(
    accountNumber: string,
    data: any,
    userId: string,
    type: string = "list",
    isDropdownList? : boolean,
    statusRid? : string
  ) {
    try {
      if(!this.mainDbSequelize) {
        this.mainDbSequelize = await initMainDbSequelize()
      }
      const { CaseTeam } = await this.caseModelService.getModels(accountNumber);
      let whereConditions;

      if(isDropdownList) {
        whereConditions = {
          case_rid : data.case_rid,
          account_rid : data.account_rid,
          status_rid : statusRid
        }
      } else {
        whereConditions = {
        case_rid: data.case_rid,
        account_rid: data.account_rid,
      };
      }
      const queryOptions: any = {
        where: whereConditions,
        order: [["effective_startdate", "ASC"]],
        raw : true
      };
      const caseTeamMembers = await CaseTeam.findAll(queryOptions);
      if(isDropdownList) {
        const userIds = [...new Set(caseTeamMembers.map((d : any) => d.user_rid))];
        if(userIds.length > 0) {
          const getUserDetails = await this.mainDbSequelize.query(rawQueries.getOwnerDetails(userIds));
          const userMap = new Map(getUserDetails[0].map((d : any) => [d.rid, d.name]));
          const finalData = caseTeamMembers.map((d : any) => {
            return {
              ...d,
              user_name : userMap.get(d.user_rid)
            }
          })
          return finalData
        }
      } else return caseTeamMembers;
    } catch (err) {
      logMessage(`Error in fetching case team members: ${err}`);
      errorLog("Error in fetching case team members:", (err as Error).message);
      return [];
    }
  }
  async getCaseOwners(
) {
   try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.caseModelService.getMainSequelize();
      }
      const users = await this.mainDbSequelize.query(
        rawQueries.getCaseOwners(),
        {
          type: "SELECT",
        }
      );
      return users;
    } catch (err) {
      logMessage(`Error in fetching users for case team: ${err}`);
      errorLog(
        "Error in fetching users for case team:",
        (err as Error).message
      );
      return [];
    }
  }

  

  async listUsersForCaseTeam(accountRid: string, scope: string) {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.caseModelService.getMainSequelize();
      }
      if(scope != 'all')
      {
      const users = await this.mainDbSequelize.query(
        rawQueries.listUsersForCaseTeam(accountRid),
        {
          type: "SELECT",
        }
      );
      return users;
      }
      else
      {
        const users = await this.mainDbSequelize.query(
        rawQueries.listAllUsers(),
        {
          type: "SELECT",
        }
      );
      return users;

      }
      
    } catch (err) {
      logMessage(`Error in fetching users for case team: ${err}`);
      errorLog(
        "Error in fetching users for case team:",
        (err as Error).message
      );
      return [];
    }
  }
 async createCheckList(
    accountNumber: string,
    caseRequest: ICreateChecklist,
    transaction: Transaction
  ) {
    // Implementation for creating checklist in the database
    try {
      const { CheckList } = await this.caseModelService.getModels(accountNumber);
      const createdChecklist = await CheckList.create(
      {
        account_rid: caseRequest.account_rid,
        attach_to: caseRequest.attach_to,
        attachment_level: caseRequest.attachment_level,
        checklist_name: caseRequest.checklist_name,
        checklist_description: caseRequest.checklist_description,
        checklist_template_rid: caseRequest?.checklist_template_rid || "",
        fiscal_year:caseRequest.fiscal_year,
        created_by: caseRequest.created_by,
        status_rid: caseRequest.status_rid,
        //modified_by: caseRequest.modified_by,
        created_datetime: new Date(),
        case_rid : caseRequest?.case_rid || "",
        //  modified_datetime: caseRequest.modified_datetime,
      },
      { transaction }
    );
    return createdChecklist;
    } catch (error) {
      logMessage(`Error creating checklist: ${error}`);
      throw new Error("Error creating checklist: " + error);
    }
  }

  async createCheckListForTask(
    accountNumber: string,
    caseRequest: ICreateChecklist,
    transaction: Transaction
  ) {
    // Implementation for creating checklist in the database
    try {
      const { CheckList } = await this.caseModelService.getModels(accountNumber);
      const findCheckListAlreadyCreated = await CheckList.findOne({
        where : {
          attach_to : caseRequest.attach_to,
          attachment_level : "task",
          case_rid : caseRequest.case_rid,
          checklist_template_rid : caseRequest.checklist_rid
        }, raw : true
      });
      if(!findCheckListAlreadyCreated) {
        const createdChecklist = await CheckList.create(
        {
          account_rid: caseRequest.account_rid,
          attach_to: caseRequest.attach_to,
          attachment_level: caseRequest.attachment_level,
          checklist_name: caseRequest.checklist_name,
          checklist_description: caseRequest.checklist_description,
          checklist_template_rid: caseRequest.checklist_rid || "",
          fiscal_year:caseRequest.fiscal_year,
          created_by: caseRequest.created_by,
          status_rid: caseRequest.status_rid,
          //modified_by: caseRequest.modified_by,
          created_datetime: new Date(),
          case_rid : caseRequest.case_rid
          //  modified_datetime: caseRequest.modified_datetime,
        },
        { transaction }
      );
      return createdChecklist;
      } else {
        return null;
      }
    } catch (error) {
      logMessage(`Error creating checklist: ${error}`);
      throw new Error("Error creating checklist: " + error);
    }
  }

 async updateCheckList(
    accountNumber: string,
    caseRequest: ICreateChecklist,
    transaction: Transaction
  ) {
    // Implementation for creating checklist in the database
    try {
      const { CheckList } = await this.caseModelService.getModels(accountNumber);
      const existingChecklist = await CheckList.findOne({
              where: { rid: caseRequest.checklist_rid }
            });
      
            if (!existingChecklist) {
              return {
                statusCode: HttpStatus.NOT_FOUND,
                message: STATUS_MESSAGE.checkListNotFound,
                errorMessage: STATUS_MESSAGE.checkListNotFoundError,
              };
            }
      const createdChecklist = await CheckList.update(
        {
          checklist_name: caseRequest.checklist_name,
          checklist_description: caseRequest.checklist_description,
          status_rid: caseRequest.status_rid,
          fiscal_year:caseRequest.fiscal_year,
          checklist_template_rid: caseRequest?.checklist_template_rid || "",
          modified_by: caseRequest.modified_by,
          modified_datetime: new Date(),
        },
        { where: { rid: caseRequest.checklist_rid }, transaction }
      );

      return createdChecklist;
    } catch (error) {
      logMessage(`Error updating checklist: ${error}`);
      throw new Error("Error updating checklist: " + error);
    }
  }

 async fetchChecklistDetailsById(
    checklistId: string,
    accountNumber: string,
    accountRid: string
  ) {
    if(!this.orgDbSequelize)
    {
      this.orgDbSequelize = await this.caseModelService.getSequelize();
    }
    if(!this.mainDbSequelize)
    {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(/\D/g, "")}`;
    const [checklistDetails] : any[] = await this.orgDbSequelize.query(fetchCaseDetails(schemaName,checklistId),{ type: 'SELECT' });
    const [attach_toDetails] : any[] = await this.orgDbSequelize.query(fetchChecklistAttachToDetails(schemaName,checklistDetails.attach_to,checklistDetails.attachment_level,checklistId),{ type: 'SELECT' });
    if(!checklistDetails){
      throw new Error("Checklist not found");
    }
  
    let checklistItems = await this.fetchChecklistItems(
      checklistId,accountNumber
    );
  
     const userInfo = await this.insertUserDetails(
       checklistDetails.created_by ?? "",
       checklistDetails.modified_by ?? ""
     )


    const [accountInfo]: any[] = await this.mainDbSequelize.query(
      rawQueries.fetchAccountAndCountryDetails(accountRid),
      {
        type: "SELECT",
      }
    );

    const [statusInfo]: any[] = await this.mainDbSequelize.query(
      rawQueries.getStatusDetails(checklistDetails?.status_rid ?? ""),
      {
        type: "SELECT",
      }
    );
    let attached_to = checklistDetails?.attached_to ?? "";
    if(checklistDetails?.attach_to === 'case' || checklistDetails?.attachment_level === 'case'){
          const [caseInfo]: any[] = await this.orgDbSequelize.query(
          rawQueries.fetchCaseInfo(schemaName, checklistDetails.attach_to),
          {
            type: "SELECT",
          }
        );
       // Compose case name: accountName-countryCode-fiscalYear-caseName
        const accountName = accountInfo.account_name || "";
        const countryCode = accountInfo.country_code || "";
        const fiscalYear =  caseInfo?.fiscal_year || "";
        const originalCaseName = caseInfo?.case_name || "";
        const composedCaseName = `${accountName}-${countryCode}-${fiscalYear}-${originalCaseName}`;
        attached_to = composedCaseName;
    }
   
    // Fetch fiscal_year based on attach_to
    let fiscal_year = null;
    const attachTo = checklistDetails?.attach_to;
    const attachmentLevel = checklistDetails?.attachment_level;
    if (attachmentLevel === 'case' && attachTo) {
      const [caseInfo]: any[] = await this.orgDbSequelize.query(
        rawQueries.fetchCaseInfo(schemaName, attachTo),
        { type: "SELECT" }
      );
      fiscal_year = caseInfo?.fiscal_year ?? null;
    } else if (attachmentLevel === 'account' && attachTo) {
      fiscal_year = checklistDetails?.fiscal_year ?? null;
     } else if (attachmentLevel === 'resource' && attachTo) {
      fiscal_year = checklistDetails?.fiscal_year ?? null;
    } else if (attachmentLevel === 'project' && attachTo) {
      const project = await this.fetchProjectInfoById(accountNumber, attachTo);
      fiscal_year = project?.fiscal_year ?? null;
    }
    else if (attachmentLevel === 'project_resource' && attachTo) {
      let projectResource:any = await this.fetchProjectResourceById(accountNumber, attachTo);
      if (Array.isArray(projectResource)) projectResource = projectResource[0];
      if (projectResource && projectResource.project_fiscal_rid) {
        const project = await this.fetchProjectInfoById(accountNumber, projectResource.project_fiscal_rid);
        fiscal_year = project?.fiscal_year ?? null;
      }
    } else if (attachmentLevel === 'project_task' && attachTo) {
      let projectTask :any = await this.fetchProjectTaskById(accountNumber, attachTo);
      if (Array.isArray(projectTask)) projectTask = projectTask[0];
      if (projectTask && projectTask.project_fiscal_rid) {
        const project = await this.fetchProjectInfoById(accountNumber, projectTask.project_fiscal_rid);
        fiscal_year = project?.fiscal_year ?? null;
      }
    } 
    /*else if (attachmentLevel === 'resource' && attachTo) {
      let resource:any = await this.fetchResourceById(accountNumber, attachTo);
      if (Array.isArray(resource)) resource = resource[0];
      if (resource && resource.project_fiscal_rid) {
        const project = await this.fetchProjectInfoById(accountNumber, resource.project_fiscal_rid);
        fiscal_year = project?.fiscal_year ?? null;
      }
    } else if (attachmentLevel === 'resource_cost' && attachTo) {
      let resourceCost:any = await this.fetchResourceCostById(accountNumber, attachTo);
      if (Array.isArray(resourceCost)) resourceCost = resourceCost[0];
      if (resourceCost && resourceCost.resource_rid) {
        let resource :any = await this.fetchResourceById(accountNumber, resourceCost.resource_rid);
        if (Array.isArray(resource)) resource = resource[0];
        if (resource && resource.project_fiscal_rid) {
          const project = await this.fetchProjectInfoById(accountNumber, resource.project_fiscal_rid);
          fiscal_year = project?.fiscal_year ?? null;
        }
      }
    } else if (attachmentLevel === 'resource_skill' && attachTo) {
      let resourceSkill:any = await this.fetchResourceSkillById(accountNumber, attachTo);
      if (Array.isArray(resourceSkill)) resourceSkill = resourceSkill[0];
      if (resourceSkill && resourceSkill.resource_rid) {
        let resource:any = await this.fetchResourceById(accountNumber, resourceSkill.resource_rid);
        if (Array.isArray(resource)) resource = resource[0];
        if (resource && resource.project_fiscal_rid) {
          const project = await this.fetchProjectInfoById(accountNumber, resource.project_fiscal_rid);
          fiscal_year = project?.fiscal_year ?? null;
        }
      }
    } */

    const response: any = {
      attach_to: checklistDetails?.attach_to ?? "",
      attachment_level: checklistDetails?.attachment_level ?? "",
      attached_to: attach_toDetails?.name ?? "",
      checklist_rid: checklistDetails?.rid,
      checklist_name: checklistDetails?.checklist_name ?? "",
      checklist_description: checklistDetails?.checklist_description ?? "",
      r_number: checklistDetails.r_number ?? "",
      status_rid: checklistDetails.status_rid ?? "",
      account_rid: checklistDetails.account_rid ?? "",
      fiscal_year,
      status_name: statusInfo?.status_name ?? "",
      modified_by: userInfo.modified_name ?? checklistDetails.modified_by,
      created_by: userInfo.created_name ?? checklistDetails.created_by,
      created_datetime: checklistDetails.created_datetime ?? null,
      modified_datetime: checklistDetails.modified_datetime ?? null,
      checklist_items: checklistItems ?? [],
    };
  
    return response;
    }
 async fetchChecklists(
  accountNumber: string,
  fiscalYear: number,
  attachmentLevel?: string,
  entityId?: string,
  accountRid?: string,
  page: number = 1,
  limit: number = 10,
  search?: string,
  filters: Record<string, any> = {},
  sortBy: string = 'created_datetime',
  sortOrder: string = 'DESC',
  apiType: string = "list",
  accessibleIds: string[] = [],
  graphqlData? : any
) {
  try {
      const {
          CheckList,
        } = await this.caseModelService.getModels(accountNumber);
       let allChecklists: any[] = [];
    
        // Handle attached_to and uploaded_by filters separately
        let attachedToFilter;
        let createdByFilter;
        let modifiedByFilter;
        let notesOwnerFilter;
        if (filters.attached_to) {
          attachedToFilter = filters.attached_to;
          delete filters.attached_to;
        }
        if (filters.created_by_name) {
          createdByFilter = filters.created_by_name;
          delete filters.created_by_name;
        }
        if (filters.modified_by_name) {
          modifiedByFilter = filters.modified_by_name;
          delete filters.modified_by_name;
        }
    
        const { whereClause } = this.buildRawWhereClause(filters, search);
        if (fiscalYear !== 0) {
          if (!whereClause[Op.and] || !Array.isArray(whereClause[Op.and])) {
            whereClause[Op.and] = [];
          }
          whereClause[Op.and].push({ fiscal_year: fiscalYear });
      }
        const fetchAttachments = async (model: any, level: string, attachToIds: string[]) => {
                if (attachToIds.length === 0) return [];
                let where;
                  where = {
                    [Op.and]: [
                      { attachment_level: level },
                      { attach_to: { [Op.in]: attachToIds } },
                      ...(whereClause[Op.and] || [])
                    ]
                  };
                  return model.findAll({ where });
                
              };
         // 🔷 Optimized project resource + task attachments fetch for multiple projects
        const fetchProjectResourceTaskAttachmentsBulk = async (model: any, projectIds: string[]) => {
          let projectChildAttachments: any[] = [];
          if (projectIds.length === 0) return projectChildAttachments;
    
          // 🔹 Fetch all project_resources under projects in one call
          const projectResources = await this.getProjectResourcesByProjectIds(accountNumber, projectIds);
          const projectResourceIds = projectResources.map(r => r.rid);
    
          if (projectResourceIds.length > 0) {
            const projectResourceAttachments = await fetchAttachments(model, 'project_resource', projectResourceIds);
            projectChildAttachments.push(...projectResourceAttachments);
          }
            
            // 🔹 Fetch all project_tasks under projects in one call
            const projectTasks = await this.getProjectTasksByProjectIds(accountNumber, projectIds);
            const projectTaskIds = projectTasks.map(t => t.rid);
    
            if (projectTaskIds.length > 0) {
              const projectTaskAttachments = await fetchAttachments(model, 'project_task', projectTaskIds);
              projectChildAttachments.push(...projectTaskAttachments);
            }
    
          return projectChildAttachments;
        };
       
          // 🔷 Optimized resource cost and skill attachments fetch for multiple resources
        const fetchResourceCostSkillAttachmentsBulk = async (model: any, resourceIds: string[]) => {
          let resourceCostSkillAttachments: any[] = [];
          if (resourceIds.length === 0) return resourceCostSkillAttachments;
    
          // 🔹 Fetch all resource_costs in one call
          const resourceCosts = await this.getResourceCostsByResourceIds(accountNumber, resourceIds);
          const allResourceCostIds = resourceCosts.map(rc => rc.rid);
          if (allResourceCostIds.length > 0) {
            const resourceCostAttachments = await fetchAttachments(model, 'resource_cost', allResourceCostIds);
            resourceCostSkillAttachments.push(...resourceCostAttachments);
          }
    
          // 🔹 Fetch all resource_skills in one call
          const resourceSkills = await this.getResourceSkillsByResourceIds(accountNumber, resourceIds);
          const allResourceSkillIds = resourceSkills.map(rs => rs.rid);
          if (allResourceSkillIds.length > 0) {
            const resourceSkillAttachments = await fetchAttachments(model, 'resource_skill', allResourceSkillIds);
            resourceCostSkillAttachments.push(...resourceSkillAttachments);
          }
    
          return resourceCostSkillAttachments;
        };
         if (attachmentLevel === 'case' && entityId) {
          const caseAttachments = await fetchAttachments(CheckList, 'case', [entityId]);
          allChecklists.push(...caseAttachments);
        }
        else if (attachmentLevel === 'account' && entityId) {
          const accountAttachments = await fetchAttachments(CheckList, 'account', [entityId]);
          allChecklists.push(...accountAttachments);
          const caseAttachments = await fetchAttachments(CheckList, 'case', [entityId]);
          allChecklists.push(...caseAttachments);
    
          const projects = await this.getProjectsByAccountId(accountNumber, entityId,accessibleIds);
          const projectIds = projects.map((p: { rid: any; }) => p.rid);
          if (projectIds.length > 0) {
            const projectAttachments = await fetchAttachments(CheckList, 'project', projectIds);
            allChecklists.push(...projectAttachments);
    
            const projectChildAttachments = await fetchProjectResourceTaskAttachmentsBulk(CheckList, projectIds);
            allChecklists.push(...projectChildAttachments);
          }
    
          const resources = await this.getResourcesByAccountId(accountNumber, entityId);
          const resourceIds = resources.map(r => (r as { rid: string }).rid);
          if (resourceIds.length > 0) {
            const resourceAttachments = await fetchAttachments(CheckList, 'resource', resourceIds);
            allChecklists.push(...resourceAttachments);
    
            const resourceCostSkillAttachments = await fetchResourceCostSkillAttachmentsBulk(CheckList, resourceIds);
            allChecklists.push(...resourceCostSkillAttachments);
          }
        }
        else if (attachmentLevel === 'project' && entityId) {
        const projectAttachments = await fetchAttachments(CheckList, 'project', [entityId]);
        allChecklists.push(...projectAttachments);
  
        const projectChildAttachments = await fetchProjectResourceTaskAttachmentsBulk(CheckList, [entityId]);
        allChecklists.push(...projectChildAttachments);
      }
       // 🔷 Project_resource logic
        else if (attachmentLevel === 'project_resource' && entityId) {
          const projectResourceAttachments = await fetchAttachments(CheckList, 'project_resource', [entityId]);
          allChecklists.push(...projectResourceAttachments);
          const projectResource = await this.fetchProjectResourceById(accountNumber, entityId);
          const projectTasks = await this.getProjectTasksByProjectIds(accountNumber, [(projectResource as any)?.project_fiscal_rid]);
          const projectTaskIds = projectTasks.map(t => t.rid);
          if (projectTaskIds.length > 0) {
            const projectTaskAttachments = await fetchAttachments(CheckList, 'project_task', projectTaskIds);
            allChecklists.push(...projectTaskAttachments);
          }
        }
    
        // 🔷 Resource logic
        else if (attachmentLevel === 'resource' && entityId) {
          const resourceAttachments = await fetchAttachments(CheckList, 'resource', [entityId]);
          allChecklists.push(...resourceAttachments);
    
          const resourceCostSkillAttachments = await fetchResourceCostSkillAttachmentsBulk(CheckList, [entityId]);
          allChecklists.push(...resourceCostSkillAttachments);
        }
         else {
          if (!whereClause[Op.and] || !Array.isArray(whereClause[Op.and])) {
            whereClause[Op.and] = [];
          }
          if (entityId) {
            whereClause[Op.and].push({ attach_to: entityId });
          } else if (attachmentLevel) {
            whereClause[Op.and].push({ attachment_level: attachmentLevel });
          }
    
          try {
            const result = await CheckList.findAll({ where: whereClause });
            allChecklists.push(...result);
          } catch (error) {
            throw new Error('Failed to fetch attachments');
          }
        }
         // 🔷 Fetch display names
        if(graphqlData?.document_rid) {
          allChecklists = allChecklists.filter((d : any) => d != null)
        }
        const {displayNames} = await this.getAttachmentDisplayNames(allChecklists, accountNumber);
         if (attachedToFilter) {
          allChecklists = allChecklists.filter(attachment => {
            let displayName = displayNames[attachment.rid] || String(attachment.attach_to) || '';
            const displayValue = displayName.toLowerCase();
            const operator = Object.keys(attachedToFilter)[0];
            const filterValue = (operator ? attachedToFilter[operator] || '' : '').toLowerCase();
            switch (operator) {
              case 'contains': return displayValue.includes(filterValue);
              case 'equals': return displayValue === filterValue;
              case 'not_equals': return displayValue !== filterValue || displayValue === null;
              default: return false;
            }
          });
        }
    
        // 🔷 Sort
        const validSortFields = ['checklist_name', 'r_number', 'attachment_level', 'attached_to', 'created_datetime', 'descriptions', 'created_by_name', 'fiscal_year', 'modified_by_name', 'modified_datetime'];
        const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_datetime';
        const finalSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
        allChecklists.sort((a, b) => {
          // Special handling for created_datetime
          if (finalSortBy === 'created_datetime') {
            const aDate = new Date(a[finalSortBy]).getTime();
            const bDate = new Date(b[finalSortBy]).getTime();
            return finalSortOrder === 'ASC' ? aDate - bDate : bDate - aDate;
          }
    
          let aVal = finalSortBy === 'attached_to' ? (displayNames[a.rid] ?? '') : (a[finalSortBy] ?? '');
          let bVal = finalSortBy === 'attached_to' ? (displayNames[b.rid] ?? '') : (b[finalSortBy] ?? '');
    
          // Convert to string safely
          aVal = typeof aVal === 'string' ? aVal.toLowerCase() : String(aVal).toLowerCase();
          bVal = typeof bVal === 'string' ? bVal.toLowerCase() : String(bVal).toLowerCase();
    
          const aEmpty = !aVal || aVal.trim() === '';
          const bEmpty = !bVal || bVal.trim() === '';
    
          if (aEmpty && bEmpty) return 0; // Both empty – equal
          if (aEmpty) return finalSortOrder === 'ASC' ? 1 : -1; // a empty comes last in ASC, first in DESC
          if (bEmpty) return finalSortOrder === 'ASC' ? -1 : 1; // b empty comes last in ASC, first in DESC
    
          // Both non-empty, normal comparison
          return finalSortOrder === 'ASC' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
         const paginatedAttachments = allChecklists
            
        // 🔷 Map document types and users
        const userIds = [...new Set(paginatedAttachments.flatMap(att => [att.created_by,att.modified_by, att.notes_owner]))];
    
        const mainSequelize = await initMainDbSequelize();
        const [users] = await Promise.all([
          userIds.length > 0 ? mainSequelize.query(
            rawQueries.listUsersByIds(userIds),
            { replacements: { userIds }, type: 'SELECT' }
          ) : Promise.resolve([]),
        ]);
         const userMap = new Map(users.map((u: any) => [u.rid, u.full_name]));

        let checklists : any[]
        // Enhanced fiscal_year enrichment for all checklist types
        const getFiscalYearForChecklist = async (attachment: any) => {
          // CASE: fetch from Case model
          if (attachment.attachment_level === 'case' && attachment.attach_to) {
            const caseData = await this.fetchCaseById(accountNumber, attachment.attach_to);
            return caseData?.fiscal_year ?? null;
          }
          // ACCOUNT: use fiscal_year from checklist model itself
          if (attachment.attachment_level === 'account') {
            return attachment.fiscal_year ?? null;
          }
          if (attachment.attachment_level === 'resource' || attachment.attachment_level === 'resource_cost' || attachment.attachment_level === 'resource_skill') {
            return attachment.fiscal_year ?? null;
          }
          
          // PROJECT: fetch from project info (project fiscal_year)
          if (attachment.attachment_level === 'project' && attachment.attach_to) {
            const project = await this.fetchProjectInfoById(accountNumber, attachment.attach_to);
            return project?.fiscal_year ?? null;
          }
          // PROJECT_RESOURCE: fetch project_resource, then project fiscal_year
          if (attachment.attachment_level === 'project_resource' && attachment.attach_to) {
            let projectResource:any = await this.fetchProjectResourceById(accountNumber, attachment.attach_to);
            if (Array.isArray(projectResource)) projectResource = projectResource[0];
            if (projectResource && projectResource.project_fiscal_rid) {
              const project = await this.fetchProjectInfoById(accountNumber, projectResource.project_fiscal_rid);
              return project?.fiscal_year ?? null;
            }
            return null;
          }
          // PROJECT_TASK: fetch project_task, then project fiscal_year
          if (attachment.attachment_level === 'project_task' && attachment.attach_to) {
            let projectTask:any = await this.fetchProjectTaskById(accountNumber, attachment.attach_to);
            if (Array.isArray(projectTask)) projectTask = projectTask[0];
            if (projectTask && projectTask.project_fiscal_rid) {
              const project = await this.fetchProjectInfoById(accountNumber, projectTask.project_fiscal_rid);
              return project?.fiscal_year ?? null;
            }
            return null;
          }
          

          // Default: fallback to null
          return null;
        };

          checklists = await Promise.all(paginatedAttachments.map(async attachment => {
            const fiscal_year = await getFiscalYearForChecklist(attachment);
            return {
              ...attachment.get({ plain: true }),
              created_by_name: userMap.get(attachment.created_by) || attachment.created_by,
              modified_by_name: userMap.get(attachment.modified_by) || attachment.modified_by,
              attached_to: displayNames[attachment.rid] || attachment.attach_to,
              fiscal_year,
            }
          }));
        if (sortBy === 'created_by_name') {
          checklists.sort((a, b) => {
            const aType = a.created_by_name || '';
            const bType = b.created_by_name || '';
            const aEmpty = !aType || aType.trim() === '';
            const bEmpty = !bType || bType.trim() === '';
            
            if (aEmpty && bEmpty) return 0;
            if (aEmpty) return finalSortOrder === 'ASC' ? 1 : -1;
            if (bEmpty) return finalSortOrder === 'ASC' ? -1 : 1;
            
            return finalSortOrder === 'ASC' ? 
              aType.localeCompare(bType) : 
              bType.localeCompare(aType);
          });
        }

        if (sortBy === 'modified_by_name') {
          checklists.sort((a, b) => {
            const aType = a.modified_by_name || '';
            const bType = b.modified_by_name || '';
            const aEmpty = !aType || aType.trim() === '';
            const bEmpty = !bType || bType.trim() === '';
            
            if (aEmpty && bEmpty) return 0;
            if (aEmpty) return finalSortOrder === 'ASC' ? 1 : -1;
            if (bEmpty) return finalSortOrder === 'ASC' ? -1 : 1;
            
            return finalSortOrder === 'ASC' ? 
              aType.localeCompare(bType) : 
              bType.localeCompare(aType);
          });
        }
        if (createdByFilter) {
          let filterValue;
            checklists = checklists.filter(checklist => {
            const uploadedBy = checklist.created_by_name?.toLowerCase() || '';
            const operator = Object.keys(createdByFilter)[0];
            if(operator === 'is_empty') filterValue = ''
            else filterValue = (operator ? createdByFilter[operator] || '' : '').toLowerCase();
            switch (operator) {
              case 'contains': return uploadedBy.includes(filterValue);
              case 'equals': return uploadedBy === filterValue;
              case 'not_equals': return uploadedBy !== filterValue;
              case 'is_empty': return uploadedBy === null || uploadedBy === ''
              default: return false;
            }
          });
        }
        if (modifiedByFilter) {
          let filterValue;
            checklists = checklists.filter(checklist => {
            const uploadedBy = checklist.modified_by_name?.toLowerCase() || '';
            const operator = Object.keys(modifiedByFilter)[0];
            if(operator === 'is_empty') filterValue = ''
            else filterValue = (operator && modifiedByFilter[operator] ? modifiedByFilter[operator] : '').toLowerCase();
            switch (operator) {
              case 'contains': return uploadedBy.includes(filterValue);
              case 'equals': return uploadedBy === filterValue;
              case 'not_equals': return uploadedBy !== filterValue
              case 'is_empty': return uploadedBy === null || uploadedBy === ''
              default: return false;
            }
          });
        }
        const totalCount = checklists.length;
        if(apiType === 'download') {
          return {
            checklists,
            totalCount,
          }
        }
        checklists = checklists.slice((page - 1) * limit, page * limit);
        return {
          checklists,
          totalCount,
        }
    

  }
  catch (err) { 
    logMessage(`Error in fetch cases checklists: ${err}`);
    errorLog("Error in fetch cases checklists:", (err as Error).message);
    return [];
  }
}
   async getAttachmentDisplayNames(attachments: any[], schemaNumber: string): Promise<any> {
  const displayNames: Record<string, string> = {};
  let parentRid : Record<string, string> = {}
  let currencyRid : Record<string, string> = {}
  for (const attachment of attachments) {
    try {
      switch (attachment.attachment_level) {
        case 'case':
          const caseData = await this.fetchCaseById(schemaNumber,attachment.attach_to);
          displayNames[attachment.rid] = caseData?.case_name || attachment.attach_to;
          parentRid[attachment.attach_to] = ''
          currencyRid[attachment.attach_to] = ''
          break;
        case 'account':
          const account = await this.fetchAccountById(attachment.attach_to);
          displayNames[attachment.rid] = account?.account_name || attachment.attach_to;
          parentRid[attachment.attach_to] = ''
          currencyRid[attachment.attach_to] = ''
          break;
        case 'project':
          const project = await this.fetchProjectInfoById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = project?.project_code || attachment.attach_to;
          parentRid[attachment.attach_to] =''
          currencyRid[attachment.attach_to] = project?.currency_rid || ''
          break;
        case 'project_resource':
          const projectResource = await this.fetchProjectResourceById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = (projectResource as { r_number?: string })?.r_number || attachment.attach_to;
          parentRid[attachment.attach_to] = (projectResource as {project_fiscal_rid? : string})?.project_fiscal_rid || ''
          currencyRid[attachment.attach_to] = (projectResource as {currency_rid? : string})?.currency_rid || ''
          break;
        case 'project_task':
          const projectTask = await this.fetchProjectTaskById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = (projectTask as { r_number?: string })?.r_number || attachment.attach_to;
          parentRid[attachment.attach_to] = (projectTask as {project_fiscal_rid? : string})?.project_fiscal_rid || ''
          currencyRid[attachment.attach_to] = (projectTask as {currency_rid? : string})?.currency_rid || ''
          break;
        case 'resource':
          const resource = await this.fetchResourceById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = (resource as { resource_code?: string })?.resource_code || attachment.attach_to;
          parentRid[attachment.attach_to] = ''
          currencyRid[attachment.attach_to] = ''
          break;
        case 'resource_cost':
          const resourceCost = await this.fetchResourceCostById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = (resourceCost as { r_number?: string })?.r_number || attachment.attach_to;
          parentRid[attachment.attach_to] = (resourceCost as {resource_rid? : string})?.resource_rid || attachment.attach_to
          currencyRid[attachment.attach_to] = ''
          break;
        case 'resource_skill': 
          const resourceSkill = await this.fetchResourceSkillById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = (resourceSkill as { r_number?: string })?.r_number || attachment.attach_to;
          parentRid[attachment.attach_to] = (resourceSkill as {resource_rid? : string})?.resource_rid || ''
          currencyRid[attachment.attach_to] = ''
          break;       
        default:
          displayNames[attachment.rid] = attachment.attach_to;
      }
    } catch (err) {
      console.error(`Error fetching display name for attachment ${attachment.rid}:`, err);
      displayNames[attachment.rid] = attachment.attach_to;
    }
  }

  
  
  return {
    displayNames,
    parentRid,
    currencyRid
  };
}

async fetchAccountById(accountId: string) {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.caseModelService.getMainSequelize();
      }
      const [accountData]: any[] = await this.mainDbSequelize.query(
        rawQueries.getAccountWithStatusByRidQuery(),
        {
          replacements: { rid: accountId },
          type: "SELECT",
        }
      );

      return accountData;
    } catch (err) {
      errorLog("Error fetching Accounts: " + (err as Error).message);
      throw new Error("Error fetching Accounts: " + (err as Error).message);
    }
  }
async fetchCaseById(schemaNumber: string, caseId: string) {
    try {
      const schemaName = `${MAIN_SCHEMA_NAME}_${schemaNumber.replace(/\D/g, "")}`;
      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.caseModelService.getSequelize();
      }
       if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.caseModelService.getMainSequelize();
      }
      let [caseData]: any[] = await this.orgDbSequelize.query(
        rawQueries.fetchCaseById(schemaName),
        {
          replacements: { caseId },
          type: "SELECT",
        }
      );
      const [accountInfo]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchAccountAndCountryDetails(caseData.account_rid),
        {
          type: "SELECT",
        }
      );
  // Compose case name: accountName-countryCode-fiscalYear-caseName
  const accountName = accountInfo.account_name || "";
  const countryCode = accountInfo.country_code || "";
  const fiscalYear = caseData.fiscal_year || "";
  const originalCaseName = caseData.case_name || "";
  const composedCaseName = `${accountName}-${countryCode}-${fiscalYear}-${originalCaseName}`;
  caseData.case_name = composedCaseName;
  return caseData;
    } catch (err) {
      errorLog("Error fetching Cases: " + (err as Error).message);
      throw new Error("Error fetching Cases: " + (err as Error).message);
    }
  }
async fetchProjectInfoById(accountNumber: string, projectId: string) {
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(/\D/g, "")}`;
    const query = rawQueries.fetchProjectInfoById(schemaName);
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await this.caseModelService.getSequelize();
    }
    const [result]: any[] = await this.orgDbSequelize.query(query, {
      replacements: { projectId },
      type: "SELECT",
    });
    return result || null;
  }
async fetchProjectTaskById(accountNumber: string, projectTaskId: string) {
  const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
    /\D/g,
    ""
  )}`;

  const query = rawQueries.fetchProjectTaskById(schemaName);

  if(!this.orgDbSequelize) {
        this.orgDbSequelize = await this.caseModelService.getSequelize(
        );
      }
  const result = await this.orgDbSequelize.query(query, {
    replacements: { projectTaskId },
    type: "SELECT",
    raw: true,
  });
  return result[0];
}
  async fetchResourceById(accountNumber: string, resourceId: string) {
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    const query = rawQueries.fetchResourceById(schemaName);

    if(!this.orgDbSequelize) {
        this.orgDbSequelize = await this.caseModelService.getSequelize(
        );
      }
    const result = await this.orgDbSequelize.query(query, {
      replacements: { resourceId },
      type: "SELECT",
      raw: true,
    });

    return result[0];
  }

  async fetchResourceCostById(accountNumber: string, resourceCostId: string) {
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    const query = rawQueries.fetchResourceCostById(schemaName);

    if(!this.orgDbSequelize) {
        this.orgDbSequelize = await this.caseModelService.getSequelize( 
        );
      } 
    const result = await this.orgDbSequelize.query(query, {
      replacements: { resourceCostId },
      type: "SELECT",
      raw: true,
    });

    return result[0];
  }

  async fetchResourceSkillById(accountNumber: string, resourceSkillId: string) {
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    const query = rawQueries.fetchResourceSkillById(schemaName);

    if(!this.orgDbSequelize) {
        this.orgDbSequelize = await this.caseModelService.getSequelize(
        );
      }
    const result = await this.orgDbSequelize.query(query, {
      replacements: { resourceSkillId },
      type: "SELECT",
      raw: true,
    });

    return result[0];
  }
  /**
   * Fetches project resources for multiple project IDs using a single SQL query
   *
   * @param {string} accountNumber - Account number to determine schema
   * @param {string[]} projectIds - Array of project IDs
   * @returns {Promise<any[]>} - Project_resources data
   */
  async getProjectResourcesByProjectIds(
    accountNumber: string,
    projectIds: string[]
  ): Promise<any[]> {
    try {
      if (projectIds.length === 0) return [];

      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;

      const query = rawQueries.fetchProjectResourceAndFiscal(schemaName);

       if(!this.orgDbSequelize) {
        this.orgDbSequelize = await this.caseModelService.getSequelize(
        );
      }
      const results = await this.orgDbSequelize.query(query, {
        replacements: { projectIds },
        type: "SELECT",
      });

      return results;
    } catch (error) {
      console.error("Error fetching project resources (bulk):", error);
      throw error;
    }
  }

  /**
   * Fetches project tasks for multiple project IDs using a single SQL query
   *
   * @param {string} accountNumber - Account number to determine schema
   * @param {string[]} projectIds - Array of project IDs
   * @returns {Promise<any[]>} - Project_task data
   */
  async getProjectTasksByProjectIds(
    accountNumber: string,
    projectIds: string[]
  ): Promise<any[]> {
    try {
      if (!projectIds?.length) return [];

      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;
       if(!this.orgDbSequelize) {
        this.orgDbSequelize = await this.caseModelService.getSequelize(
        );
      }

      // Check if project_task table exists
      const checkTableQuery = rawQueries.checkProjectTaskExists(schemaName);

      const [tableExists] = await this.orgDbSequelize.query(checkTableQuery, {
        type: "SELECT",
      });

      if ((tableExists as any).exists === false) {
        return [];
      }

      const query = rawQueries.fetchProjectTaskAndFiscal(schemaName);

      const results = await this.orgDbSequelize.query(query, {
        replacements: { projectIds },
        type: "SELECT",
      });

      return results;
    } catch (error) {
      console.error("Error fetching project tasks:", error);
      throw error;
    }
  }

    async getResourceSkillsByResourceIds(
    accountNumber: string,
    resourceIds: string[]
  ): Promise<any[]> {
    try {
      if (resourceIds.length === 0) return [];

      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;

      const query = rawQueries.getLatestResourceSkillsQuery(schemaName);

       if(!this.orgDbSequelize) {
        this.orgDbSequelize = await this.caseModelService.getSequelize(
        );
      }
      const results = await this.orgDbSequelize.query(query, {
        replacements: { resourceIds },
        type: "SELECT",
      });

    return results;

  } catch (error) {
    errorLog("Error fetching resource skills by resource IDs: " + (error as Error).message);
    throw error;
  }
}

   async getResourceCostsByResourceIds(
    accountNumber: string,
    resourceIds: string[]
  ): Promise<any[]> {
    try {
      if (resourceIds.length === 0) return [];

      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;

      const query = rawQueries.getLatestResourceCostEntriesQuery(schemaName);

       if(!this.orgDbSequelize) {
        this.orgDbSequelize = await this.caseModelService.getSequelize(
        );
      }
      const results = await this.orgDbSequelize.query(query, {
        replacements: { resourceIds },
        type: "SELECT",
      });

    return results;

  } catch (error) {
    errorLog(`Error fetching resource costs by resource IDs: ${(error as Error).message}`);
    throw error;
  }
}

 async fetchProjectResourceById(
    accountNumber: string,
    projectResourceId: string
  ) {
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    const query = rawQueries.fetchProjectResourceById(schemaName);
    if(!this.orgDbSequelize) {
        this.orgDbSequelize = await this.caseModelService.getSequelize(
        );
      }
    const result = await this.orgDbSequelize.query(query, {
      replacements: { projectResourceId },
      type: "SELECT",
      raw: true,
    });
    return result[0];
  }

  async getResourcesByAccountId(accountNumber: string, accountRid: string) {
      try {
        const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(/\D/g, '')}`;
  
        const query = rawQueries.getResourcesByAccountQuery(schemaName);
        if(!this.orgDbSequelize) {
              this.orgDbSequelize = await this.caseModelService.getSequelize(
              );
            }
        const results = await this.orgDbSequelize.query(query, {
          replacements: { accountRid },
          type: 'SELECT'
        });
  
        return results;
  
      } catch (error) {
        errorLog("Error fetching resources by account ID:", (error as Error).message);
        throw error;
      }
    }

 async getProjectsByAccountId(accountNumber: string, accountRid: string, accessibleIds: string[]) {
      if(!this.orgDbSequelize) {
        this.orgDbSequelize = await this.caseModelService.getSequelize(
        );
      }
       const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(
        /\D/g,
        ""
      )}`;
      const [results]: any[] = await this.orgDbSequelize.query(
        rawQueries.getAllProjectsByAccountId(
          schemaName,
          accountRid,
          accessibleIds
        )
      );
      return results;
  }

      async fetchChecklistItems(
        checklistId: string,
        accountNumber: string
      ) {
        try {
          const {
            CheckListItem,
          } = await this.caseModelService.getModels(accountNumber);
          // Convert Sequelize instances to plain objects
    
          const items = await CheckListItem.findAll({
            attributes: [
              "rid",
              "checklist_item_name",
              "status_rid",
              "checklist_item_description"
              ],
            order: [
              ["created_datetime", "ASC"],
            ],
            where: { checklist_rid: checklistId },
          });
          return items;
        } catch (err) {
          logMessage(`Error fetching checklist items: ${err}`);
          throw new Error(
            "Error fetching checklist items: " + (err as Error).message
          );
        }
      }
    
      async insertUserDetails(
        createdById: string,
        modifiedById: string
      ): Promise<any> {
        try {
          if (!this.mainDbSequelize) {
            this.mainDbSequelize =
              await this.caseModelService.getMainSequelize();
          }
    
          const getUserFullName = async (userId: string) => {
            if (!userId) return null;
    
            const [results]: any = await this.mainDbSequelize?.query(
              rawQueries.getUserNameByIdQuery(),
              {
                replacements: { userId },
                type: "SELECT",
              }
            );
    
            if (!results) return null;
    
            const { first_name, middle_name, last_name } = results as any;
            return [first_name, middle_name, last_name].filter(Boolean).join(" ");
          };
    
          const createdName = await getUserFullName(createdById);
          const modifiedName = await getUserFullName(modifiedById);
    
          return {
            created_name: createdName || null,
            modified_name: modifiedName || null,
          };
        } catch (err) {
          logMessage(`Error adding user details: ${err}`);
          throw new Error("Error adding user details" + (err as Error).message);
        }
      }
        /**
     * Utility function to process a single checklist item based on its action type
     * @param AdminCheckListItem - The model instance
     * @param checklistTemplateRid - Parent checklist RID
     * @param item - Checklist item data
     * @param createdBy - User ID performing the action
     * @param transaction - Database transaction
     * @returns Promise resolving to the processed item result
     */
    async  processChecklistItemByAction(
      CheckListItem: any,
      checklistRid: string,
      item: ICreateChecklistItem,
      checkListReq: ICreateChecklist,
      transaction: Transaction
    ) {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.caseModelService.getMainSequelize();
      }
      const [checkListStatus]:any[] = await this.mainDbSequelize.query(
        rawQueries.fetchChecklistStatusByName("Open"),
        { type: "SELECT" }
      );
      switch (item.action_type) {
        case "add":
          return await addChecklistItem(
            CheckListItem,
            checklistRid,
            item,
            checkListReq.created_by,
            checkListReq.account_rid,
            checkListStatus?.rid,
            transaction
          );
    
        case "edit":
          return await editChecklistItem(
            CheckListItem,
            checklistRid,
            item,
            checkListReq.created_by,
            transaction
          );
    
        case "delete":
          return await deleteChecklistItem(
            CheckListItem,
            checklistRid,
            item,
            transaction
          );
    
        default:
          logMessage(
            `Warning: Unknown action type '${item.action_type}' for checklist item: ${item.checklist_item_name}`
          );
          throw new Error(
            `Invalid action type: ${item.action_type}. Supported types are: add, edit, delete`
          );
      }
    }
  

  async manageCheckListItems(
      accountNumber: string,
      checklistReq: ICreateChecklist,
      checklistRid: string,
      transaction: Transaction
    ): Promise<any[]> {
      // Implementation for managing checklist items based on action type (add, edit, delete)
      try {
        const { CheckListItem } = await this.caseModelService.getModels(accountNumber);
  
        const processedItems = [];
  
        for (const item of checklistReq.checklist_items) {
          // Use the utility function to process each item based on its action type
          const result = await this.processChecklistItemByAction(
            CheckListItem,
            checklistRid,
            item,
            checklistReq,
            transaction,
            
          );
  
          if (result) {
            processedItems.push({
              ...result,
              action_type: item.action_type,
            });
          }
        }
  
        return processedItems;
      } catch (error) {
        logMessage(`Error processing checklist items: ${error}`);
        throw new Error("Error processing checklist items: " + error);
      }
    }
  async cloneDefaultMilestoneTaskTemplate (accountRid : string, caseRid : string, filing_type_rid : string, taskTypeRid : string, accountNumber : string, transaction : Transaction, caseStartDate : Date, taskStatusRid : string) {
    const {CaseTask, CaseMilestone, CaseTaskWorkflowConnector} = await this.caseModelService.getModels(accountNumber);
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const fetchStatusRid : any = await this.mainDbSequelize.query(rawQueries.getActiveStatusId())
    const queryResult : any = await this.mainDbSequelize.query(fetchMilestoneTaskTemplate(taskTypeRid, filing_type_rid, fetchStatusRid[0][0].rid));
    let clonedData = queryResult[0][0]
    let milestoneSequenceNumber : any[] = []
    let milestoneMap : Map<string, string> = new Map();
    if(clonedData.milestone_data !== null) {
      const finalMilestoneData = clonedData.milestone_data.map((d : any) => {
        milestoneMap.set(d.milestone_rid, d.milestone_sequence_no);
        milestoneSequenceNumber.push(d.milestone_sequence_no)
        delete d.milestone_sequence_no
        return {
          ...d,
          account_rid : accountRid,
          case_rid : caseRid,
          rid : d.milestone_rid
        }
      })
      const result = await CaseMilestone.bulkCreate(finalMilestoneData, {transaction})
      if(clonedData.task_data !== null) {
        let startDate : Date;
        let endDate : Date;
        let startDateMap : Map<number, Date> = new Map();
        let endDateMap : Map<number, Date> = new Map();
        let startDateStorage;
        let endDateStorage;
        let otherMileStoneStartDateStorage;
        let otherMileStoneEndDateStorgae;
        let validEndDate;
        let otherStartDateMap : Map<number, Date> = new Map()
        let otherEndDateMap : Map<number, Date> = new Map()
        let firstMilestoneEntered : boolean = false
        let secondMilestoneEntered : boolean = false
        let otherMilestoneEntered : boolean = false
        let firstMilestoneDatePicker : boolean = false
        let firstMilestoneForSecondDatePicker : boolean = false
        if(clonedData.task_data.length > 0) {
        for(let d of clonedData.task_data) {          
          if(milestoneMap.get(d.milestone_template_rid) === "1") {
            if(!firstMilestoneEntered) {
              firstMilestoneEntered = true
              if(d.sequence_no === 1) {
                const conversion = dayjs(caseStartDate)
                let res = conversion.add(d.effort_in_days - 1, 'day');
                let finalisedEnddate = res.format('YYYY-MM-DD')
                endDate = dayjs(finalisedEnddate).toDate()
                startDate = caseStartDate
                startDateStorage = startDate
                endDateStorage = endDate
                startDateMap.set(d.task_name, startDateStorage)
                endDateMap.set(d.task_name, endDateStorage)
              }
            } 
            else {
              const conversion = dayjs(endDateStorage)
              let res = conversion.add(d.effort_in_days, 'day');
              let finalisedEnddate = res.format('YYYY-MM-DD')
              endDate = dayjs(finalisedEnddate).toDate()
              const newStartDate = conversion.add(1, 'day').format('YYYY-MM-DD')
              startDate = dayjs(newStartDate).toDate()
              startDateStorage = startDate
              endDateStorage = endDate
              startDateMap.set(d.task_name, startDateStorage)
              endDateMap.set(d.task_name, endDateStorage)
            }
          } 
          else {
            let day : any
            if(milestoneMap.get(d.milestone_template_rid) === "2") {
              if(!firstMilestoneEntered && !secondMilestoneEntered) {
                validEndDate = caseStartDate
                secondMilestoneEntered = true
                day = dayjs(validEndDate)
                d.effort_in_days = d.effort_in_days - 1
              }
              else if(firstMilestoneEntered && !firstMilestoneForSecondDatePicker) {
                validEndDate = endDateStorage
                day = dayjs(validEndDate)
                day = day.add(1, 'day')
                firstMilestoneForSecondDatePicker = true
                d.effort_in_days = d.effort_in_days
              } 
              else {
                validEndDate = otherMileStoneEndDateStorgae
                day = dayjs(validEndDate)
                day = day.add(1, 'day')
                d.effort_in_days = d.effort_in_days
              }
            } else {
              if(!firstMilestoneEntered && !secondMilestoneEntered && !otherMilestoneEntered) {
                validEndDate = caseStartDate
                otherMilestoneEntered = true
                day = dayjs(validEndDate)
                d.effort_in_days = d.effort_in_days - 1
              }
              else if (!secondMilestoneEntered) {
                validEndDate = otherMileStoneEndDateStorgae
                day = dayjs(validEndDate)
                day = day.add(1, 'day')
                d.effort_in_days = d.effort_in_days
              }
              else {
                validEndDate = endDateStorage
                day = dayjs(validEndDate)
                day = day.add(1, 'day')
                firstMilestoneDatePicker = true
                d.effort_in_days = d.effort_in_days
              }
            }
            if(d.sequence_no === 1) {
              const conversion = dayjs(validEndDate)
              let res = conversion.add(d.effort_in_days, 'day');
              let finalisedEnddate = res.format('YYYY-MM-DD')
              endDate = dayjs(finalisedEnddate).toDate()
              let finalDay = day.toDate()
              otherMileStoneStartDateStorage = day
              otherMileStoneEndDateStorgae = endDate
              otherStartDateMap.set(d.task_name, finalDay)
              otherEndDateMap.set(d.task_name, otherMileStoneEndDateStorgae)
            } 
            else {
              const conversion = dayjs(otherMileStoneEndDateStorgae)
              let res = conversion.add(d.effort_in_days, 'day');
              let finalisedEnddate = res.format('YYYY-MM-DD')
              endDate = dayjs(finalisedEnddate).toDate()
              let newStartDate = dayjs(otherMileStoneEndDateStorgae)
              newStartDate = newStartDate.add(1, 'day')
              startDate = dayjs(newStartDate).toDate()
              otherMileStoneStartDateStorage = startDate
              otherMileStoneEndDateStorgae = endDate
              otherStartDateMap.set(d.task_name, otherMileStoneStartDateStorage)
              otherEndDateMap.set(d.task_name, otherMileStoneEndDateStorgae)
            }
          } 
        }
        let mapValueHolderForStart : any;
        let mapValueHolderForEnd : any
        const finalTaskData = clonedData.task_data.map((d : any) => {
          if(milestoneMap.get(d.milestone_template_rid) === "1") {
            mapValueHolderForStart = startDateMap.get(d.task_name)
            mapValueHolderForEnd = endDateMap.get(d.task_name)
          } else {
            mapValueHolderForStart = otherStartDateMap.get(d.task_name)
            mapValueHolderForEnd = otherEndDateMap.get(d.task_name)
          }
          return {
            ...d,
            effective_start_datetime : mapValueHolderForStart,
            effective_end_datetime : mapValueHolderForEnd,
            account_rid : accountRid,
            case_rid : caseRid,
            task_status_rid : taskStatusRid,
            rid : d.task_rid
          }
        })
        let finalWorkFlowData;
        if(clonedData.workflow_data !== null) {
          finalWorkFlowData = clonedData.workflow_data.map((d : any) => {
            return {
              ...d,
              account_rid : accountRid,
              case_rid : caseRid
            }
          })
         await CaseTaskWorkflowConnector.bulkCreate(finalWorkFlowData, {transaction});
        }
        
        await CaseTask.bulkCreate(finalTaskData, {transaction})
        await this.cloneDefaultChecklistTemplate(accountRid, caseRid, filing_type_rid, accountNumber, transaction,finalTaskData)
      }
        }
    }
  }
  async cloneDefaultChecklistTemplate (accountRid : string, caseRid : string, filing_type_rid : string, accountNumber : string, transaction : Transaction,finalTaskData:any) {
    const {CheckList, CheckListItem,AdminCheckListItem,AdminChecklist} = await this.caseModelService.getModels(accountNumber);

    // Iterate over finalTaskData and clone checklist if checklist_template_rid is non-empty
    for (const task of finalTaskData) {
      if (task.checklist_template_rid && String(task.checklist_template_rid).trim() !== "") {
        const templateChecklist = await AdminChecklist.findOne({
          where: { rid: task.checklist_template_rid },
        });
        if (templateChecklist) {
          const checklistData = {
            attach_to: task.rid,
            attachment_level: "task",
            checklist_name: templateChecklist.checklist_name,
            checklist_description: templateChecklist.checklist_description,
            checklist_template_rid:task.checklist_template_rid,
            account_rid: accountRid,
            created_datetime: new Date(),
            created_by: task.created_by,
            case_rid : caseRid
          };
          const newChecklist = await CheckList.create(checklistData, { transaction });

          const templateItems = await AdminCheckListItem.findAll({
            where: { checklist_template_rid: task.checklist_template_rid },
          });
          for (const item of templateItems) {
            const itemData = {
              checklist_item_name: item.checklist_item_name,
              checklist_item_description: item.description,
              account_rid: accountRid,
              checklist_rid: newChecklist.rid,
              created_datetime: new Date(),
              created_by: task.created_by,
            };
            await CheckListItem.create(itemData, { transaction });
          }
        }
      }
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
  async createUserLevelTask (data : CreateCaseTaskType, accountNumber : string, transaction : Transaction, activeStatusRid : string, fiscalYear : number) {
    const {CaseTask, CaseTimeline, TaskSummary,Case, CaseHistory} = await this.caseModelService.getModels(accountNumber);
    const fetchSequenceNumber = await this.fetchSequenceOrder(data.milestone_template_rid, accountNumber);
    let sequenceNo : number = 0;
    if(fetchSequenceNumber.length > 0) {
      sequenceNo = fetchSequenceNumber[0]?.sequence_no! + 1
    } else {
      sequenceNo = 0
    }
    const createdTaskResult = await CaseTask.create({
      rid : `${ENV_PREFIX}${uuidv4()}`,
      created_by : data.created_by,
      created_datetime : new Date(),
      task_name : data.task_name,
      sequence_no : sequenceNo,
      effective_start_datetime : data.effective_start_datetime,
      effective_end_datetime : data.effective_end_datetime,
      case_team_member_role_rid : data.case_team_member_role_rid,
      assigned_to : data.assigned_to,
      status_rid : data.status_rid,
      priority_rid : data.priority_rid,
      milestone_template_rid : data.milestone_template_rid,
      checklist_template_rid : data.checklist_template_rid,
      account_rid : data.account_rid,
      case_rid : data.case_rid,
      task_type_rid : data.task_type_rid,
      task_description : data.task_description,
      task_status_rid : data.task_status_rid,
      weightage_rid : data.weightage_rid,
      task_category_rid : data.task_category_rid
    }, {transaction});
    if(createdTaskResult) {
      const caseInfo = await Case.findOne({
        where : {
          rid : data.case_rid,
          account_rid : data.account_rid
        },
        attributes : ['case_name','fiscal_year'],
        raw : true  
      });
    /*  await TaskSummary.create(
        {
          task_rid: createdTaskResult.rid,
          r_number: createdTaskResult.r_number || "",
          account_rid: createdTaskResult.account_rid || "",
          attach_to: createdTaskResult.rid || "",
          attachment_level: "case",
          task_name: data.task_name || "",
          description: data.task_description || "",
          fiscal_year: caseInfo?.fiscal_year || 0,
          assigned_to: data.assigned_to || "",
          status_rid: data.status_rid || "",
          priority_rid: data.priority_rid || "",
          effective_start_datetime: data.effective_start_datetime,
          effective_end_datetime: data.effective_end_datetime,
          created_by: data.created_by || "",
          created_datetime: new Date(),
        }
      );
      */
      if(data?.checklist_template_rid) 
      {
        const response  = await this.fetchChecklistTemplateDetailsById(data.checklist_template_rid);
        response.checklist_items.map((item:any) => item.action_type  = 'add');
        let caseRequest = {
          account_rid: data.account_rid!,
          checklist_name: response.checklist_name,
          checklist_description: response.description,  
          checklist_items: response.checklist_items,
          attach_to: createdTaskResult.dataValues.rid,
          attachment_level: 'task',
          created_by: data.created_by,
          created_datetime: new Date(),
          fiscal_year: fiscalYear,
          checklist_rid: data.checklist_template_rid,
          case_rid : data.case_rid
        };

        const checklistResponse = await this.createCheckListForTask(accountNumber, caseRequest, transaction);
        if(checklistResponse)
          await this.manageCheckListItems(accountNumber,caseRequest,checklistResponse.rid, transaction);
      }
      if(data.tags.length > 0) {
        for(let d of data.tags) {
      await this.createOrUpdateTags(createdTaskResult.dataValues.rid, data.account_rid, data.case_rid, d.tag_rid, d.is_new_tag, accountNumber, data.created_by, activeStatusRid,"case_task")
        }
      }
      if(Object.keys(data.workflow_connector).length > 0) {
        if(data.workflow_connector.target_rid.length > 0) {
          data.workflow_connector.created_by = data.created_by
          data.workflow_connector.case_rid = data.case_rid
          data.workflow_connector.source_rid = createdTaskResult.dataValues.rid
          data.workflow_connector.account_rid = data.account_rid
          const workflowResult = await this.taskWorkflowConnector(accountNumber, data.workflow_connector, transaction);
          if(workflowResult.statusCode === HttpStatus.BAD_REQUEST) {
            return {
              statusCode : HttpStatus.BAD_REQUEST,
              statusMessage : workflowResult.statusMessage
            }
          }
        }
      }
      await CaseTimeline.create({
        created_by : data.created_by,
        created_datetime : new Date(),
        account_rid : data.account_rid,
        entity_rid : data.case_rid,
        event_name : "Task Created",
        event_type : "ui handler",
        event_status : "success",
        event_datetime : new Date(),
        description : `Task created with title : ${createdTaskResult.task_name}`
      }, {transaction}) 
      await CaseHistory.create({
        created_by : data.created_by,
        created_datetime : new Date(),
        case_rid : data.case_rid,
        task_rid : createdTaskResult.dataValues.rid,
        attribute_name : "Task",
        old_value : "CREATE",
        new_value : `added a task ${createdTaskResult.task_name}`
      })
      return {
        statusCode : HttpStatus.SUCCESS,
        data : createdTaskResult
      }
    } else {
      return {
        statusCode : HttpStatus.FAILED,
        data : {}
      }      
    }
  }

  async updateUserLevelTask (data : UpdateCaseTaskType, accountNumber : string, transaction : Transaction, activeStatusRid : string) {
    if(!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize()
    }
    const {CaseTask, CaseTimeline, CaseHistory, TaskCollaborators, TaskSummary, CheckList, CheckListItem} = await this.caseModelService.getModels(accountNumber);
    const checkCaseExists = await this.isCaseExistsForAccount(data.account_rid, data.case_rid, accountNumber);
    if(!checkCaseExists) {
      return {
        statusCode : HttpStatus.BAD_REQUEST,
        statusMessage : STATUS_MESSAGE.caseNotFound
      } 
    } else {
      const isTaskExists : any = await this.findTaskById(data.rid, data.account_rid, data.case_rid, accountNumber,"milestone");
      if(!isTaskExists) {
        return {
          statusCode : HttpStatus.BAD_REQUEST,
          statusMessage : STATUS_MESSAGE.taskNotFound
        } 
      } else {
        if(isTaskExists.task_status_rid !== data.task_status_rid) {
          const workflowResult = await this.checkTaskWorkFlow(accountNumber, data.rid, data.task_status_rid);
          if(workflowResult?.success) {
            return {
              statusCode : HttpStatus.BAD_REQUEST,
              statusMessage : workflowResult.statusMessage
            } 
          }
        }
        if(data.assigned_to !== null && data.assigned_to !== '' && data.assigned_to !== undefined) {
          if(data.assigned_to !== isTaskExists.assigned_to) {
            const findUserRoleId = await this.fetchAssignedToRole(data.assigned_to, data.case_rid, data.account_rid,accountNumber);
            data.case_team_member_role_rid = findUserRoleId?.role_rid!
          }
        }
        const [updatedResult] = await CaseTask.update(data, {
          where : {
            rid : data.rid,
            account_rid : data.account_rid,
            case_rid : data.case_rid
          }, transaction
        });
        if(data?.checklist_template_rid) 
      {
        if(data.checklist_template_rid !== isTaskExists.checklist_template_rid) {
          if(isTaskExists.checklist_template_rid !== null && isTaskExists.checklist_template_rid !== '') {
            const checklistResult = await CheckList.findOne({
            where : {
              attach_to : data.rid,
              case_rid : data.case_rid,
              attachment_level : 'task',
              checklist_template_rid : isTaskExists.checklist_template_rid
            }, raw : true
          })
          if(checklistResult) {
            await CheckListItem.destroy({
              where : {
                checklist_rid : checklistResult.rid
              }
            })
            await CheckList.destroy({
              where : {
                attach_to : data.rid,
                case_rid : data.case_rid,
                attachment_level : 'task',
                checklist_template_rid : isTaskExists.checklist_template_rid
              }
            })
            }
          }
          const response  = await this.fetchChecklistTemplateDetailsById(data.checklist_template_rid);
          response.checklist_items.map((item:any) => item.action_type  = 'add');
          let caseRequest : any = {
            account_rid: data.account_rid!,
            checklist_name: response.checklist_name,
            checklist_description: response.description,  
            checklist_items: response.checklist_items,
            attach_to: data.rid,
            attachment_level: 'task',
            created_by: data.modified_by,
            created_datetime: new Date(),
            fiscal_year: checkCaseExists.fiscal_year,
            checklist_rid: data.checklist_template_rid,
            case_rid : data.case_rid
          };
          const checklistResponse = await this.createCheckListForTask(accountNumber, caseRequest, transaction);
          if(checklistResponse)
            await this.manageCheckListItems(accountNumber,caseRequest,checklistResponse.rid, transaction);
          }
      }
       /* await TaskSummary.update(
        {
          task_name: data.task_name || "",
          description: data.task_description || "",
          assigned_to: data.assigned_to || "",
          status_rid: data.task_status_rid || "",
          priority_rid: data.priority_rid || "",
          effective_start_datetime: data.effective_start_datetime,
          effective_end_datetime: data.effective_end_datetime,
          modified_by: data.modified_by || "",
          modified_datetime: new Date(),
        },
        {
        where : {
            task_rid : data.rid
          }
      }
      ); */
        const checkIsDifferentCollaborator = await this.isNewCollaborator(data.modified_by, accountNumber,"case_task", data.case_rid, data.rid);
        if(!checkIsDifferentCollaborator) {
          const checkCollaboratorExists = await this.isCollaboratorAlreadyAdded(data.modified_by, data.case_rid, data.account_rid, data.rid, accountNumber,"case_task");
          if(!checkCollaboratorExists) {
            await TaskCollaborators.create({
              case_rid : data.case_rid,
              account_rid : data.account_rid,
              task_rid : data.rid,
              assigned_to : data.modified_by,
              created_by : data.modified_by,
              created_datetime : new Date()
            }, {transaction});
          }
        }
        if(updatedResult == 1) {
          if(data.tags.length > 0) {
            for(let d of data.tags) {
            await this.createOrUpdateTags(isTaskExists.rid, data.account_rid, data?.case_rid, d.tag_rid, d.is_new_tag, accountNumber, data.modified_by, activeStatusRid)
            }
          }
          if(Object.keys(data.workflow_connector).length > 0) {
            data.workflow_connector.created_by = data.modified_by
            data.workflow_connector.case_rid = data.case_rid
            data.workflow_connector.account_rid = data.account_rid
            if(data.workflow_connector.target_rid !== undefined && data.workflow_connector.is_new_changes) {
              if(data.workflow_connector.target_rid.length > 0)
                await this.taskWorkflowConnector(accountNumber, data.workflow_connector, transaction);
            }
            if(data.workflow_connector.delete_target_rids !== undefined) {
              if(data.workflow_connector.delete_target_rids.length > 0 && data.workflow_connector.is_new_changes) {
                data.workflow_connector.source_rid = data.rid
                await this.deleteTaskWorkConnector(accountNumber, data.workflow_connector)
              }
            }
            if(data.workflow_connector.is_new_changes) {
              await CaseTimeline.create({
                created_by : data.modified_by,
                created_datetime : new Date(),
                account_rid : data.account_rid,
                entity_rid : data.case_rid,
                event_name : 
                `Case Task Workflow Connector updated`,
                event_type : "ui handler",
                event_status : "success",
                event_datetime : new Date(),
                description : `Case Task Workflow Connector updated`
              }, {transaction});
              await CaseHistory.create({
                created_by : data.modified_by,
                created_datetime : new Date(),
                case_rid : data.case_rid,
                attribute_name : "Linked Items",
                old_value : "CREATE",
                new_value : `updated a linked task type`,
                task_rid : data.rid
              }, {transaction});
            }
          }
          const fetchUpdatedColumns = getColumnsNamesForTaskUpdate(data, isTaskExists as any);
          if(fetchUpdatedColumns.length > 0) {
            let updatedColumnsStorage : string[] = []
            let oldValue : string;
            let newValue : string;
            let columnName : string;
            let combinedColumns : string = ``
            let columnMapping : Map<string, string> = new Map()
            let newValueString;
            let oldValueString;
            let labelName;
            for(let c of fetchUpdatedColumns) {
              oldValue = (isTaskExists as any)[c]
              newValue = (data as any)[c]
              columnName = c
              
              if(columnName == "assigned_to") {
                labelName = "Assigned To"
                const result : any = await this.mainDbSequelize.query(rawQueries.fetchUserNames(oldValue, newValue))
                for(let r of result[0]) {
                  columnMapping.set(r.rid, r.name)
                }
                oldValueString = columnMapping.get(oldValue)
                newValueString = columnMapping.get(newValue)
              }
              else if(columnName === "checklist_template_rid") {
                labelName = "Checklist"
                const result : any = await this.mainDbSequelize.query(rawQueries.fetchCheckLists(oldValue, newValue));
                for(let r of result[0]) {
                  columnMapping.set(r.rid, r.checklist_name)
                }
                oldValueString = columnMapping.get(oldValue)
                newValueString = columnMapping.get(newValue)
              }
              else if(columnName === "priority_rid") {
                labelName = "Priority"
                const result : any = await this.mainDbSequelize.query(rawQueries.fetchPriority(oldValue, newValue));
                for(let r of result[0]) {
                  columnMapping.set(r.rid, r.priority_name)
                }
                oldValueString = columnMapping.get(oldValue)
                newValueString = columnMapping.get(newValue)
              }
              else if(columnName === "task_status_rid") {
                labelName = "Status"
                const result : any = await this.mainDbSequelize.query(rawQueries.fetchTaskStatus(oldValue, newValue));
                for(let r of result[0]) {
                  columnMapping.set(r.rid, r.task_status_name)
                }
                oldValueString = columnMapping.get(oldValue)
                newValueString = columnMapping.get(newValue)
              } 
              else if(columnName === "weightage_rid") {
                labelName = "Weightage"
                const result : any = await this.mainDbSequelize.query(rawQueries.fetchTaskWeightage(oldValue, newValue));
                for(let r of result[0]) {
                  columnMapping.set(r.rid, r.weightage_value)
                }
                oldValueString = columnMapping.get(oldValue)
                newValueString = columnMapping.get(newValue)
              }
              else if(columnName === "task_category_rid") {
                labelName = "Task Category"
                const result : any = await this.mainDbSequelize.query(rawQueries.fetchTaskCategory(oldValue, newValue));
                for(let r of result[0]) {
                  columnMapping.set(r.rid, r.category_name)
                }
                oldValueString = columnMapping.get(oldValue)
                newValueString = columnMapping.get(newValue)
              }
              else {
                if(c === 'task_name') labelName = "Task Name"
                if(c === 'task_description') labelName = "Task Description"
                if(c === 'effective_start_datetime') labelName = "Start Date"
                if(c === 'effective_end_datetime') labelName = "Due Date"
                oldValueString = oldValue
                newValueString = newValue
              }
              await CaseHistory.create({
                created_by : data.modified_by,
                created_datetime : new Date(),
                case_rid : data.case_rid,
                attribute_name : labelName!,
                old_value : oldValueString,
                new_value : newValueString,
                task_rid : data.rid
              })
              updatedColumnsStorage.push(`${oldValue} changed to ${newValue}`);
            }
            if(updatedColumnsStorage.length > 0) {
              combinedColumns = updatedColumnsStorage.join(', ')
            }
            await CaseTimeline.create({
              created_by : data.modified_by,
              created_datetime : new Date(),
              account_rid : data.account_rid,
              entity_rid : data.case_rid,
              event_name : "Task Updated",
              event_type : "ui handler",
              event_status : "success",
              event_datetime : new Date(),
              description : `Task Updated : ${combinedColumns}`
            })
          }
          
          return {
            statusCode : HttpStatus.SUCCESS,
            statusMessage : STATUS_MESSAGE.taskUpdatedSuccess
          } 
        } else {
          return {
            statusCode : HttpStatus.FAILED,
            statusMessage : STATUS_MESSAGE.taskUpdateFailed
          } 
        }
      }
    }
  }


  async fetchSequenceOrder (milestone_template_rid : string, accountNumber : string) {
    const { CaseTask } = await this.caseModelService.getModels(accountNumber);
    const findSequenceOrder = await CaseTask.findAll({
      attributes : ['sequence_no'],
      where : {
        milestone_template_rid : milestone_template_rid
      },
      order : [['created_datetime', 'DESC']],
      raw : true
    })
    return findSequenceOrder;
  }
  async findTaskById (rid : string, accountRid : string, caseRid : string , accountNumber : string,taskType? : string) {
    const { CaseTask ,Activities} = await this.caseModelService.getModels(accountNumber);
    if(taskType === "activity")
      {
        const checkTaskExists = await Activities.findOne({
        where : {
        rid : rid,
        account_rid : accountRid,
        }, 
        raw : true
      })
      if(checkTaskExists) return checkTaskExists
      else return null
      }
    else
    {
      const checkTaskExists = await CaseTask.findOne({
      where : {
        rid : rid,
        account_rid : accountRid,
        case_rid : caseRid
      }, 
      raw : true
    })
    if(checkTaskExists) return checkTaskExists
    else return null

    }
    
  }
   async checkTaskExistsForUserLevelTask (data : any, taskTypeRid : string, accountNumber : string) {
    const { CaseTask } = await this.caseModelService.getModels(accountNumber)
    const checkTaskNameExists = await CaseTask.findOne({
      attributes : ['task_name'],
      where : {
        task_name : {
          [Op.iLike] : data.task_name
        },
        case_rid : data.case_rid,
        account_rid : data.account_rid,
        task_type_rid : taskTypeRid
      },raw : true
    })
    return checkTaskNameExists
  }
  async checkTaskNameExistsForUpdate (data : UpdateCaseTaskType, accountNumber : string, eid : string) {
    const { CaseTask } = await this.caseModelService.getModels(accountNumber)
    const checkTaskExists = await CaseTask.findOne({
      attributes : ['rid'],
      where : {
        task_name : {
          [Op.iLike] : data.task_name
        },
        eid : {
          [Op.notIn] : [eid]
        },
        account_rid : {
          [Op.in] : [data.account_rid ]
        },
        case_rid : {
          [Op.in] : [data.case_rid]
        }
      }, 
      raw : true
    })
    if(checkTaskExists) return checkTaskExists
    else return null
  }
  async fetchTaskForCases (page : number, limit : number, search : string, sort : string, sortBy : string, filter : FilterType, doSorting : boolean, caseRid : string, accountRid : string, schemaName : string, isExport : boolean) {
    if(!this.orgDbSequelize) {
      this.orgDbSequelize = await initOrgSequelize()
    }
    if(!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize()
    }
    const activeStatusId  : any = await this.mainDbSequelize.query(rawQueries.getActiveStatusId());
    const result = await this.orgDbSequelize.query<CaseTaskQueryType>(fetchCaseSpecificTaskQuery(page, limit, search, sort, sortBy, filter, doSorting, caseRid, accountRid, schemaName, isExport, activeStatusId[0][0].rid), {type : QueryTypes.SELECT});
    if(result.length > 0) {
      return result;
    } else {
      return []
    }
  }
  async isNewCollaborator (rid : string, accountNumber : string, taskType : string, caseRid? : string, taskRid? : string) {
    const {CaseTask, Activities} = await this.caseModelService.getModels(accountNumber);
    let result;
    if (taskType === 'activity') {
      result = await Activities.findOne({
        where: {
          assigned_to: rid
        },
        raw: true
      });
    } else {
      result = await CaseTask.findOne({
        where: {
          assigned_to: rid,
          case_rid : caseRid,
          rid : taskRid
        },
        raw: true
      });
    }
    if(result) return result;
    else return null
  }
  async isCollaboratorAlreadyAdded (assignedTo : string, caseRid : string, accountRid : string, taskRid : string, accountNumber : string, taskType : string) {
    const {TaskCollaborators} = await this.caseModelService.getModels(accountNumber);
    const whereClause: any = {
      assigned_to: assignedTo,
      account_rid: accountRid,
      task_rid: taskRid
    };
    if (taskType !== 'activity') {
      whereClause.case_rid = caseRid;
    }
    const result = await TaskCollaborators.findOne({
      where: whereClause,
      raw: true
    });
    if(result) return result;
    else return null;
  }
  async createOrUpdateTags (taskRid : string, accountRid : string, caseRid: string, tagRid : string, isNewTag : boolean, accountNumber : string, userId : string, activeStatusRid : string, taskType? : string) {
    const {Tags, TaskTag, CaseHistory, CaseTimeline} = await this.caseModelService.getModels(accountNumber)

    if(isNewTag) {
      const isTagExists = await Tags.findOne({
        where : {
          tag_name : {
            [Op.iLike] : tagRid
          }
        }, raw : true
      });
      if(!isTagExists) {
        const result = await Tags.create({
          tag_name : tagRid,
          created_by : userId,
          created_datetime : new Date(),
          status_rid : activeStatusRid
        })
        if(result) {
          const tagPayload: any = {
            task_rid: taskRid,
            account_rid: accountRid,
            tag_rid: result.dataValues.rid,
            created_by: userId,
            created_datetime: new Date()
          };
          if (taskType !== "activity") {
            tagPayload.case_rid = caseRid || "";
          }
          const finalResult = await TaskTag.create(tagPayload);
        if(finalResult) {
           if(taskType !== "activity")
        {
          await CaseTimeline.create({
            created_by : userId,
            created_datetime : new Date(),
            account_rid : accountRid,
            entity_rid : caseRid,
            event_name : `Tag added for Task`,
            event_type : "ui handler",
            event_status : "success",
            event_datetime : new Date(),
            description : `Tag added for task : ${result.tag_name}`
            
          })
          await CaseHistory.create({
            created_by : userId,
            created_datetime : new Date(),
            attribute_name : "Tags",
            old_value : `CREATE`,
            new_value : `added the following tags ${result.dataValues.tag_name}`,
            case_rid : caseRid,
            task_rid : taskRid
          });
        }
        else
        {
          await this.addTaskTimeline(accountNumber, taskRid, accountRid, `Tag added for task : ${result.tag_name}`, userId, "Tag added for Task", "success", taskRid);
          await TaskHistory.create({
            task_rid : taskRid,
            created_by : userId,
            created_datetime : new Date(),
            attribute_name : "Tags",
            new_value : result.tag_name
          })
        }
          return {
            statusCode : HttpStatus.SUCCESS,
            data : finalResult
          }
        } else {
          return {
            statusCode : HttpStatus.FAILED,
            data : null
          }
        }
      } 
      else {
        return {
            statusCode : HttpStatus.FAILED,
            data : null
          }
        }
      } else {
        return {
            statusCode : HttpStatus.FAILED,
            data : STATUS_MESSAGE.tagMappedAlready
        } 
      }
    } 
    else {
      const tagDetails = await Tags.findOne({where : {rid : tagRid}, raw : true})
      const isTagMapped = await this.isTagAlreadyMapped(accountNumber, taskRid, accountRid, caseRid, tagRid);
      if(!isTagMapped) {
        const finalResult = await TaskTag.create({
          task_rid : taskRid,
          account_rid : accountRid,
          case_rid : caseRid,
          tag_rid : tagRid,
          created_by : userId,
          created_datetime : new Date()
        })
        if(taskType !== "activity")
        {
          await CaseTimeline.create({
            created_by : userId,
            created_datetime : new Date(),
            account_rid : accountRid,
            entity_rid : caseRid,
            event_name : `Tag added for Task`,
            event_type : "ui handler",
            event_status : "success",
            event_datetime : new Date(),
            description : `Tag added for task : ${tagDetails!.tag_name}`
          })
          await CaseHistory.create({
            case_rid : caseRid,
            created_by : userId,
            created_datetime : new Date(),
            attribute_name : "tag_rid",
            new_value : tagDetails!.tag_name,
            task_rid : taskRid
          }) 
        }
       
        if(finalResult) {
          return {
            statusCode : HttpStatus.SUCCESS,
            data : finalResult
        } 
        } else {
          return {
            statusCode : HttpStatus.FAILED,
            data : null
        } 
        }
      } else {
        return {
            statusCode : HttpStatus.FAILED,
            data : STATUS_MESSAGE.tagMappedAlready
        } 
      }
    }
  }
  async fetchAllTags (data : TaskTag[]) {
    const {Tags} = await this.caseModelService.getModels("")
    if(data.length > 0) {
    const result = await Tags.findAll({
      where : {
        rid : {
          [Op.notIn] : data.map((d : any) => d.tag_rid)
        }
      },
      attributes : ['rid', 'tag_name'],
      order : [['tag_name', 'ASC']],
    })
    if(result.length > 0) return result
    else return []
    } else {
    const result = await Tags.findAll({
      attributes : ['rid', 'tag_name'],
      order : [['tag_name', 'ASC']],
    })
    if(result.length > 0) return result
    else return []
    }

  }
  async isTagAlreadyMapped (accountNumber : string, taskRid : string, accountRid : string, caseRid : string, tagRid : string) {
    const {TaskTag} = await this.caseModelService.getModels(accountNumber);
    const whereClause: any = {
      account_rid: accountRid,
      task_rid: taskRid,
      tag_rid: tagRid
    };
    if (caseRid) {
      whereClause.case_rid = caseRid;
    }
    const result = await TaskTag.findOne({
      where: whereClause,
      raw : true
    });
    if(result) return result;
    else return null;
  }
  async addComments (data : AddCommentsType, accountNumber : string,  taskNumber : string, files : Express.Multer.File[]) {
    const {TaskComments, CommentsAttachments, TaskAttachments, CaseTimeline, TaskCollaborators,Activities,TaskHistory} = await this.caseModelService.getModels(accountNumber);
    const commentPayload: any = {
      created_by: data.created_by,
      created_datetime: new Date(),
      account_rid: data.account_rid,
      task_rid: data.task_rid,
      comments: data.comments
    };
    if (data.task_type !== 'activity') {
      commentPayload.case_rid = data.case_rid;
    }
    const createComments = await TaskComments.create(commentPayload);
    if(createComments) {
      const checkIsDifferentCollaborator = await this.isNewCollaborator(data.created_by, accountNumber,data.task_type, data.case_rid, data.task_rid);
      if(!checkIsDifferentCollaborator) {
        const checkCollaboratorExists = await this.isCollaboratorAlreadyAdded(data.created_by, data.case_rid, data.account_rid, data.task_rid, accountNumber,data.task_type);
        if(!checkCollaboratorExists) {
          const collaboratorPayload: any = {
            account_rid: data.account_rid,
            task_rid: data.task_rid,
            assigned_to: data.created_by,
            created_by: data.created_by,
            created_datetime: new Date()
          };
          if (data.task_type !== 'activity') {
            collaboratorPayload.case_rid = data.case_rid;
          }
          await TaskCollaborators.create(collaboratorPayload);
        }
      }
      if(files.length > 0) {
        for(let f of files) {
          const uploadFile = await uploadToAzureBlob(f, data.account_rid, taskNumber, "cases");
          if(uploadFile) {
            const commentsAttachmentPayload: any = {
              created_by: data.created_by,
              created_datetime: new Date(),
              account_rid: data.account_rid,
              task_rid: data.task_rid,
              comments_rid: createComments.dataValues.rid,
              browse_file: uploadFile.url,
              size: uploadFile.size.toString(),
              format: uploadFile.extension,
              document_name: uploadFile.name,
              is_file_deleted: false
            };
            if (data.task_type !== 'activity') {
              commentsAttachmentPayload.case_rid = data.case_rid;
            }
            await CommentsAttachments.create(commentsAttachmentPayload);

            const taskAttachmentPayload: any = {
              created_by: data.created_by,
              created_datetime: new Date(),
              account_rid: data.account_rid,
              task_rid: data.task_rid,
              browse_file: uploadFile.url,
              size: uploadFile.size.toString(),
              format: uploadFile.extension,
              document_name: uploadFile.name,
              is_file_deleted: false,
              comments_rid: createComments.dataValues.rid
            };
            if (data.task_type !== 'activity') {
              taskAttachmentPayload.case_rid = data.case_rid;
            }
            await TaskAttachments.create(taskAttachmentPayload);

            const caseHistoryPayload: any = {
              created_by: data.created_by,
              created_datetime: new Date(),
              attribute_name: "comments_attachments",
              old_value : "CREATE",
              new_value: "added a comment with attachment",
              task_rid: data.task_rid,
            };
            if (data.task_type !== 'activity') {
              caseHistoryPayload.case_rid = data.case_rid;
               await CaseHistory.create(caseHistoryPayload);
            }
            else
             await TaskHistory.create(caseHistoryPayload);
          }
        }
      }
      if (data.task_type !== 'activity') {
      await CaseTimeline.create({
        created_by : data.created_by,
        created_datetime : new Date(),
        account_rid : data.account_rid,
        entity_rid : data.case_rid,
        event_name : "Task Comments Created",
        event_type : "ui handler",
        event_status : "success",
        event_datetime : new Date(),
        description : `Task Comments : ${createComments.comments}`
      }) 
    }
    else
    {
      this.addTaskTimeline(
        accountNumber,
        createComments.dataValues.rid,
        data.account_rid,
        `Task Comments : ${createComments.comments}`,
        data.created_by,
       "Task Comments Created",
        "success",
       data.task_rid
      )
    } 
      return {
        statusCode : HttpStatus.SUCCESS,
        statusMessage : STATUS_MESSAGE.commentsAddedSuccess,
        data : createComments
      }
    } else {
      return {
        statusCode : HttpStatus.FAILED,
        statusMessage : STATUS_MESSAGE.commentsFailed,
        data : null
      }
    }
  }

  async updateComments (data : UpdateCommentsType, accountNumber : string,  taskNumber : string, files : Express.Multer.File[]) {
    const {TaskComments, CommentsAttachments, TaskAttachments, TaskCollaborators, CaseHistory, CaseTimeline,TaskHistory} = await this.caseModelService.getModels(accountNumber);
    const isCommentExists = await TaskComments.findOne({
      where : {
        rid : data.rid
      }
    })
    if(isCommentExists) {
      const [updateComments] = await TaskComments.update(data, {
        where : {
          rid : data.rid
        }
      });
      if(updateComments === 1) {
        if(data.task_type !== 'activity'){
        await CaseHistory.create({
        created_by : data.modified_by,
        created_datetime : new Date(),
        case_rid : data.case_rid,
        task_rid : data.task_rid,
        attribute_name : "Comments",
        old_value : isCommentExists.comments,
        new_value : data.comments
      })
    }
        const checkIsDifferentCollaborator = await this.isNewCollaborator(data.modified_by, accountNumber, data.task_type || 'case_task', data.case_rid, data.task_rid);
        if(!checkIsDifferentCollaborator) {
          const checkCollaboratorExists = await this.isCollaboratorAlreadyAdded(data.modified_by, data.case_rid, data.account_rid, data.task_rid, accountNumber,data.task_type);
          if(!checkCollaboratorExists) {
            const collaboratorPayload: any = {
              account_rid: data.account_rid,
              task_rid: data.task_rid,
              assigned_to: data.modified_by,
              created_by: data.modified_by,
              created_datetime: new Date()
            };
            if (data.task_type !== 'activity') {
              collaboratorPayload.case_rid = data.case_rid;
            }
            await TaskCollaborators.create(collaboratorPayload);
          }
        }
        if(files.length > 0) {
          for(let f of files) {
            const uploadFile = await uploadToAzureBlob(f, data.account_rid, taskNumber, "cases");
            if(uploadFile) {
              const commentsAttachmentPayload: any = {
                created_by: data.modified_by,
                created_datetime: new Date(),
                account_rid: data.account_rid,
                task_rid: data.task_rid,
                comments_rid: data.rid,
                browse_file: uploadFile.url,
                size: uploadFile.size.toString(),
                format: uploadFile.extension,
                document_name: uploadFile.name,
                is_file_deleted: false
              };
              const taskAttachmentPayload: any = {
                created_by: data.modified_by,
                created_datetime: new Date(),
                account_rid: data.account_rid,
                task_rid: data.task_rid,
                browse_file: uploadFile.url,
                size: uploadFile.size.toString(),
                format: uploadFile.extension,
                document_name: uploadFile.name,
                is_file_deleted: false,
                comments_rid: data.rid
              };
              const caseHistoryPayload: any = {
                created_by: data.modified_by,
                created_datetime: new Date(),
                attribute_name: "comments_attachments",
                old_value : "CREATE",
                new_value: "added an attachment",
                task_rid: data.task_rid
              };
              if (data.task_type !== 'activity') {
                commentsAttachmentPayload.case_rid = data.case_rid;
                taskAttachmentPayload.case_rid = data.case_rid;
                caseHistoryPayload.case_rid = data.case_rid;
                await CaseHistory.create(caseHistoryPayload);
              }
              else
              {
                await TaskHistory.create(caseHistoryPayload)
              }
              await CommentsAttachments.create(commentsAttachmentPayload);
              await TaskAttachments.create(taskAttachmentPayload);
              
            }
          }
        } else {
          if(data.deleted_file_ids.length > 0) {
            for(let id of data.deleted_file_ids) {
              const fetchCommentsAttachmentDetails = await CommentsAttachments.findOne({
                where : {
                  rid : id
                }, raw : true
              });
              if(fetchCommentsAttachmentDetails) {
                await deleteFromAzureBlob(fetchCommentsAttachmentDetails.browse_file);
                const [commentsAttachmentRes] = await CommentsAttachments.update({is_file_deleted : true},{where : {rid : id}})
                if(commentsAttachmentRes === 1) {
                  await TaskAttachments.update({is_file_deleted : true},{
                    where : {
                      browse_file : fetchCommentsAttachmentDetails.browse_file,
                      is_file_deleted : false,
                    }
                  })
                  if(data.task_type !== 'activity')
                    {
                        await this.addTaskTimeline(
                          accountNumber,
                          fetchCommentsAttachmentDetails.rid,
                          data.account_rid,
                          `Task Comments : ${fetchCommentsAttachmentDetails.document_name}`,
                          data.modified_by,
                         "Task Comments Attachments deleted",
                          "success",
                         data.task_rid
                        )
                        await CaseHistory.create({
                          created_by: data.modified_by,
                          created_datetime: new Date(),
                          attribute_name: "comments_attachments",
                          old_value : "CREATE",
                          new_value: "deleted an attachment in comment",
                          task_rid: data.task_rid,
                          case_rid : data.case_rid
                        })
                    }
                  else
                  {
                     await CaseTimeline.create({
                    created_by : data.modified_by,
                    created_datetime : new Date(),
                    account_rid : data.account_rid,
                    entity_rid : data.case_rid,
                    event_name : "Task Comments Attachments deleted",
                    event_type : "ui handler",
                    event_status : "success",
                    event_datetime : new Date(),
                    description : `Task Comments : ${fetchCommentsAttachmentDetails.document_name}`
                  }) 

                  }
                 
                }
              }
            }
          }
        }
        const fetchUpdatedColumns = getColumnsNamesForTaskCommentsUpdate(data, isCommentExists);
          if(fetchUpdatedColumns.length > 0) {
            let updatedColumnsStorage : string[] = []
            let oldValue : string;
            let newValue : string;
            let columnName : string;
            let combinedColumns : string = ``
            for(let c of fetchUpdatedColumns) {
              oldValue = (isCommentExists as any)[c]
              newValue = (data as any)[c]
              columnName = c
              
              const historyPayload: any = {
                created_by: data.modified_by,
                created_datetime: new Date(),
                attribute_name: columnName,
                old_value: oldValue,
                new_value: newValue,
                task_rid: data.task_rid
              };
              if (data.task_type !== 'activity') {
                historyPayload.case_rid = data.case_rid;
                 await CaseHistory.create(historyPayload);
              }
              else
              {
                await TaskHistory.create(historyPayload);
              }
             
              
              updatedColumnsStorage.push(`${oldValue} changed to ${newValue}`);
            }
            if(updatedColumnsStorage.length > 0) {
              combinedColumns = updatedColumnsStorage.join(', ')
            }
            if(data.task_type !== 'activity')
            {
            await CaseTimeline.create({
              created_by : data.modified_by,
              created_datetime : new Date(),
              account_rid : data.account_rid,
              entity_rid : data.case_rid,
              event_name : "Task Comments Updated",
              event_type : "ui handler",
              event_status : "success",
              event_datetime : new Date(),
              description : `Task Comments Updated : ${combinedColumns}`
            })
          }
          else
          {
            await this.addTaskTimeline(
              accountNumber,
              data.rid,
              data.account_rid,
              `Task Comments Updated : ${combinedColumns}`,
              data.modified_by,
             "Task Comments Updated",
              "success",
             data.task_rid
            )
          }
          }
        return {
          statusCode : HttpStatus.SUCCESS,
          statusMessage : STATUS_MESSAGE.commentsUpdatedSuccess,
        }
      } else {
        return {
          statusCode : HttpStatus.FAILED,
          statusMessage : STATUS_MESSAGE.commentsFailedUpdate,
        }
      }
    }
  }

    async addTaskTimeline(
      accountNumber: string,
      entity_rid: string,
      accountRid: string,
      description: string,
      userId: string,
      eventName: string,
      eventStatus: string,
      taskRid: string = ""
    ) {
      try {
        const {Activities} = await this.caseModelService.getModels(
          accountNumber
        );
        const entityresponse:any = await Activities.findOne({
          where: { rid: taskRid },
          raw: true,
        });
      if(!entityresponse) {
        logMessage(`No entity found for rid: ${taskRid}`);
        return;
      }
      else {
        const attachmentLevel = entityresponse?.attachment_level || "case";
        if(!this.orgDbSequelize) {
            this.orgDbSequelize = await this.caseModelService.getSequelize();
          }
          const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
            /\D/g,
            ""
          )}`;
          let insertQuery = "";
        if (attachmentLevel === "case") {
          /*const { CaseTimeline } = await this.caseModelService.getModels(
            accountNumber
          );
          console.log("Adding case timeline...", entity_rid, accountRid, userId);
          await CaseTimeline.create({
            account_rid: accountRid,
            event_name: eventName,
            event_status: eventStatus,
            event_type: "ui handler",
            entity_rid: entity_rid || "",
            description: description,
            created_by: userId,
            event_datetime: new Date(),
            created_datetime: new Date(),
          }); */
            insertQuery = rawQueries.insertTimeline(schemaName,"case_timeline");
        }
        else if(attachmentLevel === "project") {
           insertQuery = rawQueries.insertTimeline(schemaName,"project_timeline");
        }
        else if(attachmentLevel === "project_resource") {
           insertQuery = rawQueries.insertTimeline(schemaName,"project_resource_timeline");
        }
        else if(attachmentLevel === "project_task") {
           insertQuery = rawQueries.insertTimeline(schemaName,"project_task_timeline");
        }
        else if(attachmentLevel === "resource") {
           insertQuery = rawQueries.insertTimeline(schemaName,"resource_timeline");
        }
        else {
          insertQuery = rawQueries.insertTimeline(schemaName,"account_timeline");
        }
  
  
          await this.orgDbSequelize.query(insertQuery, {
            type: QueryTypes.INSERT,
            replacements: {
              event_name: eventName,
              event_status: eventStatus,
              event_type: "ui handler",
              entity_rid: entity_rid || "",
              description: description,
              created_by: userId,
              event_datetime: new Date(),
              created_datetime: new Date()
            }
          });
        }
      } catch (err) {
        logMessage(`Error creating case team timeline: ${err}`);
      }
    }

  async deleteComments (data : DeleteCommentsType, accountNumber : string) {
      const {TaskComments, CommentsAttachments, TaskAttachments} = await this.caseModelService.getModels(accountNumber);
      const isCommentExists = await TaskComments.findOne({
        where : {
          rid : data.rid
        }
      })
      if(isCommentExists) {
        if(data.deleted_file_ids.length > 0) {
          for(let id of data.deleted_file_ids) {
            const fetchCommentsAttachmentDetails = await CommentsAttachments.findOne({
              where : {
                rid : id
              }, raw : true
            });
            if(fetchCommentsAttachmentDetails) {
              await deleteFromAzureBlob(fetchCommentsAttachmentDetails.browse_file);
              const [deleteCommentsAttachRes] = await CommentsAttachments.update({is_file_deleted : true},{where : {rid : id}})
              if(deleteCommentsAttachRes === 1) {
                await TaskAttachments.update({is_file_deleted : true},{
                  where : {
                    browse_file : fetchCommentsAttachmentDetails.browse_file,
                    is_file_deleted : false
                  },
                })
                if(data.task_type !== 'activity')
                {
                  await CaseTimeline.create({
                  created_by : data.modified_by,
                  created_datetime : new Date(),
                  account_rid : data.account_rid,
                  entity_rid : data.case_rid,
                  event_name : "Task Comments Attachments deleted",
                  event_type : "ui handler",
                  event_status : "success",
                  event_datetime : new Date(),
                  description : `Task Comments : ${fetchCommentsAttachmentDetails.document_name}`
                })

                }
                else
                {
                  await this.addTaskTimeline(
                    accountNumber,
                    fetchCommentsAttachmentDetails.rid,
                    data.account_rid,
                    `Task Comments : ${fetchCommentsAttachmentDetails.document_name}`,
                    data.modified_by,
                   "Task Comments Attachments deleted",
                    "success",
                   data.task_rid
                  )
                }
                
              } 
            }
          }
        } else {
          let whereClause: any = {
            account_rid: data.account_rid,
            task_rid: data.task_rid,
            comments_rid: data.rid
          };
          if (data.task_type !== 'activity') {
            whereClause.case_rid = data.case_rid;
          }
          const fetchCommentsAttachmentDetails = await CommentsAttachments.findAll({
            where: whereClause,
            raw: true
          });
          if(fetchCommentsAttachmentDetails.length > 0) {
            for(let d of fetchCommentsAttachmentDetails) {
              await deleteFromAzureBlob(d.browse_file);
              const [deleteCommentsAttach] = await CommentsAttachments.update({is_file_deleted : true},{where : {rid : d.rid}})
              if(deleteCommentsAttach == 1) {
                await TaskAttachments.update({is_file_deleted : true},{
                where : {
                  browse_file : d.browse_file,
                  is_file_deleted : false
                }
              })
              if(data.task_type !== 'activity')
                {
              await CaseTimeline.create({
                created_by : data.modified_by,
                created_datetime : new Date(),
                account_rid : data.account_rid,
                entity_rid : data.case_rid,
                event_name : "Task Comments Attachments deleted",
                event_type : "ui handler",
                event_status : "success",
                event_datetime : new Date(),
                description : `Task Comments : ${d.document_name}`
              }) 
            }
              else
              {
                  await this.addTaskTimeline(
                     accountNumber,
                    d.rid,
                    data.account_rid,
                   `Task Comments : ${d.document_name}`,
                    data.modified_by,
                   "Task Comments Attachments deleted",
                    "success",
                   data.task_rid
                  )
              }
            }
          }
        }
        if(data.task_type !== 'activity'){
        await CaseTimeline.create({
          created_by : data.modified_by,
          created_datetime : new Date(),
          account_rid : data.account_rid,
          entity_rid : data.case_rid,
          event_name : "Task Comment Deleted",
          event_type : "ui handler",
          event_status : "success",
          event_datetime : new Date(),
          description : `Task Comments Deleted : ${isCommentExists.comments}`
          })
        }
        else
        {
           await this.addTaskTimeline(
                    accountNumber,
                    data.rid,
                    data.account_rid,
                   `Task Comments Deleted : ${isCommentExists.comments}`,
                    data.modified_by,
                   "Task Comments  deleted",
                    "success",
                   data.task_rid
                  )

        }
        const deleteComments = await TaskComments.destroy({ where : {rid : data.rid}});
        if(deleteComments === 1) {
        const checkIsDifferentCollaborator = await this.isNewCollaborator(data.modified_by, accountNumber,data.task_type || 'case_task', data.case_rid, data.task_rid);
        if(!checkIsDifferentCollaborator) {
          const checkCollaboratorExists = await this.isCollaboratorAlreadyAdded(data.modified_by, data.case_rid, data.account_rid, data.task_rid, accountNumber,data.task_type);
          if(!checkCollaboratorExists) {
                const collaboratorPayload: any = {
                  account_rid: data.account_rid,
                  task_rid: data.task_rid,
                  assigned_to: data.modified_by,
                  created_by: data.modified_by,
                  created_datetime: new Date()
                };
                if (data.task_type !== 'activity') {
                  collaboratorPayload.case_rid = data.case_rid;
                }
                await TaskCollaborators.create(collaboratorPayload);
          }
        }
        return {
          statusCode : HttpStatus.SUCCESS,
          statusMessage : STATUS_MESSAGE.commentsDeletedSuccess,
        }
      }
      else {
        return {
          statusCode : HttpStatus.FAILED,
          statusMessage : STATUS_MESSAGE.commentsFaileDDelete,
        }
        }
      }
    }  
    else {
      return {
        statusCode : HttpStatus.NOT_FOUND,
        statusMessage : STATUS_MESSAGE.dataNotAvailable,
      }
    }
  }

  async addAttachmentForTask (data : any, accountNumber : string, files : Express.Multer.File[], userId : string) {
    const {TaskAttachments,TaskHistory} = await this.caseModelService.getModels(accountNumber)
    const findTaskDetails = await this.findTaskById(data.task_rid, data.account_rid, data.case_rid, accountNumber,data.task_type || 'case_task');
    if(files != undefined) {
      if(Array.isArray(files)) {
        for(let f of files) {
          const uploadFile = await uploadToAzureBlob(f, data.account_rid, findTaskDetails?.r_number!, "cases");
          if(uploadFile) {
            const taskAttachmentPayload: any = {
              account_rid: data.account_rid,
              task_rid: data.task_rid,
              browse_file: uploadFile.url,
              document_name: uploadFile.name,
              size: uploadFile.size.toString(),
              format: uploadFile.extension,
              is_file_deleted: false,
              created_by: userId,
              created_datetime: new Date()
            };
            if (data.task_type !== 'activity') {
              taskAttachmentPayload.case_rid = data.case_rid;
            }
            // Only add case_rid if not activity
            const result = await TaskAttachments.create(taskAttachmentPayload);
            if(data.task_type !== 'activity')
            {
              await CaseTimeline.create({
              created_by : userId,
              created_datetime : new Date(),
              account_rid : data.account_rid,
              entity_rid : data.case_rid,
              event_name : `Attachment added for task ${findTaskDetails?.task_name}`,
              event_type : "ui handler",
              event_status : "success",
              event_datetime : new Date(),
              description : `Task Attachments Added : ${uploadFile.url}`
              })
              await CaseHistory.create({
              created_by : userId,
              created_datetime : new Date(),
              case_rid : data.case_rid,
              attribute_name : "task_attachments",
              new_value : uploadFile.url,
              task_rid : data.task_rid
            })
            }
            else
            {
              await this.addTaskTimeline(
                accountNumber,
                result.dataValues.rid,
                data.account_rid,
                `Task Attachments Added : ${uploadFile.url}`,
                userId,
               `Attachment added for task ${findTaskDetails?.task_name}`,
                "success",
               data.task_rid
              )
              await TaskHistory.create({
                created_by : userId,
                created_datetime : new Date(),
                attribute_name : "task_attachments",
                new_value : uploadFile.url,
                task_rid : data.task_rid
              })
            }
          }
        }
        return {
          statusCode : HttpStatus.SUCCESS,
          statusMessage : STATUS_MESSAGE.attachmentUploadedSuccess
        }
      }
    } return {
      statusCode : HttpStatus.FAILED,
      statusMessage : STATUS_MESSAGE.fileNotFound
    }
  }

  async deleteAttachment (accountNumber : string, data : any, userId : string) {
    const {TaskAttachments} = await this.caseModelService.getModels(accountNumber)
    const findTaskDetails = await this.findTaskById(data.task_rid, data.account_rid, data.case_rid, accountNumber,data.task_type || 'case_task');
    const checkIsFileExists = await TaskAttachments.findOne({
      where : {
        rid : data.rid,
        is_file_deleted : false
      }
    });
    if(checkIsFileExists) {
      await deleteFromAzureBlob(data.url);
      const [updateFile] = await TaskAttachments.update({is_file_deleted : true, modified_by : userId, modified_datetime : new Date()}, {where : {rid : data.rid}});
      if(updateFile === 1) {
        if(data.task_type !== 'activity')
        {
          await CaseTimeline.create({
          created_by : userId,
          created_datetime : new Date(),
          account_rid : data.account_rid,
          entity_rid : data.case_rid,
          event_name : `Attachment deleted for task ${findTaskDetails?.task_name}`,
          event_type : "ui handler",
          event_status : "success",
          event_datetime : new Date(),
          description : `Task Attachments Deleted : ${checkIsFileExists.document_name}`
        })
        }
        else
        {
          await this.addTaskTimeline(
            accountNumber,
            checkIsFileExists.rid,
            data.account_rid,
            `Task Attachments Deleted : ${checkIsFileExists.document_name}`,
            userId,
           `Attachment deleted for task ${findTaskDetails?.task_name}`,
            "success",
           data.task_rid
          )
        }
        
        return {
          statusCode : HttpStatus.SUCCESS,
          statusMessage : STATUS_MESSAGE.attachmentDeletedSuccess
        }
      } else {
        return {
          statusCode : HttpStatus.FAILED,
          statusMessage : STATUS_MESSAGE.attachmentDeleteFailed
        }
      }
    } else {
      return {
          statusCode : HttpStatus.NOT_FOUND,
          statusMessage : STATUS_MESSAGE.attachmentNotFound
       }
    }
  }

  async listTaskLevelAttachments (accountNumber : string, data : any) {
    if(!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize()
    }
    let offset = (data.page - 1) * data.limit;
    const {TaskAttachments} = await this.caseModelService.getModels(accountNumber)
    let whereClause: any = {
      account_rid: data.account_rid,
      task_rid: data.task_rid,
      is_file_deleted: false
    };
    if (data.task_type !== 'activity') {
      whereClause.case_rid = data.case_rid;
    }
    let fetchAllTaskAttachments = await TaskAttachments.findAll({
      where: whereClause,
      raw: true,
    });
    if(fetchAllTaskAttachments.length > 0) {
      const total = fetchAllTaskAttachments.length
      fetchAllTaskAttachments = fetchAllTaskAttachments.slice(offset, data.page * data.limit);
      const userIds = [...new Set(fetchAllTaskAttachments.map((d : any) => d.created_by))];
      const findUsers = await this.mainDbSequelize.query(rawQueries.getOwnerDetails(userIds));
      const userMap = new Map(findUsers[0].map((d : any) => [d.rid, d.name]));
      const structuredDate = await Promise.all(fetchAllTaskAttachments.map(async (d : any) => {
        return {
          ...d,
          created_by_name : userMap.get(d.created_by) || null,
          browse_file : await generateSasUrl(d.browse_file)
        }
      }))
      const finalData = {
        page : data.page,
        limit : data.limit,
        total_result : total,
        data : structuredDate
      }
      return {
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        data : finalData
      }
    } else {
      const finalData = {
        page : data.page,
        limit : data.limit,
        total_result : 0,
        data : []
      }
      return {
        statusCode : HttpStatus.NOT_FOUND,
        statusCodeValue : HttpStatus.NOT_FOUND_MESSAGE,
        data : finalData
      }
    }
  }
  async addCollaborators (data : any,accountNumber : string) {
    if(!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize()
    }
    const {TaskCollaborators, CaseHistory} = await this.caseModelService.getModels(accountNumber);
    const checkIsDifferentCollaborator = await this.isNewCollaborator(data.user_rid, accountNumber,data.task_type, data.case_rid, data.rid);
    if(!checkIsDifferentCollaborator) {
      const checkCollaboratorExists = await this.isCollaboratorAlreadyAdded(data.user_rid, data.case_rid, data.account_rid, data.rid, accountNumber,data.task_type);
      if(!checkCollaboratorExists) {
        const collaboratorPayload: any = {
          account_rid: data.account_rid,
          task_rid: data.rid,
          assigned_to: data.user_rid,
          created_by: data.created_by,
          created_datetime: new Date()
        };
        if (data.task_type !== 'activity') {
          collaboratorPayload.case_rid = data.case_rid;
          const findUser: any = await this.mainDbSequelize.query(rawQueries.getUserById(data.user_rid));
          await CaseHistory.create({
            created_by : data.created_by,
            created_datetime : new Date(),
            attribute_name : "Collaborator",
            old_value : `CREATE`,
            new_value : `added a collaborator ${findUser[0][0].name}`,
            case_rid : data.case_rid,
            task_rid : data.rid
          });
        }
        const result = await TaskCollaborators.create(collaboratorPayload);
        if(result) {
          return {
            statusCode : HttpStatus.SUCCESS,
            statusMessage : STATUS_MESSAGE.collaboratorsAddedSuccesss
          }
        } else {
          return {
            statusCode : HttpStatus.FAILED,
            statusMessage : STATUS_MESSAGE.collaboratorAddedFailed
          }
        }
      } else {
        return {
          statusCode : HttpStatus.BAD_REQUEST,
          statusMessage : STATUS_MESSAGE.collaboratorAlreadyAdded
        }
      }
    } 
    else {
      return {
        statusCode : HttpStatus.BAD_REQUEST,
        statusMessage : STATUS_MESSAGE.collaboratorAlreadyAdded
      }
    } 
  }
  async fetchCollaboratorsList (accountNumber : string, data : any) {
    const {TaskCollaborators} = await this.caseModelService.getModels(accountNumber);
    let whereClause: any = {
      account_rid: data.account_rid,
      task_rid: data.rid
    };
    if (data.task_type !== 'activity') {
      whereClause.case_rid = data.case_rid;
    }
    const result = await TaskCollaborators.findAll({
      attributes: ['assigned_to'],
      where: whereClause,
      raw: true
    });
    if(result.length > 0) return result;
    else return []
  }
  async taskWorkflowConnector (accountNumber : string, data : CaseTaskWorkFlowCreate, transaction : Transaction) {
    if(!this.orgDbSequelize) {
      this.orgDbSequelize = await initOrgSequelize();
    }
    const {CaseTaskWorkflowConnector, CaseTask, CaseTimeline, CaseHistory, WorkflowConnector} = await this.caseModelService.getModels(accountNumber);
    let taskIds : string[] = []
    let iterationCount : number = 0;
    let totalIteration = data.target_rid.length
    const workFlowConnectorData = await WorkflowConnector.findOne({
      where : {
        rid : data.relationship_connector_rid
      }, raw : true
    })
    const findExistingData = await CaseTaskWorkflowConnector.findOne({
      attributes : ['relationship_connector_rid', 'source_rid', 'target_rid'],
      where : {
        case_rid : data.case_rid,
        source_rid : data.source_rid
      }
    });
    if(findExistingData) {
      if(findExistingData.relationship_connector_rid !== data.relationship_connector_rid) {
        await CaseTaskWorkflowConnector.destroy({
          where : {
            case_rid : data.case_rid,
            source_rid : findExistingData.target_rid
          }
        })
        await CaseTaskWorkflowConnector.destroy({
          where : {
            case_rid : data.case_rid,
            source_rid : data.source_rid
          }
        })
      }
    }
    let workFlowConnectorDetails;
    let dynamicRelationTypeName : string = ``
    if(workFlowConnectorData) {
      if(workFlowConnectorData.relationship_type === 'Blocks') {
        dynamicRelationTypeName = relationshipTypes.isBlockedBy
      } else if (workFlowConnectorData.relationship_type === 'Enables') {
        dynamicRelationTypeName = relationshipTypes.isEnabledBy
      } else if (workFlowConnectorData.relationship_type === 'Is Enabled By') {
        dynamicRelationTypeName = relationshipTypes.enables
      } else if (workFlowConnectorData.relationship_type === 'Is Blocked By') {
        dynamicRelationTypeName = relationshipTypes.blocks
      }
    }
    workFlowConnectorDetails = await WorkflowConnector.findOne({where : {relationship_type : dynamicRelationTypeName}, raw : true})
    for(let d of data.target_rid) {
      iterationCount += 1
      if(workFlowConnectorData) {
        const checkIsAlreadyMapped = await CaseTaskWorkflowConnector.findOne({
          where : {
            case_rid : data.case_rid,
            account_rid : data.account_rid,
            source_rid : data.source_rid,
            target_rid : d,
            relationship_connector_rid : data.relationship_connector_rid
          }, raw : true
        });
        if(!checkIsAlreadyMapped) {
          const ids : any[] = []
          ids.push(data.relationship_connector_rid)
          ids.push(workFlowConnectorDetails!.rid)
          const result = await CaseTaskWorkflowConnector.create({
            created_by : data.created_by,
            created_datetime : new Date(),
            case_rid :data.case_rid,
            account_rid : data.account_rid,
            source_rid : data.source_rid,
            target_rid : d,
            relationship_connector_rid : data.relationship_connector_rid
          }, {transaction});
          if(result) {
            if(workFlowConnectorDetails) {
              const checkForMapping = await CaseTaskWorkflowConnector.findOne({
                where : {
                  case_rid : data.case_rid,
                  account_rid : data.account_rid,
                  source_rid : d,
                  target_rid : data.source_rid,
                  relationship_connector_rid : workFlowConnectorDetails.rid!
                }, raw : true
              });
              if(!checkForMapping) {
                await CaseTaskWorkflowConnector.create({
                  created_by : data.created_by,
                  created_datetime : new Date(),
                  case_rid :data.case_rid,
                  account_rid : data.account_rid,
                  source_rid : d,
                  target_rid : data.source_rid,
                  relationship_connector_rid : workFlowConnectorDetails.rid!
                }, {transaction});
              }
            }
          }
        }
    } 
    else 
      {
        return {
          statusCode : HttpStatus.NOT_FOUND,
          statusMessage : STATUS_MESSAGE.taskNotFound
      }
    }
  }
  if(iterationCount === totalIteration) {
    return {
      statusCode : HttpStatus.SUCCESS,
      statusMessage : STATUS_MESSAGE.workflowConnectorMappedSuccess
    }
  } else {
    return {
      statusCode : HttpStatus.FAILED,
      statusMessage : STATUS_MESSAGE.workflowConnectorMappedFailed
    }
  }
}

  async deleteTaskWorkConnector (accountNumber : string, data : CaseTaskWorkFlowCreate) {
    const {CaseTaskWorkflowConnector, CaseTimeline, WorkflowConnector, CaseTask} = await this.caseModelService.getModels(accountNumber);
    if(data.delete_target_rids.length > 0) {
      let workFlowConnectorDetails;
      let deletedId : string;
        let dynamicRelationTypeName : string = ``
        const workFlowConnectorData = await WorkflowConnector.findOne({
          where : {
            rid : data.relationship_connector_rid
          }, raw : true
        })
        if(workFlowConnectorData) {
          if(workFlowConnectorData.relationship_type === 'Blocks') {
            dynamicRelationTypeName = relationshipTypes.isBlockedBy
          } else if (workFlowConnectorData.relationship_type === 'Enables') {
            dynamicRelationTypeName = relationshipTypes.isEnabledBy
          } else if (workFlowConnectorData.relationship_type === 'Is Enabled By') {
            dynamicRelationTypeName = relationshipTypes.enables
          } else if (workFlowConnectorData.relationship_type === 'Is Blocked By') {
            dynamicRelationTypeName = relationshipTypes.blocks
          }
        }
        workFlowConnectorDetails = await WorkflowConnector.findOne({
            where : {
              relationship_type : dynamicRelationTypeName
            }, raw : true
          })
        const taskNames = await CaseTask.findAll({
          attributes : ['task_name'],
          where : {
            rid : {
              [Op.in] : data.delete_target_rids.map((d : any) => d)
            },
            case_rid : data.case_rid
          }, raw : true
        })
        let dynamicTask;
        if(taskNames.length === 1) dynamicTask = "task"
        else if(taskNames.length > 1) dynamicTask = "tasks"
        for(let d of data.delete_target_rids) {
          const checkDataExists = await CaseTaskWorkflowConnector.findOne({
            where : {
              source_rid : data.source_rid,
              target_rid : d,
              account_rid : data.account_rid,
              case_rid : data.case_rid,
              relationship_connector_rid : data.relationship_connector_rid
            }, raw : true
          });
          if(checkDataExists) {
            deletedId = checkDataExists.rid!
            if(workFlowConnectorDetails) {
              const deleteData = await CaseTaskWorkflowConnector.destroy({
                where : {
                  case_rid : data.case_rid,
                  account_rid : data.account_rid,
                  source_rid : checkDataExists.target_rid,
                  target_rid : checkDataExists.source_rid,
                  relationship_connector_rid : workFlowConnectorDetails.rid
                }
              });
              if(deleteData === 1) {
                await CaseTaskWorkflowConnector.destroy({
                  where : {
                    source_rid : data.source_rid,
                    target_rid : d,
                    account_rid : data.account_rid,
                    case_rid : data.case_rid,
                    relationship_connector_rid : data.relationship_connector_rid
                  }
                })
                await CaseTimeline.create({
                  created_by : data.created_by,
                  created_datetime : new Date(),
                  account_rid : data.account_rid,
                  entity_rid : data.case_rid,
                  event_name : 
                  `Case Task Workflow Connector deleted`,
                  event_type : "ui handler",
                  event_status : "success",
                  event_datetime : new Date(),
                  description : ``
                });
              } else {
                return {
                  statusCode : HttpStatus.FAILED,
                  statusMessage : STATUS_MESSAGE.workflowConnectorMappedDeletedFailed
                }
              }
            }
        } else {
          return {
            statusCode : HttpStatus.NOT_FOUND,
            statusMessage : STATUS_MESSAGE.dataNotAvailable
          }
        }
      }
      if(taskNames.length > 0) {
        await CaseHistory.create({
          created_by : data.created_by,
          created_datetime : new Date(),
          case_rid : data.case_rid,
          attribute_name : "Linked Items",
          old_value : "CREATE",
          new_value : `deleted the linked ${dynamicTask} ${taskNames.map((d : any) => d.task_name).join(',')}`,
          task_rid : data.source_rid
        });
        return {
          statusCode : HttpStatus.SUCCESS,
          statusMessage : STATUS_MESSAGE.workflowConnectorMappedDeleted
        }
      }
    }
  }
  async listTasksDropdownForAccountLevel (accountNumber : string, data : any) {
    const {CaseTask} = await this.caseModelService.getModels(accountNumber);
    const result = await CaseTask.findAll({
      attributes : ['rid', 'task_name'],
      where : {
        account_rid : data.account_rid,
        case_rid : data.case_rid,
        task_name : {
          [Op.iLike] : data.search == "" ? '%%' : `%${data.search}%`
        } 
      },
      raw : true,
      order : [['task_name', 'ASC']]
    });
    return result;
  }
  async fetchMappedTags (accountNumber : string, caseRid : string, accountRid : string, taskRid : string) {
    const {TaskTag} = await this.caseModelService.getModels(accountNumber);
    const result = await TaskTag.findAll({
      where : {
        account_rid : accountRid,
        case_rid : caseRid,
        task_rid : taskRid
      }, raw : true
    });
    return result
  }

  async deleteTags (accountNumber : string, caseRid : string, accountRid : string, taskRid : string, tagRid : string[], userId : string) {
    const {TaskTag, Tags} = await this.caseModelService.getModels(accountNumber);
    let responseMessage : string
    let dynamicTagName : string
    if(tagRid.length == 1) {
      responseMessage = STATUS_MESSAGE.tagDeletedSuccess
      dynamicTagName = "Tag"
    }
    else {
      responseMessage = STATUS_MESSAGE.multipleTagDeletedSuccess
      dynamicTagName = "Tags"
    }
    if(tagRid.length == 0) {
      return {
        statusCode : HttpStatus.BAD_REQUEST,
        statusMessage : STATUS_MESSAGE.tagRequired
      }
    }
    const findTagName = await Tags.findAll({
      attributes : ['tag_name'],
      where : {
        rid : {
          [Op.in] : tagRid.map((d : any) => d)
        }
      }, raw : true
    })
    const result = await TaskTag.destroy({
      where : {
        case_rid : caseRid,
        account_rid : accountRid,
        task_rid : taskRid,
        tag_rid : {
          [Op.in] : tagRid.map((d : any) => d)
        },
      }
    });
    if(result > 0) {
      if(findTagName.length > 0) {
        await CaseHistory.create({
          created_by : userId,
          created_datetime : new Date(),
          attribute_name : "Tags",
          old_value : `CREATE`,
          new_value : `deleted the following ${dynamicTagName} ${findTagName.map((d : any) => d.tag_name).join(' , ')}`,
          case_rid : caseRid,
          task_rid : taskRid
        });
      }
      return {
        statusCode : HttpStatus.SUCCESS,
        statusMessage : responseMessage
      }
    } else {
      return {
        statusCode : HttpStatus.FAILED,
        statusMessage : STATUS_MESSAGE.tagDeletionFailed
      }
    }
  }
  async deleteCollaborators (accountNumber : string, data : any) {
     if(!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize()
    }
    const {TaskCollaborators} = await this.caseModelService.getModels(accountNumber);
    const whereClause: any = {
      account_rid: data.account_rid,
      task_rid: data.rid,
      assigned_to: data.assigned_to
    };
    if (data.task_type !== 'activity') {
      whereClause.case_rid = data.case_rid;
      const findUser: any = await this.mainDbSequelize.query(rawQueries.getUserById(data.user_rid));
      await CaseHistory.create({
        created_by : data.created_by,
        created_datetime : new Date(),
        attribute_name : "Collaborator",
        old_value : `CREATE`,
        new_value : `deleted a collaborator ${findUser[0][0].name}`,
        case_rid : data.case_rid,
        task_rid : data.rid
      });
    }
    const result = await TaskCollaborators.destroy({
      where: whereClause
    });
    if(result > 0) {
      return {
        statusCode : HttpStatus.SUCCESS,
        statusMessage : STATUS_MESSAGE.collaboratorsRemovedSuccesss
      }
    } else {
      return {
        statusCode : HttpStatus.SUCCESS,
        statusMessage : STATUS_MESSAGE.collaboratorRemovedFailed
      }
    }
  }
  async checkTaskWorkFlow (accountNumber : string, taskRid : string, statusRid : string) {
    if(!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize()
    }
    const {CaseTaskWorkflowConnector} = await this.caseModelService.getModels(accountNumber);
    const findTaskDependency = await CaseTaskWorkflowConnector.findAll({
      where : {
        source_rid : taskRid
      }, raw : true
    });
    if(findTaskDependency.length > 0) {
      const result = await this.sourceTaskValidation(accountNumber, findTaskDependency, taskRid, statusRid);
      if(result?.success) {
        return {
          success : true,
          statusMessage : result.statusMessage 
        }
      }
      else {
        const findTargetTaskDependency = await CaseTaskWorkflowConnector.findAll({
            where : {
              target_rid : taskRid
            }, raw : true
          });
        if(findTaskDependency.length > 0) {
          const result = await this.targetTaskValidation(accountNumber, findTargetTaskDependency, taskRid, statusRid);
          if(result?.success) {
            return {
              success : true,
              statusMessage : result.statusMessage 
            }
          }
          else {
            return {
              success : false,
              statusMessage : null
            }
          } 
        }
      } 
    }
  }

  private async sourceTaskValidation (accountNumber : string, findTaskDependency: CaseTaskWorkflowConnector[], sourceRid : string, statusRid : string) {
    if(!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize()
    }
    const {WorkflowConnector, CaseTask} = await this.caseModelService.getModels(accountNumber);
    const relationIds = [...new Set(findTaskDependency.map((d : CaseTaskWorkflowConnector) => d.relationship_connector_rid))];
    const findRelationshipConnector = await WorkflowConnector.findAll({
      where : {
        rid : {
          [Op.in] : relationIds
        }
      }, raw : true
    });
    if(findRelationshipConnector.length > 0) {
      const mapRelationShip : Map<string, string> = new Map(findRelationshipConnector.map((d : any) => [d.rid, d.relationship_type]));
      const targetIds = [...new Set(findTaskDependency.map((d : CaseTaskWorkflowConnector) => d.target_rid))];
      targetIds.push(sourceRid)
      const findCaseTasks = await CaseTask.findAll({
        where : {
          rid : {
            [Op.in] : targetIds
          }
        }, raw : true
      });
      if(findCaseTasks.length > 0) {
        const mapTargetTasks : Map<string, CaseTask> = new Map(findCaseTasks.map((d : any) => [d.rid, d]));
        
        const taskStatusIds = [...new Set(findCaseTasks.map((d : any) => d.task_status_rid))];
        taskStatusIds.push(statusRid);
        let fetchStatusQuery = rawQueries.getAllTaskStatus(taskStatusIds);
        if(fetchStatusQuery) {
          const findTaskStatus : any = await this.mainDbSequelize.query(fetchStatusQuery);
          const taskStatusMap = new Map(findTaskStatus[0].map((d : any) => [d.rid, d.task_status_name]));

          for(let f of findTaskDependency) {
            if(mapRelationShip.get(f.relationship_connector_rid) === 'Is Enabled By') {
              if(taskStatusMap.get(mapTargetTasks.get(f.target_rid)?.task_status_rid) !== "Completed") {
                if(taskStatusMap.get(statusRid) === "Completed") {
                  return {
                    success : true,
                    statusCode : HttpStatus.BAD_REQUEST,
                    statusMessage : `This task cannot be completed because it is enabled by ${mapTargetTasks.get(f.target_rid)?.task_name}`
                  }
                }
              }
            }
            else if(mapRelationShip.get(f.relationship_connector_rid) === "Is Blocked By") {
              if(taskStatusMap.get(mapTargetTasks.get(f.target_rid)?.task_status_rid) !== "Completed") {
                return {
                  success : true,
                  statusCode : HttpStatus.BAD_REQUEST,
                  statusMessage : `This task is blocked by ${mapTargetTasks.get(f.target_rid)?.task_name}. Please complete that task before proceeding.`
                }
              }
            } else {
              return {
                  success : false,
                  statusCode : HttpStatus.BAD_REQUEST,
                  statusMessage : null
              }
            }
          }
        }
      }
    }
  }
  private async targetTaskValidation (accountNumber : string, findTaskDependency: CaseTaskWorkflowConnector[], targetRid : string, statusRid : string) {
    if(!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize()
    }
    const {WorkflowConnector, CaseTask} = await this.caseModelService.getModels(accountNumber);
    const relationIds = [...new Set(findTaskDependency.map((d : CaseTaskWorkflowConnector) => d.relationship_connector_rid))];
    const findRelationshipConnector = await WorkflowConnector.findAll({
      where : {
        rid : {
          [Op.in] : relationIds
        }
      }, raw : true
    });
    if(findRelationshipConnector.length > 0) {
      const mapRelationShip : Map<string, string> = new Map(findRelationshipConnector.map((d : any) => [d.rid, d.relationship_type]));
      const sourceIds = [...new Set(findTaskDependency.map((d : CaseTaskWorkflowConnector) => d.source_rid))];
      sourceIds.push(targetRid)
      const findCaseTasks = await CaseTask.findAll({
        where : {
          rid : {
            [Op.in] : sourceIds
          }
        }, raw : true
      });
      if(findCaseTasks.length > 0) {
        const mapSourceTasks : Map<string, CaseTask> = new Map(findCaseTasks.map((d : any) => [d.rid, d]));
        
        const taskStatusIds = [...new Set(findCaseTasks.map((d : any) => d.task_status_rid))];
        taskStatusIds.push(statusRid);
        let fetchStatusQuery = rawQueries.getAllTaskStatus(taskStatusIds);
        if(fetchStatusQuery) {
          const findTaskStatus : any = await this.mainDbSequelize.query(fetchStatusQuery);
          const taskStatusMap = new Map(findTaskStatus[0].map((d : any) => [d.rid, d.task_status_name]));

          for(let f of findTaskDependency) {
            if(mapRelationShip.get(f.relationship_connector_rid) === 'Enables') {
              if(taskStatusMap.get(mapSourceTasks.get(f.source_rid)?.task_status_rid) !== "Completed") {
                if(taskStatusMap.get(statusRid) === "Completed") {
                  return {
                    success : true,
                    statusCode : HttpStatus.BAD_REQUEST,
                    statusMessage : `This task cannot be completed because it is enabled by ${mapSourceTasks.get(f.source_rid)?.task_name}`
                  }
                }
              }
            }
            else if(mapRelationShip.get(f.relationship_connector_rid) === "Blocks") {
              if(taskStatusMap.get(mapSourceTasks.get(f.target_rid)?.task_status_rid) !== "Completed") {
                return {
                  success : true,
                  statusCode : HttpStatus.BAD_REQUEST,
                  statusMessage : `This task is blocked by ${mapSourceTasks.get(f.source_rid)?.task_name}. Please complete that task before proceeding.`
                }
              }
            } else {
              return {
                  success : false,
                  statusCode : HttpStatus.BAD_REQUEST,
                  statusMessage : null
                }
            }
          }
        }
      }
    }
  }
  async fetchChecklistTemplateDetailsById(
    checklistId: string
  ) {``
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
  
    const [checklistDetailsResult] = await this.mainDbSequelize.query(rawQueries.fetchChecklistTemplates, {
      replacements: { checklistId },
      type: "SELECT"
    }) as [any[], any];
  
    if (!checklistDetailsResult || checklistDetailsResult.length === 0) {
      return null;
    }
  
    const checklistDetails = checklistDetailsResult as any;
  
    let checklistItems = await this.fetchChecklistTemplateItems(
      checklistId
    );
  
     const userInfo = await this.insertUserDetails(
       checklistDetails.created_by ?? "",
       checklistDetails.modified_by ?? ""
     );
  
    const response: any = {
      checklist_template_rid: checklistDetails?.rid,
      checklist_name: checklistDetails?.checklist_name ?? "",
      checklist_description: checklistDetails?.checklist_description ?? "",
      r_number: checklistDetails.r_number ?? "",
      status_rid: checklistDetails.status_rid ?? "",
      status_name: checklistDetails.status_name ?? "",
      modified_by: userInfo.modified_name ?? checklistDetails.modified_by,
      created_by: userInfo.created_name ?? checklistDetails.created_by,
      created_datetime: checklistDetails.created_datetime ?? null,
      modified_datetime: checklistDetails.modified_datetime ?? null,
      checklist_items: checklistItems ?? [],
    };
  
    return response;
    }
    async fetchChecklistTemplateItems(
    checklistId: string,
  ) {
    try {
      const {
        AdminCheckListItem,
      } = await this.caseModelService.getModels("");
      // Convert Sequelize instances to plain objects

      const items = await AdminCheckListItem.findAll({
        attributes: [
          "rid",
          "checklist_item_name",
          "checklist_template_rid",
          "description"
          ],
        order: [
          ["created_datetime", "ASC"],
        ],
        where: { $checklist_template_rid$: checklistId},
      });
      const plainItems = items.map((item) => item.get({ plain: true }));
      return items;
    } catch (err) {
      logMessage(`Error fetching interaction template items: ${err}`);
      throw new Error(
        "Error fetching interaction template items: " + (err as Error).message
      );
    }
  }

   async fetchSenderEmailInfoByAccountId(
      accountNumber: string,
      parentAccountId: string
    ) {
      try {
        if (!this.orgDbSequelize) {
          this.orgDbSequelize = await this.caseModelService.getSequelize();
        }
        const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
          /\D/g,
          ""
        )}`;
        const [senderEmailInfo]: any[] = await this.orgDbSequelize.query(
          rawQueries.fetchSenderEmail(schemaName, parentAccountId)
        );
        const clientSecret = senderEmailInfo[0]?.client_secret;
        const decryptedSecret = await decryptClientSecret(clientSecret);
  
        return {
          email:
            senderEmailInfo[0]?.support_email,
          clientId:
            senderEmailInfo[0]?.client_id,
          clientSecret:
            decryptedSecret,
          tenantId:
            senderEmailInfo[0]?.tenant_id ,
        };
      } catch (err) {
        logMessage(`Error fetching sender email info for account: ${err}`);
      }
    }
  async updateChecklistItems (data : any, accountNumber : string, transaction : Transaction) {
    if(!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize()
    }
    const {CheckListItem} = await this.caseModelService.getModels(accountNumber);
    const fetchChecklistStatusId : any = await this.mainDbSequelize.query(rawQueries.getChecklistStatusByName(data.status_rid));

    const [result] = await CheckListItem.update({
      status_rid : fetchChecklistStatusId[0][0].rid
    }, {
      where : {
        rid : data.rid
      },
      transaction
    });
    if(result === 1) {
      transaction.commit();
      return result;
    } else {
      transaction.rollback()
      return result;
    }
  }
  async fetchAssignedToRole (assignedTo : string, caseRid : string, accountRid : string, accountNumber : string) {
    const {CaseTeam} = await this.caseModelService.getModels(accountNumber);
    const result = await CaseTeam.findOne({
      where : {
        case_rid : caseRid,
        account_rid : accountRid,
        user_rid : assignedTo
      }, raw : true
    });
    return result;
  }
}

// Utility function for optimized column sorting
const getSortColumn = (sortField: string): string => {
  const sortMapping: Record<string, string> = {
    r_number: "c.r_number",
    created_datetime: "c.created_datetime",
    modified_datetime: "c.modified_datetime",
    case_total_projects: "c.case_total_projects",
    case_total_qualified_projects: "c.case_total_qualified_projects",
    case_total_project_cost: "c.case_total_project_cost",
    case_total_rd_cost: "c.case_total_rd_cost",
    case_total_qre_cost: "c.case_total_qre_cost",
    submitted_datetime: "c.submitted_datetime",
    approved_datetime: "c.approved_datetime",
    status_name: "c.status_name",
    created_user_name: "c.created_user_name",
    updated_user_name: "c.updated_user_name",
    account_name: "c.account_name",
    country_name: "c.country_name",
    fiscal_year: "c.fiscal_year",
    case_owner_name: "c.case_owner_name",
    case_name: "c.case_full_name",
    createdAt: "c.created_datetime",
    filing_type_name: "c.filing_type_name",
  };

  return sortMapping[sortField] || "c.r_number";
};

const getSortColumnForReviewProjects = (sortField: string): string => {
  const sortMapping: Record<string, string> = {
    r_number: "c.r_number",
    created_datetime: "c.created_datetime",
    modified_datetime: "c.modified_datetime",
    fiscal_year: "c.fiscal_year",
    createdAt: "c.created_datetime",
    total_resources_prj: "c.total_resources_prj",
    total_cost_prj: "c.total_cost_prj",
    total_cost_nonlabor_prj: "c.total_cost_nonlabor_prj",
    total_cost_subcon_prj: "c.total_cost_subcon_prj",
    total_cost_fte_prj: "c.total_cost_fte_prj",
    total_effort_prj: "c.total_effort_prj",
    total_effort_subcon_prj: "c.total_effort_subcon_prj",
    total_effort_fte_prj: "c.total_effort_fte_prj",
    total_subcon_prj: "c.total_subcon_prj",
    total_nonlabor_prj: "c.total_nonlabor_prj",
    total_fte_prj: "c.total_fte_prj",
    project_group: "c.project_group",
    project_name: "c.project_name",
    project_code: "c.project_code",
    total_tasks: "total_tasks",
    total_technical_summaries: "total_technical_summaries",


  };

  return sortMapping[sortField] || "c.r_number";
};

export default CaseSchemaService;
function filterForCases(
  filters: filterType,
  andConditions: string,
  filteredQueryArray: string[],
  filterTypes: any,
  filterColumns: any
) {
  let filteredColumns: string | undefined;
  if (filters && Object.keys(filters).length > 0) {
    for (let [key, conditions] of Object.entries(filters)) {
      if (Object.keys(filterTypes).includes(key)) {
        filteredColumns = filterColumns[key];
        andConditions = ` AND `;
      }
      for (let [condition, values] of Object.entries(conditions)) {
        switch (filterTypes[key]) {
          case "string": {
            let dynamicReference = ``;

            if (filteredColumns == "account_name") dynamicReference = `a`;
            else if (filteredColumns == "country_name") dynamicReference = `c`;
            else if (filteredColumns == "country_rid") 
              {
                dynamicReference = `c`;
                filteredColumns = "rid"
              }
            else if (filteredColumns == "case_full_name") dynamicReference = ``;
            else dynamicReference = `cs`;

            const stringCondition = buildStringFilterCondition(
              condition,
              values,
              filteredColumns!,
              dynamicReference
            );
            if (stringCondition) {
              filteredQueryArray.push(stringCondition);
            }
            break;
          }
          case "number": {
            const numericCondition = buildNumericFilterCondition(
              condition,
              values,
              filteredColumns!
            );
            if (numericCondition) {
              filteredQueryArray.push(numericCondition);
            }
            break;
          }
          case "datetime": {
            let dynamicReference = `cs`;
            const datetimeCondition = buildDatetimeFilterCondition(
              condition,
              values,
              filteredColumns!,
              dynamicReference
            );
            if (datetimeCondition) {
              filteredQueryArray.push(datetimeCondition);
            }
            break;
          }
        }
      }
    }
    return {
      filteredQueryArray,
      andConditions,
    };
  } else {
    filteredQueryArray = [];
    andConditions = ` `;
    return {
      filteredQueryArray,
      andConditions,
    };
  }
}

function filterForReviewProjects(
  filters: filterType,
  andConditions: string,
  filteredQueryArray: string[],
  filterTypes: any,
  filterColumns: any
) {
  let filteredColumns: string | undefined;
  if (filters && Object.keys(filters).length > 0) {
    for (let [key, conditions] of Object.entries(filters)) {
      if (Object.keys(filterTypes).includes(key)) {
        filteredColumns = filterColumns[key];
        andConditions = ` AND `;
      }
      for (let [condition, values] of Object.entries(conditions)) {
        switch (filterTypes[key]) {
          case "string": {
            let dynamicReference = ``;

            if (filteredColumns == "account_name") dynamicReference = `a`;
            else dynamicReference = `c`;

            const stringCondition = buildStringFilterCondition(
              condition,
              values,
              filteredColumns!,
              dynamicReference
            );
            if (stringCondition) {
              filteredQueryArray.push(stringCondition);
            }
            break;
          }
          case "number": {
            const numericCondition = buildNumericFilterCondition(
              condition,
              values,
              filteredColumns!,
              "c"
            );
            if (numericCondition) {
              filteredQueryArray.push(numericCondition);
            }
            break;
          }
          case "datetime": {
            let dynamicReference = `pf`;
            const datetimeCondition = buildDatetimeFilterCondition(
              condition,
              values,
              filteredColumns!,
              dynamicReference
            );
            if (datetimeCondition) {
              filteredQueryArray.push(datetimeCondition);
            }
            break;
          }
        }
      }
    }
    return {
      filteredQueryArray,
      andConditions,
    };
  } else {
    filteredQueryArray = [];
    andConditions = ` `;
    return {
      filteredQueryArray,
      andConditions,
    };
  }
}


const globalFiltersforCaseSummary = (
  globalFilters: Record<string, string[]>
): string[] => {
  // Early return for empty filters
  if (!globalFilters || Object.keys(globalFilters).length === 0) {
    return [];
  }

  try {
    // Use flatMap for more efficient array flattening
    return Object.entries(globalFilters).flatMap(([key, values = []]) => [
      key,
      ...values,
    ]);
  } catch (err) {
    console.error("Error computing global account filter:", err);
    return [];
  }
};
/**
 * Utility function to add a new checklist item
 * @param AdminCheckListItem - The model instance
 * @param checklistTemplateRid - Parent checklist RID
 * @param item - Checklist item data
 * @param createdBy - User ID who is creating the item
 * @param transaction - Database transaction
 * @returns Promise resolving to the created item
 */
async function addChecklistItem(
  CheckListItem: any,
  checklistRid: string,
  item: ICreateChecklistItem,
  createdBy: string,
  accountRid:string,
  statusRid:string,
  transaction: Transaction
) {
  const result = await CheckListItem.create(
    {
      account_rid: accountRid,
      checklist_rid: checklistRid,
      checklist_item_name: item.checklist_item_name,
      checklist_item_description: item.checklist_item_description,
      status_rid: statusRid,
      created_by: createdBy,
      created_datetime: new Date(),
    },
    { transaction }
  );
  logMessage(
    `Added new checklist item: ${item.checklist_item_name}`
  );
  return result;
}

/**
 * Utility function to edit/update an existing checklist item
 * @param AdminCheckListItem - The model instance
 * @param checklistTemplateRid - Parent checklist RID
 * @param item - Checklist item data
 * @param createdBy - User ID who is modifying the item
 * @param transaction - Database transaction
 * @returns Promise resolving to the updated or created item
 */
async function editChecklistItem(
  CheckListItem: any,
  checklistRid: string,
  item: ICreateChecklistItem,
  createdBy: string,
  transaction: Transaction
) {
  // First, find the existing item by template_rid and sequence_no
  const existingItem = await CheckListItem.findOne({
    where: {
      rid: item.checklist_item_rid,
    },
    transaction,
  });

  if (existingItem) {
    // Update existing item
    const result = await existingItem.update(
      {
        checklist_item_name: item.checklist_item_name,
        checklist_item_description: item.checklist_item_description,
        status_rid: item.status_rid,
        modified_by: createdBy,
        modified_datetime: new Date(),
      },
      { transaction }
    );
    logMessage(
      `Updated checklist item  ${item.checklist_item_name}`
    );
    return result;
  } else {
    // Item doesn't exist, create it as fallback
    logMessage(
      `Warning: Checklist item  not found for editing`
    );
    const result = await CheckListItem.create(
      {
        checklist_item_name: item.checklist_item_name,
        status_rid: item.status_rid,
        created_by: createdBy,
        created_datetime: new Date(),
      },
      { transaction }
    );
    logMessage(
      `Created new checklist item (edit fallback): ${item.checklist_item_name}`
    );
    return result;
  }
}

/**
 * Utility function to delete an existing checklist item
 * @param AdminCheckListItem - The model instance
 * @param checklistTemplateRid - Parent checklist RID
 * @param item - Checklist item data
 * @param transaction - Database transaction
 * @returns Promise resolving to the deletion result
 */
async function deleteChecklistItem(
  CheckListItem: any,
  checklistRid: string,
  item: ICreateChecklistItem,
  transaction: Transaction
) {
  // Find the item to delete
  const itemToDelete = await CheckListItem.findOne({
    where: {
      rid: item.checklist_item_rid
    },
    transaction,
  });

  if (itemToDelete) {
    await itemToDelete.destroy({ transaction });
    logMessage(
      `Deleted checklist item: ${item.checklist_item_name}`
    );
  } else {
    logMessage(
      `Warning: Checklist item not found for deletion`
    );
  }
}