import { initOrgSequelize } from "../../config/orgDataSource";
import dayjs from "dayjs";
import { initMainDbSequelize } from "../../config/mainDataSource";
import axios, { AxiosError } from "axios";
import {
  col,
  fn,
  Op,
  QueryTypes,
  Sequelize,
  Transaction,
  where,
} from "sequelize";
import { CaseModelService } from "../caseModelsService";
import {
  ALPHANUMERIC_CONDITIONS,
  entityNames,
  filtersColumnsForCaseSummary,
  filtersColumnsForReviewProjects,
  filterTypesForCaseSummary,
  filterTypesForReviewProjects,
  HttpStatus,
  MAIN_SCHEMA_NAME,
  mainTableFilters,
  rawQueries,
  ruleNames,
  ruleTemplateNames,
  SCHEMANAME_PREFIX,
  STATUS_MESSAGE,
} from "../../utils/constants";
import { buildDatetimeFilterCondition, buildNumericFilterCondition, buildStringFilterCondition, decryptClientSecret, errorLog, generateSasUrl, getFiscalEndYear, logMessage, parseFiscalDate } from "../../utils/helpers";
import {
  assignProjectType,
  CaseHeadersColumns,
  filterType,
  ICreateCases,
  ICreateCaseTeam,
  TaskTypeResponse,
  TeamMember,
} from "../../utils/types";

