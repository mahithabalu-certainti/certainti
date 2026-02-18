import moment from "moment";
import "moment-timezone";
import { initOrgSequelize } from "../config/orgDataSource";
import { Project, setupProjectSequence } from "../models/project";
import {
  HttpStatus,
  SCHEMANAME_PREFIX,
  primaryKeyContacts,
  rawQueries,
  STATUS_MESSAGE,
} from "../utils/constants";
import {
  ICreateProject,
  IUpdateProject,
  IUpdateQrePecentAdjustment,
  CaseStatusResult,
} from "../utils/types";
import SchemaService from "./schemaService";
import {
  ProjectTimeline,
  setupProjectTimelineSeq,
} from "../models/projectTimeline";
import { ProjectFiscal, setupProjectFiscal } from "../models/projectFiscal";
import { Op, Sequelize } from "sequelize";
import {
  ProjectHistory,
  setupProjectHistorySeq,
} from "../models/projectHistory";
import { initMainDbSequelize } from "../config/mainDataSource";
import {
  KeyContact,
  setupKeyContactsSequence,
} from "../models/keyContactDetails";
import currency from "currency.js";
import ProjectIngestionService from "./projectIngestionService";
import {
  AccountFiscal,
  setupAccountFiscalSequence,
} from "../models/accountFiscal";
import { isValidTimezone } from "../utils/valideTimeChecker";
import { Logger } from "winston";
import Decimal from "decimal.js";
import { setupProjectFiscalRegion } from "../models/projectFiscalRegion";
import {
  AccountFiscalRegion,
  setupAccountFiscalRegionSequence,
} from "../models/accountFiscalRegion";
import { errorLog, logMessage } from "../utils/helpers";
import { checkProjectMappedToProjectRes, fetchQreHistoryDatas } from "../utils/rawQueries";
import { Case } from "../models/caseModel";
import { getFiscalEndYear, parseFiscalDate } from "../utils/dateUtils";