// Define filterType interface
import { Case, setupCaseSequence } from "../../models/caseModel";
import {
  fetchCasesHeadersDatas,
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
import { CaseHistorySubmission, setupCaseHistorySubmissionSequence } from "../../models/caseHistorySubmissionModel";
import { CheckList, setupCheckListSequence } from "../../models/checkListModel";
import { CheckListItem } from "../../models/checkListItemModel";
import { CaseTask, setupCaseTaskSequence } from "../../models/caseTaskModel";
import { CaseMilestone, setupCaseMilestoneSequence } from "../../models/caseMilestoneModel";
import { setupTaskCollaboratorsSequence, TaskCollaborators } from "../../models/taskCollaboratorsModel";
import { setupTaskTagSequence, TaskTag } from "../../models/taskTagsModel";
import { setupTaskCommentsSequence, TaskComments } from "../../models/taskCommentsModel";
import { CommentsAttachments, setupCommentsAttachmentsSequence } from "../../models/commentsAttachmentModel";
import { setupTaskAttachmentsSequence, TaskAttachments } from "../../models/taskAttachmentModel";
import { CaseTaskWorkflowConnector, setupCaseTaskWorkflowConnectorSequence } from "../../models/caseTaskWorkflowConnectorModel";
import { CaseProjectFiscalRegion, setupCaseProjectFiscalRegionSequence } from "../../models/caseProjectFiscalRegionModel";
import { CaseProjectResourceFiscal } from "../../models/caseProjectResourceFiscalModel";
import { CaseProjectResource } from "../../models/caseProjectResourceModel";
import { CaseProjectTask } from "../../models/caseProjectTaskModel";
import { CaseKeyContactDetails } from "../../models/caseKeyContactModel";
import { setupCaseKeyContactSequence } from "../../models/caseKeyContactModel";
import { HelperMethods } from "./helperMethods";

class CaseSchemaService {
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;
  private caseModelService: CaseModelService;
  private helperMethod : HelperMethods

  constructor() {
    this.caseModelService = new CaseModelService();
    this.helperMethod = new HelperMethods(
          this.caseModelService
        );
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
        currencyRid: account?.currency_rid
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
      //  await this.createCaseTables(accountNumber);
      const casecreationResponse = await Case.create(caseRequest, {
        transaction,
      });

      // Add timeline entry for case creation
      if (casecreationResponse && casecreationResponse.rid) {
        const fetchTaskTypeRid = await this.getTaskType();
        const fetchTaskStatusRid = await this.getTaskStatus()
        if (fetchTaskTypeRid) {
          await this.cloneDefaultMilestoneTaskTemplate(casecreationResponse.account_rid, casecreationResponse.rid,
            casecreationResponse.filing_type_rid, fetchTaskTypeRid.rid, accountNumber, transaction, casecreationResponse.case_startdate,
            fetchTaskStatusRid?.rid!, casecreationResponse.created_by, casecreationResponse.fiscal_year)
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

  async addJurisdiction(accountRid: string, caseRid: string, accountNumber: string, caseRequest: ICreateCases, transaction: Transaction) {
    const { Jurisdiction } = await this.caseModelService.getModels(accountNumber);

    const accountJurisdictionData = await Jurisdiction.findOne({
      where: {
        entity_rid: accountRid
      }
    })

    if (accountJurisdictionData) {
      await Jurisdiction.create(
        {
          created_by: caseRequest.created_by,
          entity_rid: caseRid,
          is_federal_level: accountJurisdictionData.is_federal_level,
          is_state_level: accountJurisdictionData.is_state_level,
          states: accountJurisdictionData.states,
          level: "case",
        },
        { transaction }
      );
    }
  }

  async checkIsCaseNameUnique(
    caseReq: any,
    accountNumber: string
  ): Promise<{ isunique: boolean, isCaseUnique: boolean }> {
    const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(
      /\D/g,
      ""
    )}`;
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const tableExists = await this.checkTableExists(schemaName, "cases");
    if (!tableExists) {
      logMessage(
        `Cases table does not exist for account ${accountNumber}, returning empty result`
      );
      return {
        isunique: true,
        isCaseUnique: true
      };
    }
    const { Case } = await this.caseModelService.getModels(accountNumber);
    // Check for case name uniqueness (case-insensitive, same fiscal year)
    const uniqueResponse = await Case.findOne({
      where: {
        [Op.and]: [
          where(
            fn("LOWER", col("case_name")),
            Op.eq,
            caseReq.case_name.toLowerCase(),
          ),
          { fiscal_year: caseReq.fiscal_year },
          { account_rid: { [Op.eq]: caseReq.account_rid } }
        ]
      }
    });

    // Always fetch status from mainDb using status name
    const [caseStatus]: any[] = await this.mainDbSequelize.query(
      rawQueries.fetchCaseStatusByType('In Progress'),
      { type: QueryTypes.SELECT }
    );
    let caseWithSameStatus = null;
    if (caseStatus && caseStatus.rid) {
      caseWithSameStatus = await Case.findOne({
        where: {
          [Op.and]: [
            { fiscal_year: caseReq.fiscal_year },
            { status_rid: { [Op.eq]: caseStatus.rid } },
            { account_rid: { [Op.eq]: caseReq.account_rid } }
          ]
        }
      });
    }

    // If a case exists in the given fiscal year with the same status, do not allow
    const isCaseUnique = !caseWithSameStatus;
    return {
      isunique: !uniqueResponse,
      isCaseUnique: isCaseUnique
    };
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
          { attachment_level: { [Op.eq]: caseReq.attachment_level } }
        ]
      }
    });
    return !response;
  }
  async checkisExistingCheckilistUnique(caseReq: any, accountNumber: string): Promise<boolean> {
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
          { attachment_level: { [Op.eq]: caseReq.attachment_level } }
        ]
      }
    });
    return !response;
  }

  async checkisExistingCaseUnique(caseReq: any, accountNumber: string): Promise<boolean> {
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
          { fiscal_year: caseReq.fiscal_year },
          { account_rid: { [Op.eq]: caseReq.account_rid } }
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
    transaction: Transaction,
    accessToken: string
  ) {
    // Implementation for creating interactions in the database
    try {
      if (!this.mainDbSequelize) this.mainDbSequelize = await initMainDbSequelize();
      const { Case, CaseSummary, CaseTask } = await this.caseModelService.getModels(
        accountNumber
      );

      const existingCase = await Case.findOne({
        where: { rid: caseRequest.case_rid },
        transaction,
      });

      if (caseRequest.case_startdate && caseRequest.statutory_submission_date && caseRequest.planned_submission_date) {
        if (existingCase?.case_startdate !== caseRequest.case_startdate || existingCase?.statutory_submission_date !== caseRequest.statutory_submission_date
          || existingCase?.planned_submission_date !== caseRequest.planned_submission_date
        ) {
          const [fetchToDoStatus] = await this.mainDbSequelize.query<TaskTypeResponse>(rawQueries.checkCaseTaskStatusToDo(), { type: QueryTypes.SELECT });
          if (fetchToDoStatus) {
            const checkStatusChanged = await CaseTask.findOne({
              where: {
                case_rid: caseRequest.case_rid,
                account_rid: caseRequest.account_rid,
                task_status_rid: {
                  [Op.ne]: fetchToDoStatus.rid
                }
              }, raw: true
            })
            if (checkStatusChanged) {
              return {
                statusCode: HttpStatus.BAD_REQUEST,
                statusMessage: STATUS_MESSAGE.caseDateChangeNotAllowed,
                data: null
              };
            }
          }
        }
      }
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
        existingCase,
        accessToken
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

      return {
        statusCode: HttpStatus.SUCCESS,
        statusMessage: '',
        data: caseUpdateResponse
      };
    } catch (error) {
      logMessage(`Error updating cases: ${error}`);
      throw new Error("Error updating cases: " + error);
    }
  }

  async caseDateChangeAllow(existingCase: Case, caseRequest: ICreateCases, accountNumber: string) {
    if (!this.mainDbSequelize) this.mainDbSequelize = await initMainDbSequelize();
    if (!this.orgDbSequelize) this.orgDbSequelize = await initOrgSequelize();
    if (existingCase?.case_startdate.toISOString().split('T')[0] !== caseRequest.case_startdate.toISOString().split('T')[0] || existingCase.statutory_submission_date.toISOString().split('T')[0] !== caseRequest.statutory_submission_date.toISOString().split('T')[0]
      || existingCase.planned_submission_date.toISOString().split('T')[0] !== caseRequest.planned_submission_date.toISOString().split('T')[0]
    ) {
      const [fetchToDoStatus] = await this.mainDbSequelize.query<TaskTypeResponse>(rawQueries.checkCaseTaskStatusToDo(), { type: QueryTypes.SELECT });
      if (fetchToDoStatus) {
        let schemaName = rawQueries.fetchSchemaName(accountNumber)
        const checkStatusChanged = await this.orgDbSequelize.query<TaskTypeResponse>(rawQueries.checkCaseStatusChanged(schemaName, caseRequest.case_rid!, caseRequest.account_rid, fetchToDoStatus.rid), { type: QueryTypes.SELECT });
        if (checkStatusChanged.length > 0) {
          return STATUS_MESSAGE.caseDateChangeNotAllowed
        }
      }
    } else return null
  }

  async updateCaseHistory(
    accountNumber: string,
    caseId: string,
    newCaseData: any,
    existingCaseData: any,
    accessToken: string
  ) {
    try {
      const { CaseHistory } = await this.caseModelService.getModels(
        accountNumber
      );
      if(!this.mainDbSequelize) {
        this.mainDbSequelize = await this.caseModelService.getMainSequelize();
      }

      const [caseInfo]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchCasesInfo(caseId),
        {
          replacements: { case_rid: caseId },
          type: "SELECT"
        });

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
       let baseRuleEnginePayload: any = {
          eventName: ruleNames.caseCreated,
          userId: newCaseData.modified_by,
          accountRid: newCaseData.account_rid,
          entityName: newCaseData.case_name,
          entityId: caseId,
          caseName: caseInfo ? caseInfo.case_name : "",
          entity:entityNames.case,     
        };
        baseRuleEnginePayload.targetUserID = newCaseData.case_owner_rid;
      for (const historyChange of historyChanges) {
        await CaseHistory.create(historyChange);
        // If the attribute is 'case_owner_rid', fetch user names for old and new values
        if (historyChange.attribute_name === 'case_owner_rid') {
          const oldValue = historyChange.old_value;
          const newValue = historyChange.new_value;
          const result:any = await this.mainDbSequelize.query(rawQueries.fetchUserNames(oldValue, newValue));
          let nameMapping = new Map();
          if (result && Array.isArray(result[0])) {
            for (const r of result[0]) {
              if (r && r.rid != null) {
                nameMapping.set(String(r.rid), r.email ? String(r.email) : '');
              }
            }
          }
          const oldName = nameMapping.get(oldValue) || '';
          const newName = nameMapping.get(newValue) || '';
          baseRuleEnginePayload.targetUserID = newValue;
          baseRuleEnginePayload.targetEmail = newName;
          baseRuleEnginePayload.case = "Assigned"
          baseRuleEnginePayload.status = newName
          const [statusInfo]: any[] = await this.mainDbSequelize.query(rawQueries.getCaseStatusDetails(newCaseData.status_rid), { type: QueryTypes.SELECT });
          baseRuleEnginePayload.status = statusInfo?.status_name || '';

         
        }
          if (historyChange.attribute_name === 'status_rid') {
          const oldValue = historyChange.old_value;
          const newValue = historyChange.new_value;
          const result:any = await this.mainDbSequelize.query(rawQueries.fetchCaseStatus(oldValue, newValue));
          let nameMapping = new Map();
          if (result && Array.isArray(result[0])) {
            for (const r of result[0]) {
              if (r && r.rid != null) {
                nameMapping.set(String(r.rid), r.status_name ? String(r.status_name) : '');
              }
            }
          }
          const [userInfo]: any[] = await this.mainDbSequelize.query(rawQueries.fetchUserDetails(newCaseData.case_owner_rid), { type: QueryTypes.SELECT });
          baseRuleEnginePayload.targetEmail = userInfo?.email || '';
          const oldName = nameMapping.get(oldValue) || '';
          const newName = nameMapping.get(newValue) || '';
          baseRuleEnginePayload.status = newName

         
        }
      }
      
      await this.helperMethod.triggerDynamicRuleEngine( baseRuleEnginePayload, {
            newValue: "",
            oldValue: ""
          }, accessToken);
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
      const CaseProjectFiscalRegionModel = CaseProjectFiscalRegion.initialize(
        orgDbSequlize,
        schemaName
      )
      const CaseProjectResourceModel = CaseProjectResource.initialize(
        orgDbSequlize,
        schemaName
      )
      const CaseProjectResourceFiscalModel = CaseProjectResourceFiscal.initialize(
        orgDbSequlize,
        schemaName
      )
      const CaseProjectTaskModel = CaseProjectTask.initialize(
        orgDbSequlize,
        schemaName
      )
      const CaseKeyContactDetailsModel = CaseKeyContactDetails.initialize(
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
      await CaseMilestoneModel.sync({ force: false });
      await setupCaseMilestoneSequence(orgDbSequlize, schemaName);
      await CaseTaskModel.sync({ force: false });
      await setupCaseTaskSequence(orgDbSequlize, schemaName);
      await TaskCollaboratorsModel.sync({ force: false });
      await setupTaskCollaboratorsSequence(orgDbSequlize, schemaName)
      await TaskTagsModel.sync({ force: false })
      await setupTaskTagSequence(orgDbSequlize, schemaName)
      await TaskCommentsModel.sync({ force: false })
      await setupTaskCommentsSequence(orgDbSequlize, schemaName)
      await CommentsAttachmentsModel.sync({ force: false })
      await setupCommentsAttachmentsSequence(orgDbSequlize, schemaName)
      await TaskAttachmentsModel.sync({ force: false })
      await setupTaskAttachmentsSequence(orgDbSequlize, schemaName)
      await caseHistorySubmissionModel.sync({ force: false });
      await setupCaseHistorySubmissionSequence(orgDbSequlize, schemaName);
      await CaseTaskWorkflowConnectorModel.sync({ force: false });
      await setupCaseTaskWorkflowConnectorSequence(orgDbSequlize, schemaName)
      await CaseProjectFiscalRegionModel.sync({ force: false });
      await setupCaseProjectFiscalRegionSequence(orgDbSequlize, schemaName)
      await CaseProjectResourceModel.sync({ force: false });
      await CaseProjectResourceFiscalModel.sync({ force: false });
      await CaseProjectTaskModel.sync({ force: false });
      await CaseKeyContactDetailsModel.sync({ force: false });
      await setupCaseKeyContactSequence(orgDbSequlize, schemaName)
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
      if (filters?.case_name) {
        caseNameFilter = filters.case_name;
        caseNameConditions = detectConditions(caseNameFilter);
      }
      if (filters) {
        ["modified_by", "case_name"].forEach((key) => {
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
        attributes: {
          include: [
            [
              Sequelize.literal(`
              CASE 
                WHEN "Case"."case_total_project_cost" = 0 THEN NULL
                ELSE "Case"."case_total_project_cost"
              END
            `),
              'case_total_project_cost'
            ],
            [
              Sequelize.literal(`
          CASE 
            WHEN "Case"."case_total_qre_cost" = 0 THEN NULL
            ELSE "Case"."case_total_qre_cost"
          END
        `),
              'case_total_qre_cost'
            ]
          ]
        },
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
    orgDb: Sequelize,
    accountRid: string,
    activeStatusRid: string
  ) {
    const [result] = await orgDb.query<CaseHeadersColumns>(
      fetchCasesHeadersDatas(schemaName, caseRid, accountRid, activeStatusRid),
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

  async getSubscriptionDetailsByProjectId(parentaccountId: string, schemaName: string, accountId: string) {
    try {
      let schemaNameParent = `trd365_${schemaName.replace(/\D/g, "")}`;
      const query = rawQueries.fetchAccountInfos(schemaNameParent, accountId);
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
      if (parentSubscriptioninfo && parentSubscriptioninfo.length > 0) {
        const parentDetails = parentSubscriptioninfo[0];
        const isSubscriptionCreated = Boolean(
          parentDetails.subscription_created &&
          parentDetails.tenant_id &&
          parentDetails.client_id &&
          parentDetails.client_secret);
        return isSubscriptionCreated;
      } else {
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
    if(!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    if(!this.orgDbSequelize) {
      this.orgDbSequelize = await this.caseModelService.getSequelize();
    }
   const [caseInfo]: any[] = await this.orgDbSequelize.query(
           rawQueries.fetchCaseInfo(schemaName, data.case_rid),
           {
             type: "SELECT",
           }
         );

    const [accountInfo]: any[] = await this.mainDbSequelize.query(
            rawQueries.fetchAccountInfo(
              data.account_rid,
            )
          );
    const [accountFiscalInfo]: any[] = await this.orgDbSequelize.query(
      rawQueries.fetchAccountDetailsInfo(
        schemaName,data.account_rid, 
      ), { type: 'SELECT' }
    );
    const fiscalStart = accountFiscalInfo?.fiscal_start_date; // e.g. 'Apr/01'
    const fiscalEnd = accountFiscalInfo?.fiscal_end_date; // e.g. 'Mar/31'
    const fiscalYear = data.fiscal_year || new Date().getFullYear();
    if (!fiscalStart || !fiscalEnd) return "";
    // Start date
    const formattedStartDate = parseFiscalDate(fiscalStart, fiscalYear);
    const endYear = getFiscalEndYear(fiscalStart, fiscalEnd, fiscalYear);
    const formattedEndDate = parseFiscalDate(fiscalEnd, endYear);
    const [platFormConfig]: any[] = await this.mainDbSequelize.query(
                rawQueries.fetchPlatformConfig(
                 accountInfo[0].country_rid,formattedStartDate,formattedEndDate
                ),{type: 'SELECT'}
          );
    let projectTypes :string[] = [];
    if (platFormConfig && platFormConfig.config_json && platFormConfig.config_json.project_type) {
      // Support array or single value
        projectTypes = platFormConfig.config_json.project_type;
    }
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
        isExport,
        projectTypes
      )
    );
    return result[0];
  }

  async listReviewProjectsInfo(
    accountNumber: string,
    caseRid: string,
    filters: Record<string, any>,
    fiscalYear: number = 0,
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
    let [pointOfContactRoleid]: any[] = await this.mainDbSequelize.query(
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
    if (projectIds && projectIds.length > 0) {
      projectIdQuery += `c.rid IN (${projectIds.map(id => `'${id}'`).join(",")})`;
    }
    searchValue = search ? `%${search}%` : `%%`;
    whereKey = `1 = 1`;
    const conditions = [
      fiscalYearQuery,
      filterQueryValues, projectIdQuery
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
    if (!Array.isArray(result)) {
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
            val.includes(d[field])
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

  async insertCaseTabels(
    data: assignProjectType,
    accountNumber: string,
    schemaName: string
  ) {
    const { CaseProjectResource, CaseProjectResourceFiscal, ProjectResource, ProjectResourceFiscal,
      CaseProjectTask, ProjectTask, CaseProjectFiscalRegion, ProjectFiscalRegion, CaseKeyContactDetails, KeyContact } =
      await this.caseModelService.getModels(accountNumber);

    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await this.caseModelService.getSequelize();
    }

    let iterationCount = 0;
    const totalCount = data.projects.length;

    for (const p of data.projects) {

      const keyContactRecords = await KeyContact.findAll({
        where: {
          entity_rid: p.project_fiscal_rid,
        }
      });

      if (keyContactRecords && keyContactRecords.length > 0) {
        const caseKeyContactData = keyContactRecords.map(contactRecord => ({
          key_contact_rid: contactRecord.rid || '',
          case_project_rid: p.project_case_rid || '',
          case_rid: data.case_rid,
          entity_rid: contactRecord.entity_rid,
          account_rid: data.account_rid,
          entity_type: contactRecord.entity_type,
          key_contact_name: contactRecord.key_contact_name,
          key_contact_email: contactRecord.key_contact_email,
          key_contact_role: contactRecord.key_contact_role,
          is_primary_contact: contactRecord.is_primary_contact,
          include_in_communication: contactRecord.include_in_communication,
          interaction_cc_recipient: contactRecord.interaction_cc_recipient,
          status_rid: contactRecord.status_rid,
          created_by: data.created_by,
          modified_by: data.modified_by,
        }));

        // Bulk create the records
        if (caseKeyContactData.length > 0) {
          await CaseKeyContactDetails.bulkCreate(caseKeyContactData, {
            returning: true
          });
        }
      }

      const projectFiscalRegionRecords = await ProjectFiscalRegion.findAll({
        where: {
          project_rid: p.project_rid,
          project_fiscal_rid: p.project_fiscal_rid,
          account_rid: data.account_rid,
          fiscal_year : data.fiscal_year
        }, raw : true
      });

      if (projectFiscalRegionRecords.length > 0) {
        const caseProjectFiscalRegionData = projectFiscalRegionRecords.map(regionRecord => ({
          project_fiscal_region_rid: regionRecord.rid,
          case_project_rid: p.project_case_rid || '',
          case_rid: data.case_rid,
          project_rid: regionRecord.project_rid,
          project_code: regionRecord.project_code || '',
          project_fiscal_rid: regionRecord.project_fiscal_rid,
          fiscal_year: regionRecord.fiscal_year,
          created_by: data.created_by,
          created_datetime: new Date(),
          eid: regionRecord.eid,
          industry_rid: regionRecord.industry_rid,
          industry_name: regionRecord.industry_name,
          project_name: regionRecord.project_name,
          program_name: regionRecord.program_name,
          project_type_rid: regionRecord.project_type_rid,
          project_classification_rid: regionRecord.project_classification_rid,
          project_classification_other: regionRecord.project_classification_other,
          project_client_group: regionRecord.project_client_group,
          project_group: regionRecord.project_group,
          auto_send_ai_interaction: regionRecord.auto_send_ai_interaction || false,
          account_rid: regionRecord.account_rid,
          country_rid: regionRecord.country_rid,
          region_rid: regionRecord.region_rid,
          currency_rid: regionRecord.currency_rid,
          max_ai_interaction: regionRecord.max_ai_interaction || 0,
          expiry_duration: regionRecord.expiry_duration,
          auto_access_rd: regionRecord.auto_access_rd,
          status_rid: regionRecord.status_rid || '',
          project_startdate: regionRecord.project_startdate,
          project_enddate: regionRecord.project_enddate,
          total_fte_prj: regionRecord.total_fte_prj,
          total_fte_from_prj_res: regionRecord.total_fte_from_prj_res,
          total_fte_from_tasks: regionRecord.total_fte_from_tasks,
          total_subcon_prj: regionRecord.total_subcon_prj,
          total_subcon_from_prj_res: regionRecord.total_subcon_from_prj_res,
          total_subcon_from_tasks: regionRecord.total_subcon_from_tasks,
          total_nonlabor_prj: regionRecord.total_nonlabor_prj,
          total_nonlabor_from_prj_res: regionRecord.total_nonlabor_from_prj_res,
          total_resources_prj: regionRecord.total_resources_prj,
          total_resources_from_prj_res: regionRecord.total_resources_from_prj_res,
          total_resources_from_tasks: regionRecord.total_resources_from_tasks,
          total_effort_prj: regionRecord.total_effort_prj,
          total_effort_fte_prj: regionRecord.total_effort_fte_prj,
          total_effort_subcon_prj: regionRecord.total_effort_subcon_prj,
          total_effort_from_prj_res: regionRecord.total_effort_from_prj_res,
          total_effort_fte_from_prj_res: regionRecord.total_effort_fte_from_prj_res,
          total_effort_subcon_from_prj_res: regionRecord.total_effort_subcon_from_prj_res,
          total_effort_from_tasks: regionRecord.total_effort_from_tasks,
          total_effort_fte_from_tasks: regionRecord.total_effort_fte_from_tasks,
          total_effort_subcon_from_tasks: regionRecord.total_effort_subcon_from_tasks,
          total_cost_prj: regionRecord.total_cost_prj,
          total_cost_fte_prj: regionRecord.total_cost_fte_prj,
          total_cost_subcon_prj: regionRecord.total_cost_subcon_prj,
          total_cost_nonlabor_prj: regionRecord.total_cost_nonlabor_prj,
          total_cost_from_prj_res: regionRecord.total_cost_from_prj_res,
          total_cost_fte_from_prj_res: regionRecord.total_cost_fte_from_prj_res,
          total_cost_subcon_from_prj_res: regionRecord.total_cost_subcon_from_prj_res,
          total_cost_nonlabor_from_prj_res: regionRecord.total_cost_nonlabor_from_prj_res,
          total_cost_from_tasks: regionRecord.total_cost_from_tasks,
          total_cost_fte_from_tasks: regionRecord.total_cost_fte_from_tasks,
          total_cost_subcon_from_tasks: regionRecord.total_cost_subcon_from_tasks,
          total_cost_prj_blended: regionRecord.total_cost_prj_blended,
          total_cost_fte_prj_blended: regionRecord.total_cost_fte_prj_blended,
          total_cost_subcon_prj_blended: regionRecord.total_cost_subcon_prj_blended,
          total_cost_from_prj_res_blended: regionRecord.total_cost_from_prj_res_blended,
          total_cost_fte_from_prj_res_blended: regionRecord.total_cost_fte_from_prj_res_blended,
          total_cost_subcon_from_prj_res_blended: regionRecord.total_cost_subcon_from_prj_res_blended,
          total_cost_from_tasks_blended: regionRecord.total_cost_from_tasks_blended,
          total_cost_fte_from_tasks_blended: regionRecord.total_cost_fte_from_tasks_blended,
          total_cost_subcon_from_tasks_blended: regionRecord.total_cost_subcon_from_tasks_blended,
          blended_rate_fte: regionRecord.blended_rate_fte,
          blended_rate_subcon: regionRecord.blended_rate_subcon,
          rd_percent_potential_ai: regionRecord.rd_percent_potential_ai,
          rd_percent_adjustment: regionRecord.rd_percent_adjustment,
          rd_percent_final: regionRecord.rd_percent_final,
          qre_fte: regionRecord.qre_fte,
          qre_subcon: regionRecord.qre_subcon,
          qre_nonlabor: regionRecord.qre_nonlabor,
          qre_final: regionRecord.qre_final,
          rd_credits_fte_fed_level: regionRecord.rd_credits_fte_fed_level,
          rd_credits_subcon_fed_level: regionRecord.rd_credits_subcon_fed_level,
          rd_credits_nonlabor_fed_level: regionRecord.rd_credits_nonlabor_fed_level,
          rd_credits_fed_level: regionRecord.rd_credits_fed_level,
          rd_credits_total: regionRecord.rd_credits_total,
          effective_total_fte: regionRecord.effective_total_fte,
          effective_total_subcon: regionRecord.effective_total_subcon,
          effective_total_nonlabor: regionRecord.effective_total_nonlabor,
          effective_cost: regionRecord.effective_cost,
          effective_effort: regionRecord.effective_effort,
          effective_fte_cost: regionRecord.effective_fte_cost,
          effective_fte_effort: regionRecord.effective_fte_effort,
          effective_subcon_cost: regionRecord.effective_subcon_cost,
          effective_subcon_effort: regionRecord.effective_subcon_effort,
          effective_nonlabor_cost: regionRecord.effective_nonlabor_cost,
          effective_metric_type: regionRecord.effective_metric_type,
          default_metric_type: regionRecord.default_metric_type,
          interaction_cc_list: regionRecord.interaction_cc_list,
          assessment_status: regionRecord.assessment_status,
          claim_status: regionRecord.claim_status,
          comments: regionRecord.comments,
          project_description: regionRecord.project_description,
          total_nonlabor_from_tasks: regionRecord.total_nonlabor_from_tasks,
        }));

        await CaseProjectFiscalRegion.bulkCreate(caseProjectFiscalRegionData);
      }


      // Insert CaseProjectResource data
      const projectResourceRecords = await ProjectResource.findAll({
        where: {
          project_rid: p.project_rid,
          project_fiscal_rid: p.project_fiscal_rid,
          account_rid: data.account_rid
        }, raw : true
      });

      if (projectResourceRecords.length > 0) {
        const caseProjectResourceData = projectResourceRecords.map(resourceRecord => ({
          project_resource_rid: resourceRecord.rid,
          case_project_rid: p.project_case_rid || '',
          account_rid: resourceRecord.account_rid,
          case_rid: data.case_rid,
          project_rid: resourceRecord.project_rid,
          project_fiscal_rid: resourceRecord.project_fiscal_rid,
          project_resource_code: resourceRecord.project_resource_code,
          resource_rid: resourceRecord.resource_rid,
          fiscal_year: resourceRecord.fiscal_year,
          created_by: data.created_by,
          created_datetime: new Date(),
          eid: resourceRecord.eid,
          start_date: resourceRecord.start_date,
          end_date: resourceRecord.end_date,
          country_rid: resourceRecord.country_rid,
          region_rid: resourceRecord.region_rid,
          currency_rid: resourceRecord.currency_rid,
          total_hours_pro_res: resourceRecord.total_hours_pro_res,
          total_cost_pro_res: resourceRecord.total_cost_pro_res,
          description: resourceRecord.description,
          status_rid: resourceRecord.status_rid,
          salary: resourceRecord.salary,
          bonus: resourceRecord.bonus,
          insurance: resourceRecord.insurance,
          deductions: resourceRecord.deductions,
          assigned_skill_role_type_rid: resourceRecord.assigned_skill_role_type_rid,
          qre_percent: resourceRecord.qre_percent,
          project_resource_role: resourceRecord.project_resource_role,
          net_total_cost_pro_res: resourceRecord.net_total_cost_pro_res,
          effort_project_resource_level: resourceRecord.effort_project_resource_level,
          cost_project_resource_level: resourceRecord.cost_project_resource_level,
          total_hours_from_tasks: resourceRecord.total_hours_from_tasks,
          total_cost_from_tasks: resourceRecord.total_cost_from_tasks,
          qre_final: resourceRecord.qre_final,
          r_number : resourceRecord.r_number
        }));

        await CaseProjectResource.bulkCreate(caseProjectResourceData);
      }

      // Insert CaseProjectResourceFiscal data
      const projectResourceFiscalRecords = await ProjectResourceFiscal.findAll({
        where: {
          project_rid: p.project_rid,
          project_fiscal_rid: p.project_fiscal_rid,
          account_rid: data.account_rid
        }, raw : true
      });
      if (projectResourceFiscalRecords.length > 0) {
        const caseProjectResourceFiscalData = projectResourceFiscalRecords.map(fiscalRecord => ({
          project_resource_fiscal_rid: fiscalRecord.rid,
          case_project_rid: p.project_case_rid || '',
          account_rid: fiscalRecord.account_rid,
          case_rid: data.case_rid,
          project_rid: fiscalRecord.project_rid,
          project_fiscal_rid: fiscalRecord.project_fiscal_rid,
          resource_rid: fiscalRecord.resource_rid,
          fiscal_year: fiscalRecord.fiscal_year,
          created_by: data.created_by,
          created_datetime: new Date(),
          eid: fiscalRecord.eid,
          total_hours_pro_res: fiscalRecord.total_hours_pro_res,
          total_cost_pro_res: fiscalRecord.total_cost_pro_res,
          status_rid: fiscalRecord.status_rid,
          country_rid: fiscalRecord.country_rid,
          region_rid: fiscalRecord.region_rid,
          currency_rid: fiscalRecord.currency_rid,
          description: fiscalRecord.description,
          effort_project_resource_level: fiscalRecord.effort_project_resource_level,
          cost_project_resource_level: fiscalRecord.cost_project_resource_level,
          cost_project_task_level: fiscalRecord.cost_project_task_level,
          blended_cost_project_task_level: fiscalRecord.blended_cost_project_task_level,
          blended_cost_project_resource_level: fiscalRecord.blended_cost_project_resource_level,
          effort_project_task_level: fiscalRecord.effort_project_task_level,
          total_hours_from_tasks: fiscalRecord.total_hours_from_tasks,
          total_cost_from_tasks: fiscalRecord.total_cost_from_tasks,
          total_cost_from_tasks_blended: fiscalRecord.total_cost_from_tasks_blended,
          rd_percent_potential_ai: fiscalRecord.rd_percent_potential_ai,
          rd_percent_adjustment: fiscalRecord.rd_percent_adjustment,
          rd_percent_final: fiscalRecord.rd_percent_final,
          qre_fte: fiscalRecord.qre_fte,
          qre_subcon: fiscalRecord.qre_subcon,
          qre_nonlabor: fiscalRecord.qre_nonlabor,
          qre_final: fiscalRecord.qre_final,
          rd_credits_fte_region_level: fiscalRecord.rd_credits_fte_region_level,
          rd_credits_subcon_region_level: fiscalRecord.rd_credits_subcon_region_level,
          rd_credits_nonlabor_region_level: fiscalRecord.rd_credits_nonlabor_region_level,
          rd_credits_region_level: fiscalRecord.rd_credits_region_level,
          rd_credits_fte_fed_level: fiscalRecord.rd_credits_fte_fed_level,
          rd_credits_subcon_fed_level: fiscalRecord.rd_credits_subcon_fed_level,
          rd_credits_nonlabor_fed_level: fiscalRecord.rd_credits_nonlabor_fed_level,
          rd_credits_fed_level: fiscalRecord.rd_credits_fed_level,
          rd_credits_total: fiscalRecord.rd_credits_total,
          r_number : fiscalRecord.r_number
        }));

        await CaseProjectResourceFiscal.bulkCreate(caseProjectResourceFiscalData);
      }

      const projectTaskRecords = await ProjectTask.findAll({
        where: {
          project_rid: p.project_rid,
          project_fiscal_rid: p.project_fiscal_rid,
          account_rid: data.account_rid,
        }
      });

      if (projectTaskRecords.length > 0) {
        const caseProjectTaskData = projectTaskRecords.map(taskRecord => ({
          project_task_rid: taskRecord.rid,
          case_project_rid: p.project_case_rid || '',
          account_rid: taskRecord.account_rid,
          case_rid: data.case_rid,
          project_rid: taskRecord.project_rid,
          project_fiscal_rid: taskRecord.project_fiscal_rid,
          project_resource_code: taskRecord.project_resource_code,
          resource_rid: taskRecord.resource_rid,
          fiscal_year: taskRecord.fiscal_year,
          created_by: data.created_by,
          created_datetime: new Date(),
          eid: taskRecord.eid,
          task_name: taskRecord.task_name,
          task_description: taskRecord.task_description,
          task_type_rid: taskRecord.task_type_rid,
          task_classification_rid: taskRecord.task_classification_rid,
          start_date: taskRecord.start_date,
          end_date: taskRecord.end_date,
          country_rid: taskRecord.country_rid,
          region_rid: taskRecord.region_rid,
          currency_rid: taskRecord.currency_rid,
          total_hours_pro_task: taskRecord.total_hours_pro_task,
          total_cost_pro_task: taskRecord.total_cost_pro_task,
          comments: taskRecord.comments,
          status_rid: taskRecord.status_rid,
          project_resource_rid: taskRecord.project_resource_rid,
          r_number : taskRecord.r_number
        }));


        await CaseProjectTask.bulkCreate(caseProjectTaskData);
      }

      iterationCount++;
    }

    if (totalCount === iterationCount) {
      const statusMessage = totalCount === 1
        ? STATUS_MESSAGE.singleProjectAssignedSuccess
        : STATUS_MESSAGE.multipleProjectAssignedSuccess;

      return {
        statusCode: HttpStatus.SUCCESS,
        statusMessage
      };
    } else {
      return {
        statusCode: HttpStatus.FAILED,
        statusMessage: STATUS_MESSAGE.projectAssignFailed,
      }
    }
  }

  async assignProjectToCase(
    data: assignProjectType,
    accountNumber: string,
    schemaName: string
  ) {

    const { CaseProject, Case, CaseSummary, ProjectFiscal } =
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
    const collectProjectFiscalIds = [...new Set(data.projects.map((d: any) => d.project_fiscal_rid))];

    const findProjects = await this.orgDbSequelize.query(rawQueries.getProjectByIds(collectProjectFiscalIds, schemaName))
    const mapProjectById: Map<string, any> = new Map(findProjects[0].map((d: any) => [d.rid, d]));
    for (let p of data.projects) {
      // Insert CaseProjectResource data
      const projectFiscalRecords = await ProjectFiscal.findAll({
        where: {
          project_rid: p.project_rid,
          rid: p.project_fiscal_rid,
          account_rid: data.account_rid
        }
      });

      const projectFiscal = projectFiscalRecords.length > 0 ? projectFiscalRecords[0] : null;

      const createdCaseProject = await CaseProject.create({
        case_rid: data.case_rid,
        account_rid: data.account_rid,
        created_by: data.created_by,
        created_datetime: new Date(),
        project_rid: p.project_rid,
        project_group: p.project_group,
        project_fiscal_rid: p.project_fiscal_rid,
        project_code: projectFiscal?.project_code || '',
        industry_rid: projectFiscal?.industry_rid,
        industry_name: projectFiscal?.industry_name,
        fiscal_year: projectFiscal?.fiscal_year,
        project_name: projectFiscal?.project_name,
        program_name: projectFiscal?.program_name,
        project_classification_rid: projectFiscal?.project_classification_rid,
        project_classification_other: projectFiscal?.project_classification_other,
        project_client_group: projectFiscal?.project_client_group,
        auto_send_ai_interaction: projectFiscal?.auto_send_ai_interaction || false,
        country_rid: projectFiscal?.country_rid,
        region_rid: projectFiscal?.region_rid,
        currency_rid: projectFiscal?.currency_rid,
        max_ai_interaction: projectFiscal?.max_ai_interaction || 0,
        expiry_duration: projectFiscal?.expiry_duration,
        auto_access_rd: projectFiscal?.auto_access_rd,
        project_startdate: projectFiscal?.project_startdate,
        project_enddate: projectFiscal?.project_enddate,
        total_fte_prj: projectFiscal?.total_fte_prj || 0,
        total_fte_from_prj_res: projectFiscal?.total_fte_from_prj_res || 0,
        total_fte_from_tasks: projectFiscal?.total_fte_from_tasks || 0,
        total_subcon_prj: projectFiscal?.total_subcon_prj || 0,
        total_subcon_from_prj_res: projectFiscal?.total_subcon_from_prj_res || 0,
        total_subcon_from_tasks: projectFiscal?.total_subcon_from_tasks || 0,
        total_nonlabor_prj: projectFiscal?.total_nonlabor_prj || 0,
        total_nonlabor_from_prj_res: projectFiscal?.total_nonlabor_from_prj_res || 0,
        total_resources_prj: projectFiscal?.total_resources_prj || 0,
        total_resources_from_prj_res: projectFiscal?.total_resources_from_prj_res || 0,
        total_resources_from_tasks: projectFiscal?.total_resources_from_tasks || 0,
        total_effort_prj: projectFiscal?.total_effort_prj || 0,
        total_effort_fte_prj: projectFiscal?.total_effort_fte_prj || 0,
        total_effort_subcon_prj: projectFiscal?.total_effort_subcon_prj || 0,
        total_effort_from_prj_res: projectFiscal?.total_effort_from_prj_res || 0,
        total_effort_fte_from_prj_res: projectFiscal?.total_effort_fte_from_prj_res || 0,
        total_effort_subcon_from_prj_res: projectFiscal?.total_effort_subcon_from_prj_res || 0,
        total_effort_from_tasks: projectFiscal?.total_effort_from_tasks || 0,
        total_effort_fte_from_tasks: projectFiscal?.total_effort_fte_from_tasks || 0,
        total_effort_subcon_from_tasks: projectFiscal?.total_effort_subcon_from_tasks || 0,
        total_cost_prj: projectFiscal?.total_cost_prj || 0,
        total_cost_fte_prj: projectFiscal?.total_cost_fte_prj || 0,
        total_cost_subcon_prj: projectFiscal?.total_cost_subcon_prj || 0,
        total_cost_nonlabor_prj: projectFiscal?.total_cost_nonlabor_prj || 0,
        total_cost_from_prj_res: projectFiscal?.total_cost_from_prj_res || 0,
        total_cost_fte_from_prj_res: projectFiscal?.total_cost_fte_from_prj_res || 0,
        total_cost_subcon_from_prj_res: projectFiscal?.total_cost_subcon_from_prj_res || 0,
        total_cost_nonlabor_from_prj_res: projectFiscal?.total_cost_nonlabor_from_prj_res || 0,
        total_cost_from_tasks: projectFiscal?.total_cost_from_tasks || 0,
        total_cost_fte_from_tasks: projectFiscal?.total_cost_fte_from_tasks || 0,
        total_cost_subcon_from_tasks: projectFiscal?.total_cost_subcon_from_tasks || 0,
        total_cost_prj_blended: projectFiscal?.total_cost_prj_blended || 0,
        total_cost_fte_prj_blended: projectFiscal?.total_cost_fte_prj_blended || 0,
        total_cost_subcon_prj_blended: projectFiscal?.total_cost_subcon_prj_blended || 0,
        total_cost_from_prj_res_blended: projectFiscal?.total_cost_from_prj_res_blended || 0,
        total_cost_fte_from_prj_res_blended: projectFiscal?.total_cost_fte_from_prj_res_blended || 0,
        total_cost_subcon_from_prj_res_blended: projectFiscal?.total_cost_subcon_from_prj_res_blended || 0,
        total_cost_from_tasks_blended: projectFiscal?.total_cost_from_tasks_blended || 0,
        total_cost_fte_from_tasks_blended: projectFiscal?.total_cost_fte_from_tasks_blended || 0,
        total_cost_subcon_from_tasks_blended: projectFiscal?.total_cost_subcon_from_tasks_blended || 0,
        blended_rate_fte: projectFiscal?.blended_rate_fte || 0,
        blended_rate_subcon: projectFiscal?.blended_rate_subcon || 0,
        rd_percent_potential_ai: projectFiscal?.rd_percent_potential_ai || 0,
        rd_percent_adjustment: projectFiscal?.rd_percent_adjustment || 0,
        rd_percent_final: projectFiscal?.rd_percent_final || 0,
        qre_fte: projectFiscal?.qre_fte || 0,
        qre_subcon: projectFiscal?.qre_subcon || 0,
        qre_nonlabor: projectFiscal?.qre_nonlabor || 0,
        qre_final: projectFiscal?.qre_final || 0,
        rd_credits_fte_fed_level: projectFiscal?.rd_credits_fte_fed_level || 0,
        rd_credits_subcon_fed_level: projectFiscal?.rd_credits_subcon_fed_level || 0,
        rd_credits_nonlabor_fed_level: projectFiscal?.rd_credits_nonlabor_fed_level || 0,
        rd_credits_fed_level: projectFiscal?.rd_credits_fed_level || 0,
        rd_credits_total: projectFiscal?.rd_credits_total || 0,
        interaction_cc_list: projectFiscal?.interaction_cc_list,
        assessment_status: projectFiscal?.assessment_status,
        claim_status: projectFiscal?.claim_status,
        comments: projectFiscal?.comments,
        project_description: projectFiscal?.project_description,
        status_rid: projectFiscal?.status_rid,
        project_type_rid: projectFiscal?.project_type_rid,
        effective_total_fte: projectFiscal?.effective_total_fte || 0,
        effective_total_subcon: projectFiscal?.effective_total_subcon || 0,
        effective_total_nonlabor: projectFiscal?.effective_total_nonlabor || 0,
        effective_cost: projectFiscal?.effective_cost || 0,
        effective_effort: projectFiscal?.effective_effort || 0,
        effective_fte_cost: projectFiscal?.effective_fte_cost || 0,
        effective_fte_effort: projectFiscal?.effective_fte_effort || 0,
        effective_subcon_cost: projectFiscal?.effective_subcon_cost || 0,
        effective_subcon_effort: projectFiscal?.effective_subcon_effort || 0,
        effective_nonlabor_cost: projectFiscal?.effective_nonlabor_cost || 0,
        effective_metric_type: projectFiscal?.effective_metric_type,
        default_metric_type: projectFiscal?.default_metric_type,
        // is_rd_claim_qualified: projectFiscal?.is_rd_claim_qualified || false,
        rd_percent_potential_ai_updated: projectFiscal?.rd_percent_potential_ai_updated || 0,
        total_nonlabor_from_tasks: projectFiscal?.total_nonlabor_from_tasks || 0,

      });
      p.project_case_rid = createdCaseProject.rid;
      iterationCount += 1;
    }
    if (totalCount === iterationCount) {
      const getTotalProjects: any = await this.orgDbSequelize.query(
        rawQueries.getTotalProjectsCountInCase(schemaName, data.fiscal_year, data.account_rid, data.case_rid)
      )
      // If value is zero, update as null
      const totalProjects = getTotalProjects[0][0].total_projects === 0 ? null : getTotalProjects[0][0].total_projects;
      const totalProjectsCost = getTotalProjects[0][0].total_projects_cost === 0 ? null : getTotalProjects[0][0].total_projects_cost;
      const totalProjectsQreCost = getTotalProjects[0][0].total_projects_qre_cost === 0 ? null : getTotalProjects[0][0].total_projects_qre_cost;
      await this.orgDbSequelize.query(
        rawQueries.updateCostCountInCase(
          schemaName,
          data.case_rid,
          totalProjects,
          totalProjectsCost,
          totalProjectsQreCost
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
          data: data,
        };
      } else {
        return {
          statusCode: HttpStatus.SUCCESS,
          statusMessage: STATUS_MESSAGE.multipleProjectAssignedSuccess,
          data: data,
        };
      }
    }
    else {
      return {
        statusCode: HttpStatus.FAILED,
        statusMessage: STATUS_MESSAGE.projectAssignFailed,
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
      await CaseProjectTask.destroy({
        where: {
          case_rid: data.case_rid,
          account_rid: data.account_rid,
          project_fiscal_rid: p.project_fiscal_rid,
        },
      });
      await CaseProjectResourceFiscal.destroy({
        where: {
          case_rid: data.case_rid,
          account_rid: data.account_rid,
          project_fiscal_rid: p.project_fiscal_rid,
        },
      })
      await CaseProjectResource.destroy({
        where: {
          case_rid: data.case_rid,
          account_rid: data.account_rid,
          project_fiscal_rid: p.project_fiscal_rid,
        },
      });
      await CaseProjectFiscalRegion.destroy({
        where: {
          case_rid: data.case_rid,
          account_rid: data.account_rid,
          project_fiscal_rid: p.project_fiscal_rid,
        },
      });
      await CaseKeyContactDetails.destroy({
        where: {
          case_rid: data.case_rid,
          account_rid: data.account_rid,
          entity_rid: p.project_fiscal_rid,
        },
      });
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
      const getTotalProjects: any = await this.orgDbSequelize.query(
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
    }
    else {
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
          project_group: p.project_group === ''
            ? { [Op.or]: ['', null] }
            : p.project_group
        }
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
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await this.caseModelService.getSequelize();
    }
    if (!this.mainDbSequelize) {
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
    if (!emailRecipientRid || emailRecipientRid.length === 0) {
      return [];
    }
    else {
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
        rawQueries.fetchCaseInfo(schemaName, caseRid),
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
    const [templateDetails]: any[] = await this.mainDbSequelize.query(
      rawQueries.fetchEmailTemplateByCategory(categoryName),
      {
        type: "SELECT",
      }
    );


    return templateDetails;
  }


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
        description = `Case created with title: ${caseData.case_title || caseData.case_name || "N/A"
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
          const fullName = `${user.first_name || ""} ${user.last_name || ""
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
    userId: string,
    accessToken: string
  ) {
    try {
      const { CaseTask, CaseTeam, Case } =
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

      if(!this.mainDbSequelize) {
        this.mainDbSequelize = await this.caseModelService.getMainSequelize();
      } 
       if(!this.orgDbSequelize) {
        this.orgDbSequelize = await this.caseModelService.getSequelize();
      }   
      

      // Fetch user names from mainDbSequelize using rawQueries
      const userRids = teamMembers.map((tm: any) => tm.user_rid);
      let userNamesMap: Map<string, string> = new Map();
      let userEmailsMap: Map<string, string> = new Map();
      if (userRids.length > 0 && this.mainDbSequelize) {
        const users = await this.mainDbSequelize.query(
          rawQueries.fetchUser(userRids)
        );
        if (users && Array.isArray(users) && users[0] && Array.isArray(users[0])) {
          users[0].forEach((user: any) => {
            userNamesMap.set(user.rid, `${user.first_name} ${user.last_name}`);
            userEmailsMap.set(user.rid, user.email);
          });
        }
      }
      const [todoStatus]: any[] = await this.mainDbSequelize!.query(
        rawQueries.getSpecificTaskStatus(),
        { type: "SELECT" }  
      );
       const [caseInfo]: any[] = await this.mainDbSequelize.query(
                        rawQueries.fetchCasesInfo(caseReq.case_rid),
                        {
                          replacements: { case_rid: caseReq.case_rid },
                          type: "SELECT"
                        });
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(
        /\D/g,
        ""
      )}`;
     

      // Enrich teamMembers with user_name
      const enrichedTeamMembers = teamMembers.map((tm: any) => ({
        ...tm,
        user_name: userNamesMap.get(tm.user_rid) || null,
        email: userEmailsMap.get(tm.user_rid) || null,
      }));
      for (const member of teamMembers) {
        const newAssignedTo = enrichedTeamMembers.find(etm => etm.user_rid === member.user_rid)?.user_rid || null;
        // Only update if the previous value is not the same as the new value
        const response = await CaseTask.update(
          {
            assigned_to: newAssignedTo,
          },
          {
            where: {
              case_rid: caseReq.case_rid,
              account_rid: caseReq.account_rid,
              case_team_member_role_rid: member.role_rid,
              [Op.and]: [
                {
                  [Op.or]: [
                    { assigned_to: '' },
                    { assigned_to: null },
                    { task_status_rid: todoStatus.rid }
                  ]
                },
                {
                  [Op.or]: [
                    { assigned_to: null },
                    { assigned_to: { [Op.ne]: newAssignedTo } }
                  ]
                }
              ]
            },
            returning: true
          }
        );
        // For each updated row, trigger rule engine payload with the updated rid
        if (response[0] > 0 && response[1] && Array.isArray(response[1])) {
          for (const updatedRow of response[1]) {
             const [taskInfo]: any[] = await this.orgDbSequelize.query(
                        rawQueries.getTaskInfo(updatedRow.rid,schemaName),
                        {
                          replacements: { case_rid: updatedRow.rid },
                          type: "SELECT"
                        });
            let ruleEnginePayload = {
              caseName: caseInfo?.case_name || "Case",
              taskName: taskInfo?.task_name || "Task",
              eventName: ruleNames.taskCreated,
              templateName: ruleTemplateNames.taskCreated,
              userId: userId,
              accountRid: caseReq.account_rid,
              newValue: userNamesMap.get(userId),
              targetUserID: enrichedTeamMembers.find(etm => etm.user_rid === member.user_rid)?.user_rid || null,
              targetEmail: enrichedTeamMembers.find(etm => etm.user_rid === member.user_rid)?.email || null,
              entityRid: updatedRow.rid, // Use the updated task rid
              task: "Assigned",
              status: caseInfo.case_name || '',
              triggerType: "validation",
              entity:"Task"
            };
            this.triggerRuleEngine(ruleEnginePayload, accessToken);
          }
        }
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
      return `Validation error for user ${teamMember.user_rid}: ${(error as Error).message
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
    isDropdownList?: boolean,
    statusRid?: string
  ) {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await initMainDbSequelize()
      }
      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await initOrgSequelize()
      }
      const { CaseTeam } = await this.caseModelService.getModels(accountNumber);
      let whereConditions;

      if (isDropdownList) {
        whereConditions = {
          case_rid: data.case_rid,
          account_rid: data.account_rid,
          status_rid: statusRid
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
        raw: true
      };
      let caseTeamMembers = await CaseTeam.findAll(queryOptions);
      const userIds = [...new Set(caseTeamMembers.map((d: any) => d.user_rid))];
      if (isDropdownList) {
        if (userIds.length > 0) {
          const getUserDetails = await this.mainDbSequelize.query(rawQueries.getOwnerDetails(userIds));
          const userMap = new Map(getUserDetails[0].map((d: any) => [d.rid, {name : d.name, profile_url : d.profile_url}]));
          const finalData = await Promise.all(caseTeamMembers.map(async (d: any) => {
            let profileUrl;
            let userName;
            if(userMap.get(d.user_rid) !== undefined) {
              userName = userMap.get(d.user_rid)?.name || null
              if(userMap.get(d.user_rid)?.profile_url !== null) {
                profileUrl = await generateSasUrl(userMap.get(d.user_rid)?.profile_url);
              } else {
                profileUrl = null
              }
            } else {
              profileUrl = null
              userName = null
            }
            return {
              ...d,
              user_name: userName,
              profile_url : profileUrl
            }
          }))
          return finalData
        }
        return caseTeamMembers
      } else {
          if (userIds.length > 0) {
          let userAssignedCountMap = new Map();
          let schemaName = rawQueries.fetchSchemaName(accountNumber)
          let countResult: any = await this.orgDbSequelize.query(rawQueries.getUserAssignedCount(schemaName, userIds, data.case_rid))
          countResult[0][0].assigned_user_details.forEach((d: any) => {
            userAssignedCountMap.set(d.user_rid, d.total_task_assigned_count)
          })
          caseTeamMembers = caseTeamMembers.map((d: any) => {
            return {
              ...d,
              assigned_task_count: userAssignedCountMap.get(d.user_rid) || 0
            }
          })
          return caseTeamMembers;
        }
        return caseTeamMembers
      }
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
      if (scope != 'all') {
        const users = await this.mainDbSequelize.query(
          rawQueries.listUsersForCaseTeam(accountRid),
          {
            type: "SELECT",
          }
        );
        const finalData = await Promise.all(users.map(async(data : any) => {
          let profileUrl;
          if(data.profile_url !== null) {
            profileUrl = await generateSasUrl(data.profile_url)
          } else {
            profileUrl = null
          }
          return {
            ...data,
            profile_url : profileUrl
          }
        }))
        return finalData;
      }
      else {
        const users = await this.mainDbSequelize.query(
          rawQueries.listAllUsers(),
          {
            type: "SELECT",
          }
        );
        const finalData = await Promise.all(users.map(async(data : any) => {
          let profileUrl;
          if(data.profile_url !== null) {
            profileUrl = await generateSasUrl(data.profile_url)
          } else {
            profileUrl = null
          }
          return {
            ...data,
            profile_url : profileUrl
          }
        }))
        return finalData;

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
  async cloneDefaultMilestoneTaskTemplate(accountRid: string, caseRid: string, filing_type_rid: string, taskTypeRid: string, accountNumber: string, transaction: Transaction, caseStartDate: Date, taskStatusRid: string, createdBy : string, fiscalYear : number) {
    const { CaseTask, CaseMilestone, CaseTaskWorkflowConnector, TaskSummary } = await this.caseModelService.getModels(accountNumber);
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const fetchStatusRid: any = await this.mainDbSequelize.query(rawQueries.getActiveStatusId())
    const queryResult: any = await this.mainDbSequelize.query(fetchMilestoneTaskTemplate(taskTypeRid, filing_type_rid, fetchStatusRid[0][0].rid));
    let clonedData = queryResult[0][0]
    let milestoneSequenceNumber: any[] = []
    let milestoneMap: Map<string, string> = new Map();
    if (clonedData.milestone_data !== null) {
      const finalMilestoneData = clonedData.milestone_data.map((d: any) => {
        milestoneMap.set(d.milestone_rid, d.milestone_sequence_no);
        milestoneSequenceNumber.push(d.milestone_sequence_no)
        delete d.milestone_sequence_no
        return {
          ...d,
          account_rid: accountRid,
          case_rid: caseRid,
          rid: d.milestone_rid
        }
      })
      const result = await CaseMilestone.bulkCreate(finalMilestoneData, { transaction })
      if (clonedData.task_data !== null) {
        let startDate: Date;
        let endDate: Date;
        let startDateMap: Map<number, Date> = new Map();
        let endDateMap: Map<number, Date> = new Map();
        let startDateStorage;
        let endDateStorage;
        let otherMileStoneStartDateStorage;
        let otherMileStoneEndDateStorgae;
        let validEndDate;
        let otherStartDateMap: Map<number, Date> = new Map()
        let otherEndDateMap: Map<number, Date> = new Map()
        let firstMilestoneEntered: boolean = false
        let secondMilestoneEntered: boolean = false
        let otherMilestoneEntered: boolean = false
        let firstMilestoneDatePicker: boolean = false
        let firstMilestoneForSecondDatePicker: boolean = false
        if (clonedData.task_data.length > 0) {
          for (let d of clonedData.task_data) {
            if (milestoneMap.get(d.milestone_template_rid) === "1") {
              if (!firstMilestoneEntered) {
                firstMilestoneEntered = true
                if (d.sequence_no === 1) {
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
              let day: any
              if (milestoneMap.get(d.milestone_template_rid) === "2") {
                if (!firstMilestoneEntered && !secondMilestoneEntered) {
                  validEndDate = caseStartDate
                  secondMilestoneEntered = true
                  day = dayjs(validEndDate)
                  d.effort_in_days = d.effort_in_days - 1
                }
                else if (firstMilestoneEntered && !firstMilestoneForSecondDatePicker) {
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
                if (!firstMilestoneEntered && !secondMilestoneEntered && !otherMilestoneEntered) {
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
                  validEndDate = otherMileStoneEndDateStorgae
                  day = dayjs(validEndDate)

                  day = day.add(1, 'day')
                  firstMilestoneDatePicker = true
                  d.effort_in_days = d.effort_in_days
                }
              }
              if (d.sequence_no === 1) {
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
          let mapValueHolderForStart: any;
          let mapValueHolderForEnd: any
          const finalTaskData = clonedData.task_data.map((d: any) => {
            if (milestoneMap.get(d.milestone_template_rid) === "1") {
              mapValueHolderForStart = startDateMap.get(d.task_name)
              mapValueHolderForEnd = endDateMap.get(d.task_name)
            } else {
              mapValueHolderForStart = otherStartDateMap.get(d.task_name)
              mapValueHolderForEnd = otherEndDateMap.get(d.task_name)
            }
            return {
              ...d,
              effective_start_datetime: mapValueHolderForStart,
              effective_end_datetime: mapValueHolderForEnd,
              account_rid: accountRid,
              case_rid: caseRid,
              task_status_rid: taskStatusRid,
              rid: d.task_rid,
              created_by : createdBy
            }
          })
          let finalWorkFlowData;
          if (clonedData.workflow_data !== null) {
            finalWorkFlowData = clonedData.workflow_data.map((d: any) => {
              return {
                ...d,
                account_rid: accountRid,
                case_rid: caseRid,
                created_by : createdBy,
              }
            })
            await CaseTaskWorkflowConnector.bulkCreate(finalWorkFlowData, { transaction });
          }
          const bulkCreateResult = await CaseTask.bulkCreate(finalTaskData, { returning : true, transaction })
          let taskSummaryData = bulkCreateResult.map(d => d.get({plain : true}));
          let filteredDataForSummary = taskSummaryData.map((d) => {
            return {
              task_rid: d.rid,
              r_number: d.r_number || "",
              account_rid: d.account_rid || "",
              attach_to: d.case_rid || "",
              attachment_level: "case",
              task_name: d.task_name || "",
              description: d.task_description || "",
              fiscal_year: fiscalYear || 0,
              assigned_to: d.assigned_to || "",
              status_rid: taskStatusRid || "",
              priority_rid: d.priority_rid || "",
              effective_start_datetime: d.effective_start_datetime!,
              effective_end_datetime: d.effective_end_datetime!,
              created_by:  createdBy || "",
              created_datetime: new Date(),
              task_type_rid: taskTypeRid || "",
            }
          })
          await TaskSummary.bulkCreate(filteredDataForSummary)
          await this.cloneDefaultChecklistTemplate(accountRid, caseRid, filing_type_rid, accountNumber, transaction, finalTaskData)
        }
      }
    }
  }
  async cloneDefaultChecklistTemplate(accountRid: string, caseRid: string, filing_type_rid: string, accountNumber: string, transaction: Transaction, finalTaskData: any) {
    const { CheckList, CheckListItem, AdminCheckListItem, AdminChecklist } = await this.caseModelService.getModels(accountNumber);

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
            checklist_template_rid: task.checklist_template_rid,
            account_rid: accountRid,
            created_datetime: new Date(),
            created_by: task.created_by,
            case_rid: caseRid
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
  async getTaskType() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const [result] = await this.mainDbSequelize.query<TaskTypeResponse>(rawQueries.getSpecificTaskType(), { type: QueryTypes.SELECT });
    if (result) return result
    else return null;
  }
  async getTaskStatus() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const [result] = await this.mainDbSequelize.query<TaskTypeResponse>(rawQueries.getSpecificTaskStatus(), { type: QueryTypes.SELECT });
    if (result) return result
    else return null;
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
          senderEmailInfo[0]?.tenant_id,
      };
    } catch (err) {
      logMessage(`Error fetching sender email info for account: ${err}`);
    }
  }
  async fetchAssignedToRole(assignedTo: string, caseRid: string, accountRid: string, accountNumber: string) {
    const { CaseTeam } = await this.caseModelService.getModels(accountNumber);
    const result = await CaseTeam.findOne({
      where: {
        case_rid: caseRid,
        account_rid: accountRid,
        user_rid: assignedTo
      }, raw: true
    });
    return result;
  }
  async getCaseSubmissionDate(data: any,accountNumber: string) {
    if (!this.mainDbSequelize) this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    if(!this.orgDbSequelize){
      this.orgDbSequelize = await this.caseModelService.getSequelize();
    }
    const schemaName = rawQueries.fetchSchemaName(accountNumber)
    const [accountFiscalInfo]: any[] = await this.orgDbSequelize.query(
      rawQueries.fetchAccountDetailsInfo(
        schemaName,data.account_rid, 
      ), { type: 'SELECT' }
    );
    const fiscalStart = accountFiscalInfo?.fiscal_start_date; // e.g. 'Apr/01'
    const fiscalEnd = accountFiscalInfo?.fiscal_end_date; // e.g. 'Mar/31'
    const fiscalYear = data.fiscal_year;
    if (!fiscalStart || !fiscalEnd) return "";
    // Start date
    const formattedStartDate = parseFiscalDate(fiscalStart, fiscalYear);
    const endYear = getFiscalEndYear(fiscalStart, fiscalEnd, fiscalYear);
    const formattedEndDate = parseFiscalDate(fiscalEnd, endYear);

    // Now send both to fetchPlatformConfig
    let [platFormConfig]: any[] = await this.mainDbSequelize.query(
      rawQueries.fetchPlatformConfig(
        data.country_rid, formattedStartDate, formattedEndDate
      ), { type: 'SELECT' }
    );
    if(!platFormConfig) return "";
    const submissionMonth = platFormConfig?.config_json?.submission_date;
    if (!submissionMonth) return "";

  const submissionDate = new Date(formattedEndDate);
  submissionDate.setMonth((submissionDate.getMonth()) + parseInt(submissionMonth));

  // Return only the date part as YYYY-MM-DD
  return submissionDate.toISOString().split('T')[0];
  }

  async triggerRuleEngine(data: any, accessToken: string): Promise<void> {
      try {
        console.log("Triggering rule engine with data:", data); 
        const RULE_ENGINE_BASE_URL = process.env.RULEBUILDER_BASE_URL;
        const response = await axios.post(
                `${RULE_ENGINE_BASE_URL}/workflow/execute`,
                {
                  ...data
                },
                {
                  headers: {
                    "x-user-id": data.userId,
                    Authorization: `${accessToken}`,
                  },
                }
              );
      } catch (err) {
        console.log(err)
        logMessage(`Error triggering rule engine: ${err}`);
        throw this.throwServiceError(err as Error);
      }
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
            else if (filteredColumns == "country_rid") {
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