export class ProjectService {
  private schemaService: SchemaService;
  private projectIngestion: ProjectIngestionService;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.schemaService = new SchemaService();
    this.projectIngestion = new ProjectIngestionService(this.logger);
  }

  /**
 * Creates a new project in the appropriate schema based on account configuration.
 *
 * @async
 * @function createProject
 * @param {ICreateProject} projectData - The data required to create a project (e.g., name, account ID, fiscal info).
 * @param {string} userId - The ID of the user initiating the creation request.
 * @returns {Promise<{
 *   statusCode: number;
  *   message: string;
  *   errorMessage?: string;
  *   data?: { project: any };
  * }>} Returns status code, success message, and created project object or an error message.
  *
  * @throws {Error} If account is invalid, inactive, or schema doesn't exist.
  *
  * @description
  * - Validates that the provided account ID exists and is active.
  * - If the account uses `store_in_parent`, fetches the parent account's schema.
  * - Checks whether the appropriate schema exists.
  * - Ensures project tables are created in the correct schema.
  * - Persists the project data using `createProjectRecords`.
  */
  async createProject(
    projectData: ICreateProject,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { project: any };
  }> {
    try {
      const { account_id } = projectData;

      const accountData = await this.schemaService.fetchAccountById(account_id);

      if (!accountData) {
        errorLog("Error creating project: Invalid account ID");
        throw new Error("Error creating project: Invalid account ID");
      }

      if (accountData.status !== "active") {
        errorLog("Project creation failed: The selected account is inactive. Please choose an active account.");
        throw new Error(
          "Project creation failed: The selected account is inactive. Please choose an active account."
        );
      }

      let accountNumber = accountData.r_number;

      if (
        accountData.parent_account_rid === null ||
        accountData.parent_account_rid === ""
      ) {
        errorLog("Error creating project: Invalid account ID");
        throw new Error("Error creating project: Invalid account ID");
      }
      logMessage(`Account data fetched successfully ${JSON.stringify(accountData)}`);

      if (accountData.storage_type === "store_in_parent") {
        accountNumber = await this.schemaService.fetchParentAccount(
          accountData.parent_account_rid
        );
      }

      const isExists = await this.schemaService.checkIfSchemaExists(
        accountNumber
      );

      if (!isExists) {
        errorLog("Invalid account ID: schema doesn't exists");
        throw new Error("Invalid account ID: schema doesn't exists");
      }

      await this.createProjectTables(accountNumber);

      projectData.created_by = userId;
      projectData.modified_by = userId;

      const project = await this.createProjectRecords(
        projectData,
        accountNumber,
        accountData,
        userId
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          project,
        },
      };
    } catch (err) {
      errorLog("Error creating project", (err as Error).message);
      return this.throwServiceError(err as Error);
    }
  }

  async createProjectTables(accountNumber: string) {
    try {
      const orgDbSequlize = await initOrgSequelize();
      const mainDbSequlize = await initMainDbSequelize();
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;

      const KeyContactModel = await KeyContact.initialize(
        orgDbSequlize,
        schemaName
      );

      const ProjectModel = await Project.initialize(orgDbSequlize, schemaName);

      const ProjectFiscalModel = await ProjectFiscal.initialize(
        orgDbSequlize,
        schemaName
      );

      const ProjectTimelineModel = await ProjectTimeline.initialize(
        orgDbSequlize,
        schemaName
      );
      const ProjectHistoryModel = await ProjectHistory.initialize(
        orgDbSequlize,
        schemaName
      );
      const AccountFiscalModel = await AccountFiscal.initialize(
        orgDbSequlize,
        schemaName
      );
      const AccountFiscalRegionModel = await AccountFiscalRegion.initialize(
        orgDbSequlize,
        schemaName
      );

      await ProjectModel.sync({ force: false });
      await ProjectFiscalModel.sync({ force: false });
      await KeyContactModel.sync({ force: false });
      await ProjectHistory.sync({ force: false });
      await ProjectTimelineModel.sync({ force: false });
      await ProjectHistoryModel.sync({ force: false });
      await AccountFiscalModel.sync({ force: false });
      await AccountFiscalRegionModel.sync({ force: false });
      await setupProjectSequence(orgDbSequlize, schemaName);
      await setupProjectFiscal(orgDbSequlize, schemaName);
      await setupAccountFiscalRegionSequence(orgDbSequlize, schemaName);
      await setupProjectFiscalRegion(orgDbSequlize, schemaName);
      await setupProjectTimelineSeq(orgDbSequlize, schemaName);
      await setupProjectHistorySeq(orgDbSequlize, schemaName);
      await setupKeyContactsSequence(orgDbSequlize, schemaName);
      await setupAccountFiscalSequence(orgDbSequlize, schemaName);
      await setupAccountFiscalRegionSequence(orgDbSequlize, schemaName);
    } catch (err) {
      errorLog("Error creating project tables", (err as Error).message);
      return this.throwServiceError(err as Error);
    }
  }

  async createProjectRecords(
    projectData: ICreateProject,
    accountNumber: string,
    accountData: any,
    userId: string
  ): Promise<any> {
    try {
      const existing = await this.projectIngestion.checkIfProjectExists(
        accountNumber,
        projectData,
        accountData
      );

      let createdProjectId = "";
      logMessage(`Existing project check result: ${existing}`);
      if (existing === "fiscal_exists") {
        errorLog("Project already exists in the account for the fiscal year");
        throw new Error(
          "Project already exists in the account for the fiscal year"
        );
      }

      if (existing === "project_exists") {
        const existingProject = await this.projectIngestion.getProjectByCode(
          accountNumber,
          projectData.project_code,
          accountData.rid
        );

        if (existingProject && existingProject.rid) {
          const createdProjectFiscal =
            await this.projectIngestion.addProjectFiscal(
              accountNumber,
              projectData,
              existingProject.rid,
              userId
            );

          if (projectData.region_rid) {
            await this.projectIngestion.addProjectFiscalRegion(
              accountNumber,
              projectData,
              createdProjectFiscal,
              existingProject.rid,
              userId
            );
          }

          if (createdProjectFiscal && createdProjectFiscal.rid) {
            createdProjectId = createdProjectFiscal.rid;
            await this.projectIngestion.addProjectFiscalSummary(
              accountNumber,
              projectData,
              createdProjectFiscal,
              existingProject.rid,
              projectData.key_contacts,
              createdProjectFiscal.rid
            );

            await this.projectIngestion.updateProjectAggregatesFromFiscal(
              accountNumber,
              accountData.rid,
              existingProject.project_code
            );

            await this.projectIngestion.updateProjectSummaryAggregatesFromFiscal(
              accountNumber,
              existingProject.project_code,
              accountData.rid
            );

            await this.projectIngestion.addAccountFiscal(
              accountNumber,
              projectData
            );

            if (projectData.region_rid) {
              await this.projectIngestion.addAccountFiscalRegion(
                accountNumber,
                projectData
              );
            }

            await this.projectIngestion.updateAccountAggregatesFromAccountFiscal(
              accountNumber,
              projectData.account_id
            );

            if (projectData.key_contacts && createdProjectFiscal.rid) {
              await this.projectIngestion.manageKeyContacts(
                projectData.key_contacts,
                createdProjectFiscal.rid,
                projectData.created_by,
                accountNumber
              );
            }
          }
        }

        return {
          rid: createdProjectId,
        };
      } else {
        const createdProject =
          await this.projectIngestion.createProjectWithFiscal(
            accountNumber,
            projectData,
            userId
          );

        if (createdProject && createdProject.rid) {
          createdProjectId = createdProject.rid;
          const createdProjectFiscal =
            await this.projectIngestion.addProjectFiscal(
              accountNumber,
              projectData,
              createdProject.rid,
              userId
            );

          if (projectData.region_rid) {
            await this.projectIngestion.addProjectFiscalRegion(
              accountNumber,
              projectData,
              createdProjectFiscal,
              createdProjectFiscal.project_rid,
              userId
            );
          }

          const startDate = projectData.project_startdate
            ? moment.utc(projectData.project_startdate, "YYYY-MM-DD")
            : null;
          const endDate = projectData.project_enddate
            ? moment.utc(projectData.project_enddate, "YYYY-MM-DD")
            : null;

          await this.projectIngestion.addProjectSummary(
            accountNumber,
            projectData,
            createdProject,
            startDate,
            endDate,
            projectData.key_contacts
          );

          await this.projectIngestion.addProjectFiscalSummary(
            accountNumber,
            projectData,
            createdProjectFiscal,
            createdProject.rid,
            projectData.key_contacts,
            createdProjectFiscal.rid || ""
          );

          await this.projectIngestion.addAccountFiscal(
            accountNumber,
            projectData
          );

          await this.projectIngestion.autoAssignToDefaultUserGroup(
            createdProject.rid,
            accountData.rid,
            userId
          );

          if (projectData.region_rid) {
            await this.projectIngestion.addAccountFiscalRegion(
              accountNumber,
              projectData
            );
          }

          await this.projectIngestion.updateAccountAggregatesFromAccountFiscal(
            accountNumber,
            projectData.account_id
          );

          if (projectData.key_contacts) {
            await this.projectIngestion.manageKeyContacts(
              projectData.key_contacts,
              createdProject.rid || "",
              projectData.created_by,
              accountNumber
            );
            await this.projectIngestion.manageKeyContacts(
              projectData.key_contacts,
              createdProjectFiscal.rid || "",
              projectData.created_by,
              accountNumber
            );
          }

          await this.projectIngestion.addProjectTimeline(
            accountNumber,
            projectData.account_id,
            "create",
            createdProjectFiscal.rid,
            projectData
          );
        }
      }

      return { rid: createdProjectId };
    } catch (err) {
      errorLog("Error creating project records", (err as Error).message);
      throw new Error((err as Error).message);
    }
  }

  /**
 * Updates an existing project in the appropriate schema based on account configuration.
 *
 * @async
 * @function updateProject
 * @param {IUpdateProject} projectData - The data to update the project with (includes account ID and project details).
 * @param {string} userId - The ID of the user performing the update.
 * @returns {Promise<{
 *   statusCode: number;
  *   message: string;
  *   errorMessage?: string;
  *   data?: { project: any[] };
  * }>} Returns status code, success message, and an empty project array on success or throws an error.
  *
  * @throws {Error} If the account is inactive, invalid, or the schema/table does not exist.
  *
  * @description
  * - Validates that the provided account ID exists and is active.
  * - If the account uses `store_in_parent`, fetches the parent account's schema.
  * - Checks whether the appropriate schema and project table exist.
  * - Calls `updateProjectRecords` to update the project data in the database.
  * - Returns success response with an empty project array.
  */
  async updateProject(
    projectData: IUpdateProject,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { project: any };
  }> {
    try {
      const { account_id } = projectData;

      const accountData = await this.schemaService.fetchAccountById(account_id);

      if (accountData.status !== "active") {
        errorLog("Project update failed: The selected account is inactive. Please choose an active account.");
        throw new Error(
          "Project creation failed: The selected account is inactive. Please choose an active account."
        );
      }

      if (!accountData) {
        errorLog("Invalid account ID.");
        throw new Error("Invalid account ID.");
      }

      if (
        accountData.parent_account_rid === null ||
        accountData.parent_account_rid === ""
      ) {
        errorLog("Invalid account ID");
        throw new Error("Invalid account ID");
      }
      logMessage(`Account data fetched successfully ${JSON.stringify(accountData)}`);

      let accountNumber = accountData.r_number;

      if (accountData.storage_type === "store_in_parent") {
        accountNumber = await this.schemaService.fetchParentAccount(
          accountData.parent_account_rid
        );
      }

      const isExists = await this.schemaService.checkIfSchemaAndTableExists(
        accountNumber
      );

      if (!isExists) {
        errorLog("Invalid account ID: project does not exist.");
        throw new Error("Invalid account ID: project does not exist.");
      }

      projectData.modified_by = userId;
      projectData.created_by = userId;

      await this.updateProjectRecords(
        accountNumber,
        projectData,
        accountData,
        userId
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          project: [],
        },
      };
    } catch (err) {
      errorLog("Error updating project: " + (err as Error).message);
      throw new Error("Error updating project: " + (err as Error).message);
    }
  }

  async updateProjectRecords(
    accountNumber: string,
    projectData: IUpdateProject,
    accountData: any,
    userId: string
  ) {

    const { accountNumber: validAccountNumber } = await this.projectIngestion.fetchValidAccountNumberById(accountData.rid);
    const schemaName = rawQueries.fetchSchemaName(validAccountNumber);
    const sequelize = await initOrgSequelize();

    const CaseModel = await Case.initialize(
      sequelize,
      schemaName
    );

    const fiscalData =
      await this.projectIngestion.checkIfProjectFiscalExistsOnUpdate(
        accountNumber,
        projectData,
        accountData.rid,
        projectData.project_fiscal_id
      );

    if (fiscalData) {
      errorLog("Project already exists in the account for the fiscal year");
      throw new Error(
        "Project already exists in the account for the fiscal year"
      );
    }

    const existingFiscalData =
      await this.projectIngestion.fetchProjectFiscalById(
        accountNumber,
        projectData.project_fiscal_id
      );


    const orgDb = await initOrgSequelize()
    let existingRegionId : string = ``
    existingRegionId = existingFiscalData?.region_rid!

    let findProjectFiscal: any = await orgDb.query(rawQueries.findProjectFiscal(schemaName, projectData.project_id, accountData.rid, projectData.project_fiscal_id))
    if (findProjectFiscal[0][0].is_rd_claim_qualified) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        statusMessage: STATUS_MESSAGE.qualifiedProject
      }
    }


    await this.projectIngestion.updateProjectFiscal(
      accountNumber,
      projectData,
      existingFiscalData?.project_code || ""
    );

    await this.projectIngestion.updateProjectFiscalRegion(
      accountNumber,
      projectData,
      existingFiscalData?.project_code || ""
    );

    if (projectData.key_contacts) {
      await this.projectIngestion.manageKeyContacts(
        projectData.key_contacts,
        projectData.project_fiscal_id,
        userId,
        accountNumber
      );
    }

    await this.projectIngestion.updateProjectHistory(
      accountNumber,
      projectData,
      existingFiscalData
    );

    await this.projectIngestion.updateProjectFiscalSummary(
      accountNumber,
      projectData,
      existingFiscalData?.project_code
    );

    await this.projectIngestion.updateProjectAggregatesFromFiscal(
      accountNumber,
      accountData.rid,
      projectData.project_code
    );

    await this.projectIngestion.updateProjectSummaryAggregatesFromFiscal(
      accountNumber,
      projectData?.project_code || "",
      accountData.rid
    );

    await this.projectIngestion.addAccountFiscal(accountNumber, projectData);
    await this.projectIngestion.addAccountFiscalRegion(
      accountNumber,
      projectData,
      existingRegionId
    );

    await this.projectIngestion.updateAccountAggregatesFromAccountFiscal(
      accountNumber,
      accountData.rid
    );

    await this.projectIngestion.updateProjectResources(
      accountNumber,
      projectData,
      existingFiscalData?.rid || "",
      existingFiscalData?.fiscal_year || null
    );

    const checkTableExists = await this.projectIngestion.checkCaseProjectsTableExists(validAccountNumber);
    if (checkTableExists) {
      const projectCaseMapping =
        await this.projectIngestion.fetchProjectFiscalCaseMapping(
          accountNumber,
          projectData.project_fiscal_id
        );
      if (projectCaseMapping.length > 0) {
        for (const caseMapping of projectCaseMapping) {
          const caseData = await CaseModel.findOne({
            where: {
              rid: caseMapping.case_rid,
            },
          });

          if (!caseData) {
            continue;
          }
          const mainSequelize = await initMainDbSequelize();

          const caseStatus = await mainSequelize.query(
            rawQueries.fetchCaseStatusByRid(caseData.status_rid),
            {
              type: "SELECT",
            }
          ) as CaseStatusResult[];

          if (caseStatus[0]?.status_name === "Closed") {
            continue;
          }
          await this.projectIngestion.updateCaseProjectTables(
            accountNumber,
            caseMapping,
            projectData,
            existingFiscalData?.project_code || ""
          );
        }
      }
    }
  }

  /**
 * Retrieves detailed information about a project and its attachments by account and project IDs.
 *
 * @async
 * @function projectById
 * @param {string} accountId - The ID of the account to which the project belongs.
 * @param {string} projectId - The ID of the project to retrieve.
 * @returns {Promise<{
 *   statusCode: number;
  *   message: string;
  *   errorMessage?: string;
  *   data?: {
  *     project: any;
  *     attachment: any[];
  *   };
  * }>} Returns the status, message, and project details with attachments, or throws an error.
  *
  * @throws {Error} If the account ID is invalid or any other error occurs during processing.
  *
  * @description
  * - Validates the account ID and fetches the account details.
  * - Resolves the correct account schema based on whether the account stores data in a parent schema.
  * - Checks if the relevant schema and tables exist.
  * - If schema/tables do not exist, returns success with empty project and attachments.
  * - Fetches project details and enriches them with additional data such as currency, key contacts, geo data, industry, project type and status, classification, user details, and account info.
  * - Retrieves project attachments and enriches them with document types, categories, uploader info, and formatted size.
  * - Returns the project data and mapped attachments in the response.
  */
  async projectById(
    accountId: string,
    projectId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { project: any; attachment: any };
  }> {
    try {
      const accountData = await this.schemaService.fetchAccountById(accountId);

      if (!accountData) {
        errorLog("Invalid account ID");
        throw new Error("Invalid account ID");
      }

      if (
        accountData.parent_account_rid === null ||
        accountData.parent_account_rid === ""
      ) {
        errorLog("Invalid account ID");
        throw new Error("Invalid account ID");
      }

      let accountRNumber = accountData.r_number;

      let childRNumber = await this.schemaService.fetchParentAccount(
        accountData.parent_account_rid
      );
      if (accountData.storage_type === "store_in_parent") {
        accountRNumber = childRNumber;
      }
      let isSubscriptionCreated = false;
      isSubscriptionCreated = (await this.schemaService.getSubscriptionDetailsByProjectId(accountData.parent_account_rid, childRNumber, accountId)) ?? false;


      const isExists = await this.schemaService.checkIfSchemaAndTableExists(
        accountRNumber
      );

      if (!isExists) {
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.SUCCESS_MESSAGE,
          data: {
            project: [],
            attachment: [],
          },
        };
      }

      const accountDetails =
        await this.projectIngestion.fetchAccountDetailsById(
          accountRNumber,
          accountId
        );
      let projectData: any = await this.projectIngestion.fetchProjectById(
        accountRNumber,
        projectId
      );

      if (projectData) {
        let schemaName = rawQueries.fetchSchemaName(accountRNumber)
        const mainDbInit = await initMainDbSequelize();
        const orgDb = await initOrgSequelize()
        const [accountFiscalInfo]: any[] = await orgDb.query(
        rawQueries.fetchAccountInfo(
          schemaName,accountId, 
        ), { type: 'SELECT' }
      );
      const fiscalStart = accountFiscalInfo?.fiscal_start_date; // e.g. 'Apr/01'
      const fiscalEnd = accountFiscalInfo?.fiscal_end_date; // e.g. 'Mar/31'
      const fiscalYear = projectData.dataValues.fiscal_year || new Date().getFullYear();
      // Start date
      const formattedStartDate = parseFiscalDate(fiscalStart, fiscalYear);
      const endYear = getFiscalEndYear(fiscalStart, fiscalEnd, fiscalYear);
      const formattedEndDate = parseFiscalDate(fiscalEnd, endYear);
        const [platFormConfig]: any[] = await mainDbInit.query(
                      rawQueries.fetchPlatformConfig(
                        accountData.country_rid,formattedStartDate,formattedEndDate
                      ),{type: 'SELECT'}
                );
        let projectType: string[] = [];
        if (platFormConfig && platFormConfig.config_json && platFormConfig.config_json.project_type) {
          let projectTypes = platFormConfig.config_json.project_type;
          projectType = projectTypes;
          }
        projectData.dataValues.total_fte = projectData.dataValues.total_fte == 0 ? null : projectData.dataValues.total_fte
        projectData.dataValues.total_nonlabor_prj = projectData.dataValues.total_nonlabor_prj == 0 ? null : projectData.dataValues.total_nonlabor_prj
        projectData.dataValues.total_subcon = projectData.dataValues.total_subcon == 0 ? null : projectData.dataValues.total_subcon

        
       
        let isResExists: boolean;
        const checkResExistsInPrjRes = await orgDb.query(checkProjectMappedToProjectRes(schemaName, projectData.rid))
        if (checkResExistsInPrjRes[0].length > 0) isResExists = true
        else isResExists = false
        projectData.dataValues.is_project_exists = isResExists

        await this.assignCurrencyRid(projectData, mainDbInit);

        // Run independent enrichment operations in parallel for better performance
        const [enrichedKeyContacts, geoData, industryData, typeAndStatus, keyContactData, classificationData, userDetails] = 
          await Promise.all([
            this.projectIngestion.enrichKeyContactsByProjectId(projectData, accountRNumber),
            this.schemaService.insertProjectGeoData(projectData, mainDbInit),
            this.schemaService.insertIndustyName(projectData, mainDbInit),
            this.schemaService.insertProjectTypeAndStatus(projectData, mainDbInit, projectType),
            this.schemaService.projectKeyContactData(projectData, mainDbInit),
            this.schemaService.projectClassificationData(projectData, mainDbInit),
            this.schemaService.insertUserDetails(projectData)
          ]);

        // Merge all enriched data into projectData
        projectData = enrichedKeyContacts;
        projectData.dataValues = { ...projectData.dataValues, ...geoData };
        projectData.dataValues = { ...projectData.dataValues, ...industryData };
        projectData.dataValues = { ...projectData.dataValues, ...typeAndStatus };
        projectData.dataValues = { ...projectData.dataValues, ...keyContactData };
        projectData.dataValues = { ...projectData.dataValues, ...classificationData };
        projectData.dataValues = { ...projectData.dataValues, ...userDetails };

        projectData = this.insertAccount(
          projectData,
          accountData,
          accountDetails,
          isSubscriptionCreated
        );
      }

      // Fetch attachments for the project
      const attachments = await this.schemaService.fetchAttachmentsByProjectId(
        projectId
      );
      let mappedAttachments = [];
      if (attachments.length > 0) {
        const sequelize = await initMainDbSequelize();
        // Get document types, categories, users in parallel
        const documentTypeIds = attachments.map(
          (attachment) => attachment.document_type_rid
        );
        const documentCategoryIds = attachments.map(
          (attachment) => attachment.document_category_rid
        );
        const userIds = attachments.map((attachment) => attachment.created_by);

        const [documentTypes, documentCategories, users] = await Promise.all([
          documentTypeIds.length > 0
            ? sequelize.query(rawQueries.GET_DOCUMENT_TYPES, {
              replacements: { documentTypeIds },
              type: "SELECT",
            })
            : [],
          documentCategoryIds.length > 0
            ? sequelize.query(rawQueries.GET_DOCUMENT_CATEGORIES, {
              replacements: { documentCategoryIds },
              type: "SELECT",
            })
            : [],
          userIds.length > 0
            ? sequelize.query(rawQueries.GET_USERS, {
              replacements: { userIds },
              type: "SELECT",
            })
            : [],
        ]);

        // Enhance attachments with related data
        mappedAttachments = attachments.map((attachment) => {
          const documentType = documentTypes.find(
            (dt: any) => dt.rid === attachment.document_type_rid
          );
          const documentCategory = documentCategories.find(
            (dc: any) => dc.rid === attachment.document_category_rid
          );
          const uploadedBy = users.find(
            (u: any) => u.rid === attachment.created_by
          );
          const attachedTo = projectData?.project_code;

          return {
            ...attachment,

            document_type: (documentType as any)?.type_name || "",
            document_category: (documentCategory as any)?.category_name || "",
            uploaded_by: (uploadedBy as any)?.full_name || "",
            attached_to: attachedTo,
            size_in_mb: attachment.size_in_mb
              ? `${attachment.size_in_mb} mb`
              : "0 mb",
          };
        });
      }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          project: projectData,
          attachment: mappedAttachments,
        },
      };
    } catch (err) {
      errorLog("Error fetching project by ID: " + (err as Error).message);
      throw new Error(
        "Error fetching project by ID: " + (err as Error).message
      );
    }
  }

  insertAccount(project: any, account: any, accountDetails: any, isSubscriptionCreated: boolean) {
    const fiscalStartDate = accountDetails?.[0]?.fiscal_start_date || null;
    const fiscalEndDate = accountDetails?.[0]?.fiscal_end_date || null;
    return {
      ...project,
      account_name: account.account_name,
      account_number: account.r_number,
      account_status: account.status,
      organistaion_name: account.organisation_name,
      fiscal_start_date: fiscalStartDate,
      fiscal_end_date: fiscalEndDate,
      is_send_interaction: isSubscriptionCreated
    };
  }

  /**
 * Retrieves a paginated list of projects for a given account with optional filtering, sorting, and search.
 *
 * @async
 * @function projectList
 * @param {string} accountId - The ID of the account to fetch projects from.
 * @param {number} [fiscalYear=0] - The fiscal year to filter projects by (default is 0, meaning no filter).
 * @param {number} [page=1] - The page number for pagination (default is 1).
 * @param {number} [limit=10] - The number of projects per page (default is 10).
 * @param {string} search - Search term to filter projects by relevant fields.
 * @param {Record<string, any>} [filters={}] - Additional filters to apply on the project list.
 * @param {string} [sortBy="created_datetime"] - The field to sort the projects by (default is "created_datetime").
 * @param {string} [sortOrder="ASC"] - Sort order, either "ASC" for ascending or "DESC" for descending (default is "ASC").
 * @param {boolean} [bothParentAndChild=false] - Whether to include projects from both parent and child accounts (default is false).
 * @param {string} userId - The ID of the user requesting the project list (used for access control).
 * @param {string} [apiSource="Project"] - The API source identifier (default is "Project").
 * @returns {Promise<{
 *   statusCode: number;
  *   message: string;
  *   errorMessage?: string;
  *   data?: {
  *     projects: any[];
  *     totalCount: number;
  *   };
  * }>} Returns paginated projects list and total count, or throws an error.
  *
  * @throws {Error} Throws an error if the account ID is invalid or any other failure occurs.
  *
  * @description
  * - Validates the account and fetches account details.
  * - Determines user access permissions based on user group and profile.
  * - Determines accessible project IDs for the user.
  * - Resolves the correct schema for the account (parent or child).
  * - Checks if the schema and required tables exist.
  * - Builds filtering and search clauses based on input parameters.
  * - Fetches the filtered, sorted, paginated project list from the database.
  * - Returns projects and total count.
  */
  async projectList(
    accountId: string,
    fiscalYear: number = 0,
    page: number = 1,
    limit: number = 10,
    search: string,
    filters: Record<string, any> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "ASC",
    bothParentAndChild: boolean = false,
    userId: string,
    apiSource: string = "Project"
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projects: any; totalCount: number };
  }> {
    try {
      const accountData = await this.schemaService.fetchAccountById(accountId);

      if (!accountData) {
        errorLog("Invalid account account ID.");
        throw new Error("Invalid account account ID.");
      }

      if (
        accountData.parent_account_rid === null ||
        accountData.parent_account_rid === ""
      ) {
        errorLog("Invalid account ID");
        throw new Error("Invalid account ID");
      }
      const userGroupType = await this.schemaService.getUserGroupType(userId);
      const userProfileType = await this.schemaService.getUserProfileType(
        userId
      );
      const isCustomGlobal = userGroupType === "DEFAULT";
      const isDefaultParent = userGroupType === "AUTO_ASSIGNED_PARENT";
      const isPOCProfile =
        userProfileType?.profileName === "Project Point of Contact";
      let accessibleIds: string[] = [];
      let accInteractionProjs: string[] = [];

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
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
              projects: [],
              totalCount: 0,
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
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
              projects: [],
              totalCount: 0,
            },
          };
        }
      }
      logMessage(`Project List: ${JSON.stringify(accountData)}`);

      let accountRNumber = accountData.r_number;

      if (accountData.storage_type === "store_in_parent") {
        accountRNumber = await this.schemaService.fetchParentAccount(
          accountData.parent_account_rid
        );
      }

      const isExists = await this.schemaService.checkIfSchemaAndTableExists(
        accountRNumber
      );

      if (!isExists) {
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.SUCCESS_MESSAGE,
          data: {
            projects: [],
            totalCount: 0,
          },
        };
      }

      const [finalSortBy, finalSortOrder] = this.getSortParameters(
        sortBy,
        sortOrder
      );
      const [finalMetaDataSortBy, finalMetaDataSortOrder] =
        this.getMetaDataSortParameters(sortBy, sortOrder);

      const { whereClause, searchClause } = this.buildWhereClause(
        filters,
        search,
        false,
        bothParentAndChild
      );

      const offset = (page - 1) * limit;

      const order = [[finalSortBy, finalSortOrder]];

      let { projects, count } = await this.projectIngestion.fetchProjectList(
        accountRNumber,
        accountData,
        whereClause,
        fiscalYear,
        offset,
        limit,
        order,
        bothParentAndChild,
        filters,
        finalMetaDataSortBy,
        finalMetaDataSortOrder,
        {},
        accessibleIds,
        apiSource,
        "",
        searchClause
      );
      projects = projects.slice(offset, page * limit);

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projects: projects,
          totalCount: count,
        },
      };
    } catch (err) {
      errorLog("Error fetching project: " + (err as Error).message);
      throw new Error("Error fetching project: " + (err as Error).message);
    }
  }

  /**
 * Exports a list of projects for a given account with optional filtering, sorting, and search.
 *
 * @async
 * @function exportProjectList
 * @param {string} accountId - The ID of the account to export projects from.
 * @param {number} [fiscalYear=0] - The fiscal year to filter projects by (default is 0, meaning no filter).
 * @param {string} search - Search term to filter projects by relevant fields.
 * @param {Record<string, any>} [filters={}] - Additional filters to apply on the project list.
 * @param {string} [sortBy="created_datetime"] - The field to sort the projects by (default is "created_datetime").
 * @param {string} [sortOrder="ASC"] - Sort order, either "ASC" for ascending or "DESC" for descending (default is "ASC").
 * @param {boolean} [bothParentAndChild=false] - Whether to include projects from both parent and child accounts (default is false).
 * @param {string} timezone - The timezone to consider for date/time fields in the exported data.
 * @param {string} userId - The ID of the user requesting the export (used for access control).
 * @returns {Promise<{
 *   statusCode: number;
  *   message: string;
  *   errorMessage?: string;
  *   data?: {
  *     projects: any[];
  *     totalCount: number;
  *   };
  * }>} Returns the list of projects matching criteria along with total count, or throws an error.
  *
  * @throws {Error} Throws an error if the account ID is invalid or any other failure occurs.
  *
  * @description
  * - Validates the account and fetches account details.
  * - Determines user access permissions based on user group and profile.
  * - Determines accessible project IDs for the user.
  * - Resolves the correct schema for the account (parent or child).
  * - Checks if the schema and required tables exist.
  * - Builds filtering and search clauses based on input parameters.
  * - Fetches the filtered and sorted project list for export from the database.
  * - Returns projects and total count.
  */
  async exportProjectList(
    accountId: string,
    fiscalYear: number = 0,
    search: string,
    filters: Record<string, any> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "ASC",
    bothParentAndChild: boolean = false,
    timezone: string,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projects: any; totalCount: number };
  }> {
    try {
      const accountData = await this.schemaService.fetchAccountById(accountId);

      if (!accountData) {
        errorLog("Invalid  account ID.");
        throw new Error("Invalid account ID.");
      }

      if (
        accountData.parent_account_rid === null ||
        accountData.parent_account_rid === ""
      ) {
        errorLog("Invalid account ID");
        throw new Error("Invalid account ID");
      }
      const userGroupType = await this.schemaService.getUserGroupType(userId);
      const userProfileType = await this.schemaService.getUserProfileType(
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
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
              projects: [],
              totalCount: 0,
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
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
              projects: [],
              totalCount: 0,
            },
          };
        }
      }

      logMessage(`Export Project List: ${JSON.stringify(accountData)}`);

      let accountRNumber = accountData.r_number;

      if (accountData.storage_type === "store_in_parent") {
        accountRNumber = await this.schemaService.fetchParentAccount(
          accountData.parent_account_rid
        );
      }

      const isExists = await this.schemaService.checkIfSchemaAndTableExists(
        accountRNumber
      );

      if (!isExists) {
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.SUCCESS_MESSAGE,
          data: {
            projects: [],
            totalCount: 0,
          },
        };
      }

      const [finalSortBy, finalSortOrder] = this.getSortParameters(
        sortBy,
        sortOrder
      );
      const [finalMetaDataSortBy, finalMetaDataSortOrder] =
        this.getMetaDataSortParameters(sortBy, sortOrder);

      const { whereClause, searchClause } = this.buildWhereClause(
        filters,
        search,
        false,
        bothParentAndChild
      );

      const order = [[finalSortBy, finalSortOrder]];

      const { exportData, count } =
        await this.projectIngestion.fetchProjectListExport(
          accountRNumber,
          accountData,
          whereClause,
          fiscalYear,
          order,
          bothParentAndChild,
          filters,
          finalMetaDataSortBy,
          finalMetaDataSortOrder,
          timezone,
          userId,
          accessibleIds,
          "",
          searchClause
        );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projects: exportData,
          totalCount: count,
        },
      };
    } catch (err) {
      errorLog("Error fetching project: " + (err as Error).message);
      throw new Error("Error fetching project: " + (err as Error).message);
    }
  }

  async getAccInteractionProjectIds(
    accIntId: string,
    accountRNumber: string
  ): Promise<string[]> {
    const orgDbSequlize = await initOrgSequelize();
    const schemaName = `${SCHEMANAME_PREFIX}${accountRNumber.replace(/\D/g, "")}`;
    const interactionProjects = await orgDbSequlize.query(
      rawQueries.getAccountInteractionProjects(schemaName, accIntId),
      {
        replacements: { account_interaction_rid: accIntId },
        type: "SELECT",
      }
    );
    return interactionProjects.map((row: any) => row.project_fiscal_rid);
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
    logMessage(`isCustomGlobal: ${isCustomGlobal}, isPOC: ${isPOC}, isdefaultparent: ${isdefaultparent}, userEmail: ${userEmail}, userId: ${userId}`);

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
 * Retrieves a paginated list of all projects across accounts with filtering, sorting, and user access control.
 *
 * @async
 * @function allProjectList
 * @param {number} [fiscalYear=0] - Fiscal year to filter projects by (default is 0, meaning no filter).
 * @param {number} [page=1] - Page number for pagination (default is 1).
 * @param {number} [limit=100] - Number of projects per page (default is 100).
 * @param {string} search - Search term to filter projects by relevant fields.
 * @param {Record<string, any>} [filters={}] - Additional filters to apply on the project list.
 * @param {string} [sortBy="created_datetime"] - Field to sort the projects by (default is "created_datetime").
 * @param {string} [sortOrder="ASC"] - Sort order, either "ASC" for ascending or "DESC" for descending (default is "ASC").
 * @param {Record<string, string[]>} globalFilters - Global account filters to narrow down projects.
 * @param {string} userId - ID of the user requesting the project list (used for access control).
 * @param {boolean} bothParentAndChild - Whether to include projects from both parent and child accounts.
 * @param {boolean} [isFromUserGroup=false] - Flag indicating if filtering is from a user group context.
 * @param {string[]} [accountRid=[]] - Array of account RIDs to include additionally when `isFromUserGroup` is true.
 * @returns {Promise<{
 *   statusCode: number;
  *   message: string;
  *   errorMessage?: string;
  *   data?: {
  *     projects: any[];
  *     count: number;
  *   };
  * }>} Returns the list of projects matching the criteria along with the total count, or throws an error.
  *
  * @throws {Error} Throws an error if fetching projects fails.
  *
  * @description
  * - Calculates pagination offset based on page and limit.
  * - Retrieves the user's group and profile types.
  * - Determines if the user has custom global access or specific role (e.g., Project Point of Contact).
  * - Fetches accessible project IDs for the user based on access rules.
  * - Returns early with empty results if no accessible projects found.
  * - Computes sorting parameters for project list and related account data.
  * - Applies global account filters and optionally merges additional account RIDs if from user group.
  * - Fetches all projects matching filters, pagination, sorting, fiscal year, and access permissions.
  * - Returns paginated project list and total count.
  */
  async allProjectList(
    fiscalYear: number = 0,
    page: number = 1,
    limit: number = 100,
    search: string,
    filters: Record<string, any> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "ASC",
    globalFilters: Record<string, string[]> = {},
    userId: string,
    bothParentAndChild: boolean,
    isFromUserGroup: boolean = false,
    accountRid: string[] = []
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projects: any; count: number };
  }> {
    try {
      const offset = (page - 1) * limit;
      // Parallelize user lookups
      const [userGroupType, userProfileType] = await Promise.all([
        this.schemaService.getUserGroupType(userId),
        this.schemaService.getUserProfileType(userId)
      ]);
      const isCustomGlobal = userGroupType === "DEFAULT";
      const isDefaultParent = userGroupType === "AUTO_ASSIGNED_PARENT";
      const isPOCProfile = userProfileType?.profileName === "Project Point of Contact";
      let accessibleIds: string[] = [];
      logMessage(`allProjectList  - isFromUserGroup: ${isFromUserGroup}, accountRid: ${accountRid}, userGroupType: ${userGroupType}, userProfileType: ${userProfileType?.profileName}`);

      // Consolidate access control logic
      const needsAccessCheck = !isCustomGlobal || (isCustomGlobal && isPOCProfile);
      if (needsAccessCheck) {
        accessibleIds = await this.getAccessibleProjectIds(
          userId,
          isDefaultParent,
          isPOCProfile,
          userProfileType?.email,
          isCustomGlobal
        );
        if (accessibleIds.length === 0) {
          return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
              projects: [],
              count: 0,
            },
          };
        }
      }

      const [finalSortBy, finalSortOrder] = this.getSortParametersForAllProjects(sortBy, sortOrder);
      const { accountDataSort } = this.processAccountDataSort(sortBy, sortOrder);
      const sort = {
        sortCol: finalSortBy,
        sortOrder: finalSortOrder,
      };

      const appliedAccountNumber = await this.schemaService.computeGlobalAccountFilter(globalFilters);
      if (isFromUserGroup && accountRid.length > 0) {
        appliedAccountNumber.push(...accountRid);
      }

      let { finalResult: allProjectList, totalCount } = await this.schemaService.fetchAllProjects(
        offset,
        limit,
        sort,
        filters,
        fiscalYear,
        appliedAccountNumber,
        userId,
        search,
        accountDataSort,
        bothParentAndChild,
        accessibleIds
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projects: allProjectList,
          count: totalCount,
        },
      };
    } catch (err) {
      errorLog("Error fetching project: " + (err as Error).message);
      throw new Error("Error fetching project: " + (err as Error).message);
    }
  }

  /**
 * Exports a comprehensive list of all projects with detailed fiscal data, formatted and filtered by user access and permissions.
 *
 * @async
 * @function exportAllProjectList
 * @param {number} [fiscalYear=0] - Fiscal year to filter projects (default 0 means no filter).
 * @param {string} search - Search term to filter projects.
 * @param {Record<string, any>} [filters={}] - Additional filters applied to the projects.
 * @param {string} [sortBy="created_datetime"] - Field by which to sort the projects.
 * @param {string} [sortOrder="ASC"] - Sort order: "ASC" for ascending or "DESC" for descending.
 * @param {Record<string, string[]>} globalFilters - Global account filters for restricting the project scope.
 * @param {string} userId - User ID for access control and permissions.
 * @param {boolean} bothParentAndChild - Whether to include projects from both parent and child accounts.
 * @param {string} timezone - Timezone string used to format date/time fields in the export.
 * @returns {Promise<{
 *   statusCode: number;
  *   message: string;
  *   errorMessage?: string;
  *   data?: {
  *     projects: any[];
  *     count: number;
  *   };
  * }>} Returns exported project data with fiscal details and total count, or throws an error.
  *
  * @throws {Error} Throws an error if project export fetching or formatting fails.
  *
  * @description
  * - Computes sorting parameters and account data sorting based on input.
  * - Determines user's group and profile types to apply access control.
  * - Fetches accessible project IDs for the user, returning early if none are accessible.
  * - Applies global account filters.
  * - Fetches all projects for export with filters, sorting, fiscal year, and access controls.
  * - Retrieves allowed export fields for the user and filters the project data accordingly.
  * - Formats numeric fields as currency with correct symbols and decimal places.
  * - Processes both base project data and associated fiscal year summaries.
  * - Formats date/time fields using the specified timezone, falling back to default format if invalid.
  * - Constructs a final export dataset containing only allowed fields with user-friendly labels.
  */
  async exportAllProjectList(
    fiscalYear: number = 0,
    search: string,
    filters: Record<string, any> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "ASC",
    globalFilters: Record<string, string[]> = {},
    userId: string,
    bothParentAndChild: boolean,
    timezone: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projects: any; count: number };
  }> {
    try {
      const [finalSortBy, finalSortOrder] =
        this.getSortParametersForAllProjects(sortBy, sortOrder);

      const { accountDataSort } = this.processAccountDataSort(
        sortBy,
        sortOrder
      );

      const sort = {
        sortCol: finalSortBy,
        sortOrder: finalSortOrder,
      };
      const userGroupType = await this.schemaService.getUserGroupType(userId);
      const userProfileType = await this.schemaService.getUserProfileType(
        userId
      );
      const isCustomGlobal = userGroupType === "DEFAULT";
      const isDefaultParent = userGroupType === "AUTO_ASSIGNED_PARENT";
      const isPOCProfile =
        userProfileType?.profileName === "Project Point of Contact";
      let accessibleIds: string[] = [];
      logMessage(`exportAllProjectList - userGroupType: ${userGroupType}, userProfileType: ${userProfileType?.profileName}, isCustomGlobal: ${isCustomGlobal}, isPOCProfile: ${isPOCProfile}`);
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
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
              projects: [],
              count: 0,
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
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
              projects: [],
              count: 0,
            },
          };
        }
      }

      const appliedAccountNumber =
        await this.schemaService.computeGlobalAccountFilter(globalFilters);

      const { finalResult: allProjectList, totalCount } =
        await this.schemaService.fetchAllProjectsForExport(
          sort,
          filters,
          fiscalYear,
          appliedAccountNumber,
          userId,
          search,
          accountDataSort,
          bothParentAndChild,
          accessibleIds
        );
      const allowedFieldsForExport =
        await this.schemaService.getAllowedExportFields(
          userId,
          "projects_view_edit"
        );
      const allowedFieldSet = new Set<string>();
      for (const field of allowedFieldsForExport) {
        if (field.read) {
          allowedFieldSet.add(field.field_desc);
        }
      }

      const formatNumberForExport = (
        value: any,
        currency_symbol: string
      ): string => {
        if (value == null || value === "") return "-";

        try {
          const decimalValue = new Decimal(value.toString());
          if (!decimalValue.isFinite()) return "-";

          // Extract just the formatted currency pattern using a dummy value
          const pattern = currency(0, {
            symbol: currency_symbol || "$",
            precision: 2,
            pattern: "! #",
            separator: ",",
            decimal: ".",
          }).format(); // e.g., "$ 0.00"

          // Format actual value manually using Decimal
          const [intPart, decPart] = decimalValue.toFixed().split(".");
          const formattedInt = intPart?.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

          const formattedNumber = decPart
            ? `${formattedInt}.${decPart}`
            : formattedInt;
          // Replace "0.00" in pattern with our real number
          return pattern.replace("0.00", formattedNumber ?? "");
        } catch (error) {
          errorLog("Error formatting number for export", (error as Error).message);
          return "-";
        }
      };

      const rawResult = allProjectList || [];
      let exportData: any[] = [];
      const labelMap: Record<string, string> = {
        "Project Code": "Project Code",
        "Project Name": "Name",
        "Project Type": "Project Type",
        "Account Name": "Name",
        "Fiscal Year": "Fiscal Year",
        "Project Classification": "Classification",
        "Customer Group": "Client Group",
        "Project Group": "Project Group",
        "Project Effort (Hours)": "Total Effort In Hrs",
        "Project Cost": "Total Cost",
        "FTE Cost": "Total FTE Cost",
        "SubCon Cost": "Total Sub Con Cost",
        "Non-Labor Cost": "Total Non Labor Cost",
        "Assessment Status": "Assessment Status",
        "QRE Percent Final": "QRE Percent Final",
        "QRE Final": "QRE Final",
        "Project Point of Contact": "Key Contacts List",
        "Project Point of Contact Email": "Key Contacts List",
        "Technical Point of Contact": "Key Contacts List",
        "Technical Point of Contact Email": "Key Contacts List",
        Comments: "Comments",
        "Last Modified": "Updated On",
        "Project ID": "Project ID",
      };

      rawResult.forEach((project: any) => {
        // Always add base project data row first
        const projectInfo = {
          "Project Code": project.project_code || "-",
          "Project Name": "-",
          "Project Type": "-",
          "Account Name": "-",
          "Fiscal Year": "-",
          "Project Classification": "-",
          "Customer Group": "-",
          "Project Group": "-",
          "Project Effort (Hours)": project.total_effort || "-",
          "Project Cost":
            formatNumberForExport(
              project.total_cost,
              project.currency_symbol
            ) || "-",
          "FTE Cost":
            formatNumberForExport(
              project.total_cost_fte,
              project.currency_symbol
            ) || "-",
          "SubCon Cost":
            formatNumberForExport(
              project.total_cost_subcon,
              project.currency_symbol
            ) || "-",
          "Non-Labor Cost":
            formatNumberForExport(
              project.total_cost_nonlabor,
              project.currency_symbol
            ) || "-",
          "Assessment Status": "-",
          "QRE Percent Final": "-",
          "QRE Final": "-",
          "Project Point of Contact": "-",
          "Project Point of Contact Email": "-",
          "Technical Point of Contact": "-",
          "Technical Point of Contact Email": "-",
          Comments: "-",
          "Last Modified": "-",
          "Project ID": project.r_number || "-",
        };
        const filteredProjectRow: Record<string, string> = {};
        for (const [label, value] of Object.entries(projectInfo)) {
          const mappedLabel = labelMap[label] || label;
          if (allowedFieldSet.has(mappedLabel)) {
            filteredProjectRow[label] = value; // Keep original label for export
          }
        }
        exportData.push(filteredProjectRow);
        // Add fiscal summary rows if they exist
        const fiscalSummaries = project.ProjectFiscal || [];
        if (fiscalSummaries.length > 0) {
          fiscalSummaries.forEach((fiscal: any) => {
            const fiscalInfo = {
              "Project Code":
                (fiscal.project_code
                  ? fiscal.project_code + " - FY" + fiscal.fiscal_year
                  : "-") || "-",
              "Project Name": fiscal.project_name || "-",
              "Project Type": fiscal.project_type_name || "-",
              "Account Name": fiscal.account_name || "-",
              "Fiscal Year": `FY-${fiscal.fiscal_year}` || "-",
              "Project Classification": fiscal.classification_name || "-",
              "Customer Group": fiscal.project_client_group || "-",
              "Project Group": fiscal?.project_group || "-",
              "Project Effort (Hours)": fiscal.total_effort || "-",
              "Project Cost":
                formatNumberForExport(
                  fiscal.total_cost,
                  project.currency_symbol
                ) || "-",
              "FTE Cost":
                formatNumberForExport(
                  fiscal.total_cost_fte,
                  project.currency_symbol
                ) || "-",
              "SubCon Cost":
                formatNumberForExport(
                  fiscal.total_cost_subcon,
                  project.currency_symbol
                ) || "-",
              "Non-Labor Cost":
                formatNumberForExport(
                  fiscal.total_cost_nonlabor,
                  project.currency_symbol
                ) || "-",
              "Assessment Status": fiscal.assessment_status || "-",
              "QRE Percent Final": fiscal.rd_percent_final || "-",
              "QRE Final":
                fiscal.qre_final || "-", //formatNumberForExport(fiscal.qre_final,project.currency_symbol)
              "Project Point of Contact":
                fiscal.project_point_of_contact || "-",
              "Project Point of Contact Email": fiscal.project_point_of_contact_email || "-",
              "Technical Point of Contact":
                fiscal.technical_point_of_contact || "-",
              "Technical Point of Contact Email": fiscal.technical_point_of_contact_email || "-",
              Comments: fiscal.comments || "-",
              "Last Modified": fiscal.modified_datetime
                ? timezone && isValidTimezone(timezone)
                  ? moment(fiscal.modified_datetime)
                    .tz(timezone)
                    .format("YYYY-MMM-DD, hh:mm:ss A")
                  : moment(fiscal.modified_datetime).format(
                    "YYYY-MMM-DD, hh:mm:ss A"
                  )
                : "-",
              "Project ID": fiscal.r_number || "-",
            };
            const filteredFiscalRow: Record<string, string> = {};
            for (const [label, value] of Object.entries(fiscalInfo)) {
              const mappedLabel = labelMap[label] || label;
              if (allowedFieldSet.has(mappedLabel)) {
                filteredFiscalRow[label] = value; // Keep original label for export
              }
            }
            exportData.push(filteredFiscalRow);
          });
        }
      });

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projects: exportData,
          count: totalCount,
        },
      };
    } catch (err) {
      throw new Error("Error fetching project: " + (err as Error).message);
    }
  }

  async addProjectTimeline(
    accountNumber: string,
    accountId: string,
    eventName: string,
    projectId: string,
    projectData: ICreateProject
  ) {
    try {
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await initOrgSequelize();

      const ProjectTimelineModel = await ProjectTimeline.initialize(
        sequelize,
        schemaName
      );

      await ProjectTimelineModel.create({
        account_rid: accountId,
        event_name: eventName,
        event_status: "success",
        event_type: "ui handler",
        entity_rid: projectId,
        created_by:
          eventName === "update"
            ? projectData.modified_by || ""
            : projectData.created_by || "",
      });
    } catch (err) {
      errorLog("Error adding timeline : " + (err as Error).message);
      throw new Error("Error adding timeline : " + (err as Error).message);
    }
  }

  async addProjectFiscalRecords(
    projectData: any,
    sequilzeInstance: Sequelize,
    schemaName: string,
    projectRid: string
  ) {
    try {
      const ProjectModel = await Project.initialize(
        sequilzeInstance,
        schemaName
      );
      const ProjectFiscalModel = await ProjectFiscal.initialize(
        sequilzeInstance,
        schemaName
      );

      const projectFiscalData = {
        project_rid: projectRid,
        project_name: projectData.project_name || "",
        eid: projectData.eid || null,
        fiscal_year: projectData.fiscal_year,
        account_rid: projectData.account_rid,
        project_code: projectData.program_code,

        max_ai_interactions: projectData.max_ai_interaction || 0,
        expiry_duration: null,

        autosend_interaction: projectData.auto_send_ai_interaction ?? false,
        status_rid: projectData.status_rid,
        project_startdate: projectData.project_startdate || null,
        project_enddate: projectData.project_enddate || null,

        total_fte_prj: projectData.total_fte || null,
        total_subcon_prj: projectData.total_sub_con || null,

        blended_rate_fte: projectData.blended_rate_fte || null,
        blended_rate_subcon: projectData.blended_rate_sub_con || null,

        created_by: projectData.created_by,
        modified_by: projectData.modified_by || null,
        created_datetime: projectData.created_datetime || new Date(),
        modified_datetime: projectData.modified_datetime || new Date(),

        interaction_cc_list: projectData.project_cc_list || null,
        claim_status: null,

        total_cost_prj: projectData.total_cost || 0,
        total_cost_nonlabor_prj: projectData.total_non_labor_cost,
        total_cost_fte_prj: projectData.total_fte_cost,
        total_cost_subcon_prj: projectData.total_sub_con_cost,

        total_hours_prj: projectData.total_effort,
        total_hours_fte_prj: projectData.total_fte_effort,
        total_hours_subcon_prj: projectData.total_sub_con_effort,
      };

      // await ProjectFiscalModel.create(projectFiscalData);
    } catch (err) {
      errorLog("Error adding project fiscal: " + (err as Error).message);
      throw new Error("Error adding project fiscal: " + (err as Error).message);
    }
  }

  async updateProjectFiscal(
    projectData: any,
    sequilzeInstance: Sequelize,
    schemaName: string,
    projectRid: string
  ) {
    try {
      const ProjectModel = await Project.initialize(
        sequilzeInstance,
        schemaName
      );
      const ProjectFiscalModel = await ProjectFiscal.initialize(
        sequilzeInstance,
        schemaName
      );

      const updateData = {
        account_rid: projectData.account_id,
        fiscal_year: projectData.fiscal_year,
        max_ai_interaction: projectData.max_ai_interaction || 0,
        auto_send_ai_interaction: projectData.auto_send_ai_interaction ?? false,
        project_startdate: projectData?.project_startdate || null,
        project_enddate: projectData?.project_enddate || null,

        total_fte: projectData.total_fte || null,
        total_sub_con: projectData.total_sub_con || null,

        total_cost: projectData.total_cost || null,
        blended_rate_fte: projectData.blended_rate_fte || null,
        blended_rate_sub_con: projectData.blended_rate_sub_con || null,
        interaction_cc_list: projectData.project_cc_list || null,
        modified_by: projectData.modified_by,
        modified_datetime: new Date(),
        status_rid: projectData.status_rid,

        total_fte_prj: projectData.total_fte || null,
        total_subcon_prj: projectData.total_sub_con || null,

        total_cost_prj: projectData.total_cost || null,
        total_cost_fte_prj: projectData.total_fte_cost || null,
        total_cost_subcon_prj: projectData.total_sub_con_cost,
        total_cost_nonlabor_prj: projectData.total_non_labor_cost,

        total_hours_prj: projectData.total_effort,
        total_hours_fte_prj: projectData.total_fte_effort,
        total_hours_subcon_prj: projectData.total_sub_con_effort,
      };

      await ProjectFiscalModel.update(updateData, {
        where: {
          project_rid: projectRid,
        },
      });
    } catch (err) {
      errorLog("Error updating project fiscal: " + (err as Error).message);
      throw new Error(
        "Error updating project fiscal: " + (err as Error).message
      );
    }
  }

  async updateProjectHistory(
    accountNumber: string,
    projectId: string,
    newProjectData: any,
    existingProjectData: any
  ) {
    try {
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await initOrgSequelize();
      const ProjectHistoryModel = await ProjectHistory.initialize(
        sequelize,
        schemaName
      );

      const excludedFields = [
        "created_by",
        "modified_by",
        "account_rid",
        "modified_datetime",
      ];

      const cleanedNewData = Object.fromEntries(
        Object.entries(newProjectData).filter(
          ([key]) => !excludedFields.includes(key)
        )
      );

      const historyChanges = Object.entries(cleanedNewData)
        .filter(([key, newValue]) => {
          const oldValue = existingProjectData[key];

          if (newValue == null && oldValue == null) return false;

          if (typeof newValue === "number" || typeof oldValue === "number") {
            return Number(newValue) !== Number(oldValue);
          }

          return String(newValue ?? "") !== String(oldValue ?? "");
        })
        .map(([key, newValue]) => ({
          project_rid: projectId,
          attribute_name: key,
          old_value:
            existingProjectData[key] !== null &&
              existingProjectData[key] !== undefined
              ? String(existingProjectData[key])
              : "",
          new_value:
            newValue !== null && newValue !== undefined ? String(newValue) : "",
          created_by: newProjectData["modified_by"],
        }));

      if (historyChanges.length === 0) return;

      await ProjectHistoryModel.bulkCreate(historyChanges);
    } catch (err) {
      errorLog("Error updating project history : " + (err as Error).message);
      throw new Error(
        "Error updating project history : " + (err as Error).message
      );
    }
  }

  async updateQrePercentAdjustment(
    data: IUpdateQrePecentAdjustment,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: any;
  }> {
    try {
      const { account_rid, rid, rd_percent_potential_ai } = data;

      const accountData = await this.schemaService.fetchAccountById(account_rid);

      if (!accountData) {
        throw new Error("Error creating project: Invalid account ID");
      }

      if (accountData.status !== "active") {
        throw new Error(
          "Project creation failed: The selected account is inactive. Please choose an active account."
        );
      }

      let accountNumber = accountData.r_number;

      if (
        accountData.parent_account_rid === null ||
        accountData.parent_account_rid === ""
      ) {
        throw new Error("Error creating project: Invalid account ID");
      }

      if (accountData.storage_type === "store_in_parent") {
        accountNumber = await this.schemaService.fetchParentAccount(
          accountData.parent_account_rid
        );
      }

      const isExists = await this.schemaService.checkIfSchemaExists(
        accountNumber
      );

      if (!isExists) {
        throw new Error("Invalid account ID: schema doesn't exists");
      }

      await this.schemaService.updateQreAdjustmentCalculation(
        accountNumber,
        rid,
        rd_percent_potential_ai,
        userId
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {},
      };
    } catch (err) {
      errorLog("Error updating QRE% adjustment: " + (err as Error).message);
      return this.throwServiceError(err as Error);
    }
  }

  async calculateKeyContactDetails(keyContacts: any[], mainDbSequlize: any) {
    let technicalConsultant = "-";
    let financialConsultant = "-";
    let projectPointOfContact = "-";

    if (keyContacts) {
      const keyContactIds = [
        ...new Set(keyContacts.map((r: any) => r.key_contact_role)),
      ].filter(Boolean);

      let keyContactMap: Record<string, string> = {};
      let keyContactRoleMap: Record<string, string> = {};

      if (keyContactIds.length > 0) {
        const keyContactRows = await mainDbSequlize.query(
          rawQueries.fetchKeyContactsByIds(),
          {
            replacements: { ids: keyContactIds },
            type: "SELECT",
          }
        );

        keyContactMap = Object.fromEntries(
          keyContactRows.map((c: any) => [c.rid, c.role_name])
        );
        keyContactRoleMap = Object.fromEntries(
          keyContactRows.map((c: any) => [c.role_map, c.role_name])
        );
      }

      const enrichedKeyContacts = keyContacts.map((kc: any) => ({
        ...kc,
        role_name: keyContactMap[kc.key_contact_role] || null,
      }));

      const technicalContact = enrichedKeyContacts.find(
        (e: any) =>
          e.role_name ===
          keyContactRoleMap[primaryKeyContacts.technical_point_of_contact] &&
          e.is_primary_contact
      );
      const financialContact = enrichedKeyContacts.find(
        (e: any) =>
          e.role_name ===
          keyContactRoleMap[primaryKeyContacts.financial_consultant] &&
          e.is_primary_contact
      );
      const pointOfContact = enrichedKeyContacts.find(
        (e: any) =>
          e.role_name ===
          keyContactRoleMap[primaryKeyContacts.project_point_of_contact] &&
          e.is_primary_contact
      );

      technicalConsultant = technicalContact
        ? technicalContact.key_contact_name
        : null;
      financialConsultant = financialContact
        ? financialContact.key_contact_name
        : null;
      projectPointOfContact = pointOfContact
        ? pointOfContact.key_contact_name
        : null;
    } else {
      return {
        technicalConsultant: null,
        financialConsultant: null,
        projectPointOfContact: null,
      };
    }

    return { technicalConsultant, financialConsultant, projectPointOfContact };
  }

  getSortParameters(sortBy: string, sortOrder: string): [string, string] {
    const validSortColumns = [
      "r_number",
      "project_code",
      "industry_name",
      "project_startdate",
      "project_name",
      "program_name",
      "project_enddate",
      "project_type_rid",
      "project_type",
      "project_classification_rid",
      "project_client_group",
      "project_group",
      "status_rid",
      "account_rid",
      "rid",
      "total_cost",
      "total_effort",
      "total_fte",
      "total_cost_fte",
      "total_subcon",
      "total_cost_subcon",
      "total_cost_nonlabor",
      "country_rid",
      "region",
      "currency",
      "qualified_research_expenditure",
      "is_rd_qualified",
      "qre",
      "fiscal_year",
      "comments",
      "modified_datetime",
      "assessment_status",
      "qre_final",
      "rd_percent_final"
    ];

    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }

  getMetaDataSortParameters(
    sortBy: string,
    sortOrder: string
  ): [string, string] {
    const validSortColumns = [
      "account_name",
      "country_name",
      "region_name",
      "currency_name",
      "technical_point_of_contact",
      "financial_consultant",
      "project_point_of_contact",
      "project_point_of_contact_email",
      "technical_point_of_contact_email",
      "classification_name",
      "industry_name",
      "project_type_name",
      "project_type_rid",
    ];

    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }

  buildWhereClause(
    filters: Record<string, any>,
    search: string,
    isAllProject: boolean = false,
    isParent: boolean = false
  ): {
    whereClause: Record<string, any>;
    searchClause: Record<string, any>;
  } {
    let whereClause: Record<string, any> = {};
    let searchClause: Record<string, any> = {};

    if (search) {
      searchClause = this.buildSearchCondition(
        search,
        whereClause,
        isAllProject
      );
    }

    whereClause = this.applyFilters(
      filters,
      whereClause,
      isAllProject,
      isParent
    );

    return { whereClause, searchClause };
  }

  private buildSearchCondition(
    search: string,
    whereClause: Record<string, any>,
    isAllProject: boolean
  ): Record<string, any> {
    const searchCondition = [
      { project_code: { [Op.iLike]: `%${search}%` } },
      { project_name: { [Op.iLike]: `%${search}%` } },
    ];

    let AllProjectsearchCondition = null;

    if (isAllProject) {
      AllProjectsearchCondition = [
        { industry: { [Op.iLike]: `%${search}%` } },
        { r_number: { [Op.iLike]: `%${search}%` } },
        { project_code: { [Op.iLike]: `%${search}%` } },
        { project_name: { [Op.iLike]: `%${search}%` } },
        { project_description: { [Op.iLike]: `%${search}%` } },
        { status_rid: { [Op.iLike]: `%${search}%` } },
        ...(isNaN(parseInt(search))
          ? []
          : [
            { total_cost: { [Op.eq]: parseInt(search) } },
            { total_effort: { [Op.eq]: parseInt(search) } },
          ]),
      ];
    }

    const finalSearchCondition = {
      [Op.or]: isAllProject ? AllProjectsearchCondition : searchCondition,
    };

    return Object.keys(whereClause).length > 0
      ? { [Op.and]: [whereClause, finalSearchCondition] }
      : finalSearchCondition;
  }

  private applyFilters(
    filters: Record<string, any>,
    whereClause: Record<string, any>,
    isAllProject: boolean,
    isParent: boolean
  ): Record<string, any> {
    const castToTextFields = [
      "rid",
      "project_startdate",
      "project_enddate",
      "total_effort",
      "total_cost",
      "fiscal_year",
    ];

    const numberFields = [
      "total_effort",
      "total_cost",
      "fiscal_year",
      "total_fte",
      "total_cost_fte",
      "total_effort_prj",
      "total_subcon",
      "total_cost_subcon",
      "total_cost_nonlabor",
      "qualified_research_expenditure",
      "qre",
      "qre_final",
      "rd_percent_final"
    ];
    const dateFields = [
      "project_startdate",
      "project_enddate",
      "modified_datetime",
    ];
    const enumFields = [
      "status_rid",
      "project_type_rid",
      "fiscal_year",
      "ProjectFiscal.project_type_rid",
    ];
    const booleanFields = ["is_rd_qualified"];

    const filterFields = this.getFilterFields(isAllProject, isParent);

    filterFields.forEach(({ clientField, dbField }) => {
      if (filters[clientField]) {
        const fieldFilter = filters[clientField];
        const isNumber = numberFields.includes(dbField);
        const isDate = dateFields.includes(dbField);
        const isEnum = enumFields.includes(dbField);
        const isBoolean = booleanFields.includes(dbField);
        const isTextCastNeeded =
          castToTextFields.includes(clientField) &&
          !isNumber &&
          !isDate &&
          !isBoolean;

        if (isTextCastNeeded) {
          whereClause[dbField] = Sequelize.where(
            Sequelize.cast(Sequelize.col(dbField), "TEXT"),
            this.getFieldFilter(
              fieldFilter,
              dbField,
              isNumber,
              isDate,
              isEnum,
              isBoolean
            )
          );
        } else {
          whereClause[dbField] = this.getFieldFilter(
            fieldFilter,
            dbField,
            isNumber,
            isDate,
            isEnum,
            isBoolean
          );
        }
      }
    });

    return whereClause;
  }

  private getFieldFilter(
    fieldFilter: any,
    dbField: string,
    isNumberField: boolean,
    isDateField: boolean,
    isEnumField: boolean,
    isBooleanField: boolean
  ): any {
    if (isNumberField) {
      if (fieldFilter.equals !== undefined) {
        return { [Op.eq]: fieldFilter.equals };
      }
      if (fieldFilter.not_equals !== undefined) {
        return {
          [Op.or]: [{ [Op.ne]: fieldFilter.not_equals }, { [Op.is]: null }],
        };
      }
      if (fieldFilter.less_than !== undefined) {
        return { [Op.lt]: fieldFilter.less_than };
      }
      if (fieldFilter.greater_than !== undefined) {
        return { [Op.gt]: fieldFilter.greater_than };
      }
      if (
        fieldFilter.between &&
        Array.isArray(fieldFilter.between) &&
        fieldFilter.between.length === 2
      ) {
        return {
          [Op.between]: [fieldFilter.between[0], fieldFilter.between[1]],
        };
      }
      if (fieldFilter.is_empty === true) {
        return { [Op.or]: [null] };
      }
    }

    if (isDateField) {
      if (fieldFilter.equals !== undefined) {
        if (fieldFilter.equals !== undefined) {
          const dateStr = fieldFilter.equals;

          const startOfDay = moment
            .utc(dateStr, "YYYY-MM-DD")
            .startOf("day")
            .toDate();
          const endOfDay = moment
            .utc(dateStr, "YYYY-MM-DD")
            .endOf("day")
            .toDate();

          return {
            [Op.between]: [startOfDay, endOfDay],
          };
        }
      }
      if (fieldFilter.before !== undefined) {
        return { [Op.lt]: this.normalizeDate(fieldFilter.before) };
      }
      if (fieldFilter.after !== undefined) {
        return { [Op.gt]: this.normalizeDate(fieldFilter.after) };
      }
      if (
        fieldFilter.between &&
        Array.isArray(fieldFilter.between) &&
        fieldFilter.between.length === 2
      ) {
        return {
          [Op.between]: [
            this.normalizeDate(fieldFilter.between[0]),
            this.normalizeDate(fieldFilter.between[1]),
          ],
        };
      }
      if (fieldFilter.is_empty === true) {
        return { [Op.or]: [null] };
      }
    }

    if (isEnumField) {
      if (fieldFilter.equals !== undefined) {
        return { [Op.eq]: fieldFilter.equals };
      }
      if (fieldFilter.not_equals !== undefined) {
        return {
          [Op.or]: [{ [Op.ne]: fieldFilter.not_equals }, { [Op.is]: null }],
        };
      }
      if (fieldFilter.in && Array.isArray(fieldFilter.in)) {
        return { [Op.in]: fieldFilter.in };
      }
      if (fieldFilter.is_empty === true) {
        return { [Op.or]: [null] };
      }
    }

    if (isBooleanField) {
      if (fieldFilter.isTrue === true) {
        return { [Op.eq]: true };
      }
      if (fieldFilter.isFalse === true) {
        return { [Op.eq]: false };
      }
      if (fieldFilter.is_empty === true) {
        return { [Op.or]: [null] };
      }
    }

    // String (default)
    if (fieldFilter.equals) {
      return { [Op.iLike]: fieldFilter.equals };
    }
    if (fieldFilter.not_equals) {
      return {
        [Op.or]: [{ [Op.notILike]: fieldFilter.not_equals }, { [Op.is]: null }],
      };
    }
    if (fieldFilter.contains) {
      return { [Op.iLike]: `%${fieldFilter.contains}%` };
    }
    if (fieldFilter.not_contains) {
      return {
        [Op.or]: [
          { [Op.notILike]: `%${fieldFilter.not_contains}%` },
          { [Op.is]: null },
        ],
      };
    }
    if (fieldFilter.is_empty === true) {
      return { [Op.or]: [null, ""] };
    }
    if (fieldFilter.value) {
      return fieldFilter.value;
    }

    return undefined;
  }

  getSortParametersForAllProjects(
    sortBy: string,
    sortOrder: string
  ): [string, string] {
    const validSortColumns = [
      "r_number",
      "project_r_number",
      "project_code",
      "industry_name",
      "project_startdate",
      "project_enddate",
      "project_name",
      "total_effort",
      "total_cost",
      "status_name",
      "fiscal_year",
      "account_name",
      "program_name",
      "is_rd_qualified",
      "qre",
      "qre_final",
      "total_fte",
      "total_cost_fte",
      "total_subcon",
      "total_cost_subcon",
      "total_cost_nonlabor",
      "comments",
      "country_name",
      "currency_code",
      "region_name",
      "project_number",
      "project_point_of_contact",
      "financial_consultant",
      "technical_point_of_contact",
      "project_client_group",
      "project_group",
      "classification_name",
      "modified_datetime",
      "created_datetime",
      "assessment_status",
      "project_type_name",
    ];
    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }
    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }

  processAccountDataSort(sortBy: string, sortOrder: string) {
    const accountDataSort: string[][] = [];
    const accountFields = ["account_number", "account_name"];

    if (accountFields.includes(sortBy)) {
      accountDataSort.push([
        sortBy,
        sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC",
      ]);
    }

    return {
      accountDataSort,
    };
  }

  normalizeDate(input: string): any | null {
    let parsed = moment.utc(input, "YYYY-MM-DD", true);
    if (!parsed.isValid()) throw new Error("Invalid date");

    const startOfDay = parsed.startOf("day").toDate();
    return startOfDay;
  }

  getFilterFields(
    isAllProject: boolean,
    isParent: boolean
  ): { clientField: string; dbField: string }[] {
    const projectFilterFields = [
      { clientField: "rid", dbField: "rid" },
      { clientField: "r_number", dbField: "r_number" },
      { clientField: "project_code", dbField: "project_code" },
      { clientField: "program_name", dbField: "program_name" },
      { clientField: "project_name", dbField: "project_name" },
      { clientField: "project_description", dbField: "project_description" },
      { clientField: "fiscal_year", dbField: "fiscal_year" },
      { clientField: "total_effort", dbField: "total_effort" },
      { clientField: "total_cost", dbField: "total_cost" },
      { clientField: "status_rid", dbField: "status_rid" },
      { clientField: "project_type_rid", dbField: "project_type_rid" },
      { clientField: "project_startdate", dbField: "project_startdate" },
      { clientField: "project_enddate", dbField: "project_enddate" },
      { clientField: "project_client_group", dbField: "project_client_group" },
      { clientField: "project_group", dbField: "project_group" },
      { clientField: "created_datetime", dbField: "created_datetime" },
      { clientField: "created_by", dbField: "created_by" },
      { clientField: "total_cost_fte", dbField: "total_cost_fte" },
      { clientField: "total_fte", dbField: "total_fte" },
      { clientField: "total_subcon", dbField: "total_subcon" },
      { clientField: "total_cost_subcon", dbField: "total_cost_subcon" },
      { clientField: "total_cost_nonlabor", dbField: "total_cost_nonlabor" },
      { clientField: "comments", dbField: "comments" },
      { clientField: "qre_final", dbField: "qre_final" },
      { clientField: "rd_percent_final", dbField: "rd_percent_final" },
      {
        clientField: "qualified_research_expenditure",
        dbField: "qualified_research_expenditure",
      },
      { clientField: "is_rd_qualified", dbField: "is_rd_qualified" },
      { clientField: "qre", dbField: "qre" },
      { clientField: "modified_datetime", dbField: "modified_datetime" },
      { clientField: "assessment_status", dbField: "assessment_status" },
    ];

    return projectFilterFields;
  }

  buildMetaDataWhereClause(filters: Record<string, any>) {
    const filterFields = [
      { clientField: "account_name", dbField: "account_name" },
      { clientField: "country_name", dbField: "country_name" },
      { clientField: "region_name", dbField: "region_name" },
      { clientField: "currency_name", dbField: "currency_name" },
      {
        clientField: "technical_point_of_contact",
        dbField: "technical_point_of_contact",
      },
      { clientField: "financial_consultant", dbField: "financial_consultant" },
      {
        clientField: "project_point_of_contact",
        dbField: "project_point_of_contact",
      },
      { clientField: "classification_name", dbField: "classification_name" },
    ];

    return filterFields;
  }

  /**
   * Fetches a list of project classification from the database.
   *
   * @returns {Promise<{ statusCode: number, message: string, errorMessage?: string, data?: { country: any } }>} The response object containing status code, message, and a list of countries.
   * - statusCode: HTTP status code indicating the result of the request.
   * - message: A success or error message based on the outcome of the request.
   * - errorMessage (optional): The error message in case of a failure.
   * - data (optional): An object containing the list of project classification if the request is successful.
   */
  async getProjectClassification(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectClassifications: any; count: number };
  }> {
    try {
      const mainDbSequlize = await initMainDbSequelize();
      const projectClassifications = await mainDbSequlize.query(
        rawQueries.fetchProjectClassification(),
        {
          type: "SELECT",
        }
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projectClassifications,
          count: projectClassifications.length,
        },
      };
    } catch (err) {
      errorLog("Error fetching project classification: " + (err as Error).message);
      return this.throwServiceError(err as Error);
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

  async getCurrencyDetailsByAccountRidRaw(
    accountRid: string
  ): Promise<string | null> {
    const query = rawQueries.fetchAccountDetailsByRid(accountRid);
    try {
      const mainDb = await initMainDbSequelize();
      const result = await mainDb.query(query, {
        type: "SELECT",
      });
      return result ? (result[0] as any).currency_rid : null;
    } catch (err) {
      errorLog("Error fetching currency rid: " + (err as Error).message);
      return null;
    }
  }

  async assignCurrencyRid(result: any, mainDbSequelize: any) {
    if (!result.currency) {
      const currencyRid = await this.getCurrencyDetailsByAccountRidRaw(
        result.account_rid
      );
      if (currencyRid) {
        result.currency = currencyRid;
      } else {
        try {
          const usdCurrencyId = await mainDbSequelize.query(
            rawQueries.fetchDefaultCurrency(),
            { type: "SELECT" }
          );
          result.currency = usdCurrencyId[0]?.rid;
        } catch (err) {
          errorLog("Error fetching USD currency: " + (err as Error).message);
        }
      }
    }
  }
  async fetchQreHistoryByAccountId(data: any) {
    const mainDbSequlize = await initMainDbSequelize();
    const orgDbSequlize = await initOrgSequelize();

    const fetchParentAccount: any = await mainDbSequlize.query(await rawQueries.fetchParentAccount(data.account_rid, mainDbSequlize))
    if (fetchParentAccount[0].length > 0) {
      let parentAccountRNumber = fetchParentAccount[0][0].r_number;
      let schemaName = rawQueries.fetchSchemaName(parentAccountRNumber);
      let result: any = await orgDbSequlize.query(fetchQreHistoryDatas(schemaName, data.account_rid, data.page, data.limit, data.sort, data.sort_by, data.filter, data.project_fiscal_rid))
      if (result[0][0].data !== null) {
        const finalResult = result[0][0].data.map((d: any) => {
          return {
            rid: d.rid,
            created_datetime: d.created_datetime,
            transaction_id: d.transaction_id,
            project_fiscal_rid: d.project_fiscal_rid,
            project_rid: d.project_rid,
            account_rid: d.account_rid,
            qre_percent: d.qre_percent,
            version: d.version,
            qre_detailed_breakdown: d.qre_detailed_breakdown
          }
        });
        return {
          status: HttpStatus.SUCCESS,
          total_result: result[0][0].data[0].total_result,
          data: finalResult
        };
      } else {
        return {
          status: HttpStatus.NOT_FOUND,
          total_result: 0,
          data: []
        };
      }
    }
  }
}
