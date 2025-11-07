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
  filterTypesForCaseSummary,
  HttpStatus,
  MAIN_SCHEMA_NAME,
  mainTableFilters,
  rawQueries,
  SCHEMANAME_PREFIX,
  STATUS_MESSAGE,
} from "../../utils/constants";
import { buildDatetimeFilterCondition, buildNumericFilterCondition, buildStringFilterCondition, errorLog, logMessage } from "../../utils/helpers";
import {
  assignProjectType,
  CaseHeadersColumns,
  filterType,
  ICreateCases,
  ICreateCaseTeam,
  ICreateChecklist,
  ICreateChecklistItem,
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
import { log } from "console";
import { CheckList, setupCheckListSequence } from "../../models/checkListModel";
import { CheckListItem } from "../../models/checkListItemModel";
import { CaseTask, setupCaseTaskSequence } from "../../models/caseTaskModel";
import { CaseMilestone, setupCaseMilestoneSequence } from "../../models/caseMilestoneModel";

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
      await this.createCaseTables(accountNumber);
      const casecreationResponse = await Case.create(caseRequest, {
        transaction,
      });

      // Add timeline entry for case creation
      if (casecreationResponse && casecreationResponse.rid) {
        const fetchTaskTypeRid = await this.getTaskType();
        if(fetchTaskTypeRid) {
          await this.cloneDefaultMilestoneTaskTemplate(casecreationResponse.account_rid, casecreationResponse.rid,
          casecreationResponse.filing_type_rid, fetchTaskTypeRid.rid, accountNumber, transaction, casecreationResponse.case_startdate)
        }
        await this.addCaseManagementTimeline(
          accountNumber,
          casecreationResponse.rid,
          caseRequest.account_rid,
          caseRequest,
          caseRequest.created_by || "",
          "created"
        );
      }

      return casecreationResponse;
    } catch (error) {
      logMessage(`Error creating case: ${error}`);
      throw new Error("Error creating case: " + error);
    }
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
      const jurisdictionModel = await Jurisdiction.initialize(
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

      await CaseModel.sync({ force: false });
      await setupCaseSequence(orgDbSequlize, schemaName);
      await CaseProjectModel.sync({ force: false });
      await setupCaseSequence(orgDbSequlize, schemaName);
      await caseTimelineModel.sync({ force: false });
      await setupCaseTimelineSequence(orgDbSequlize, schemaName);
      await caseHistoryModel.sync({ force: false });
      await setupCaseHistorySequence(orgDbSequlize, schemaName);
      await caseTeamModel.sync({ force: false });
      await setupCaseTeamSequence(orgDbSequlize, schemaName);
      await jurisdictionModel.sync({ force: false });
      await checkListModel.sync({ force: false });
      await setupCheckListSequence(orgDbSequlize, schemaName);
      await checkListItemModel.sync({ force: false });
      await CaseMilestoneModel.sync({ force : false});
      await setupCaseMilestoneSequence(orgDbSequlize, schemaName);
      await CaseTaskModel.sync({force : false});
      await setupCaseTaskSequence(orgDbSequlize, schemaName);
    } catch (err) {
      errorLog("Error creating case tables", (err as Error).message);
      console.log(err)
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
                case_full_name: accountInfo?.account_name + ' - ' + accountInfo?.country_code + ' - ' + d.fiscal_year + ' - ' + d.case_name,
                description: d.description,
                fiscal_year: d.fiscal_year,
                case_owner_rid: d.case_owner_rid,
                case_owner_name: caseOwnerMap.get(d.case_owner_rid) || null,
                country_rid: d.country_rid,
                case_total_projects: d.case_total_projects,
                case_total_qualified_projects: d.case_total_qualified_projects,
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
              logMessage(`Comparing "${fieldValue}" === "${filterValue}"`);
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

    for (let p of data.projects) {
      await CaseProject.create({
        case_rid: data.case_rid,
        account_rid: data.account_rid,
        created_by: data.created_by,
        created_datetime: new Date(),
        project_rid: p.project_rid,
        project_group: p.project_group,
        project_fiscal_rid: p.project_fiscal_rid,
      });
      iterationCount += 1;
    }
    if (totalCount === iterationCount) {
      const getTotalProjectCount: any = await this.orgDbSequelize.query(
        rawQueries.getTotalProjectsCount(
          schemaName,
          data.case_rid,
          data.account_rid
        )
      );
      const getTotalProjectCost: any = await this.orgDbSequelize.query(
        rawQueries.getTotalProjectCost(
          schemaName,
          data.case_rid,
          data.account_rid
        )
      );
      await this.orgDbSequelize.query(
        rawQueries.updateCostCountInCase(
          schemaName,
          data.case_rid,
          getTotalProjectCount[0][0].total_projects,
          getTotalProjectCost[0][0].total_cost
        )
      );
      await this.mainDbSequelize.query(
        rawQueries.updateCostCountInCaseSummary(
          data.case_rid,
          getTotalProjectCount[0][0].total_projects,
          getTotalProjectCost[0][0].total_cost
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
      const getTotalProjectCount: any = await this.orgDbSequelize.query(
        rawQueries.getTotalProjectsCount(
          schemaName,
          data.case_rid,
          data.account_rid
        )
      );
      const getTotalProjectCost: any = await this.orgDbSequelize.query(
        rawQueries.getTotalProjectCost(
          schemaName,
          data.case_rid,
          data.account_rid
        )
      );
      await this.orgDbSequelize.query(
        rawQueries.updateCostCountInCase(
          schemaName,
          data.case_rid,
          getTotalProjectCount[0][0].total_projects,
          getTotalProjectCost[0][0].total_cost
        )
      );
      await this.mainDbSequelize.query(
        rawQueries.updateCostCountInCaseSummary(
          data.case_rid,
          getTotalProjectCount[0][0].total_projects,
          getTotalProjectCost[0][0].total_cost
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
        const validationError = await this.validateNoOverlappingDates(
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
          const [updatedRowsCount] = await CaseTeam.update(
            {
              role_rid: teamMember.role_rid,
              user_rid: teamMember.user_rid,
              effective_startdate: teamMember.effective_from,
              effective_enddate: teamMember.effective_to,
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
        }
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
        const validationError = await this.validateNoOverlappingDates(
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
        } else {
          const newTeamMember = await CaseTeam.create({
            account_rid: caseTeamRequest.account_rid,
            case_rid: caseTeamRequest.case_rid,
            role_rid: teamMember.role_rid,
            user_rid: teamMember.user_rid,
            effective_startdate: teamMember.effective_from,
            effective_enddate: teamMember.effective_to,
            created_by: userId,
            created_datetime: new Date(),
          });

          results.push({
            action: "inserted",
            data: newTeamMember,
            user_rid: teamMember.user_rid,
            role_rid: teamMember.role_rid,
            status: "success",
          });
        }
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
    type: string = "list"
  ) {
    try {
      const { CaseTeam } = await this.caseModelService.getModels(accountNumber);
      const whereConditions: any = {
        case_rid: data.case_rid,
        account_rid: data.account_rid,
      };
      const queryOptions: any = {
        where: whereConditions,
        order: [["effective_startdate", "ASC"]],
      };
      const caseTeamMembers = await CaseTeam.findAll(queryOptions);
      return caseTeamMembers;
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

  

  async listUsersForCaseTeam(accountRid: string) {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.caseModelService.getMainSequelize();
      }
      const users = await this.mainDbSequelize.query(
        rawQueries.listUsersForCaseTeam(accountRid),
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
          created_by: caseRequest.created_by,
          //modified_by: caseRequest.modified_by,
          created_datetime: new Date(),
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
          modified_by: caseRequest.modified_by,
           modified_datetime: caseRequest.modified_datetime,
        },
        { where: { rid: caseRequest.checklist_rid }, transaction }
      );

      return createdChecklist;
    } catch (error) {
      logMessage(`Error creating checklist: ${error}`);
      throw new Error("Error creating checklist: " + error);
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
      switch (item.action_type) {
        case "add":
          return await addChecklistItem(
            CheckListItem,
            checklistRid,
            item,
            checkListReq.created_by,
            checkListReq.account_rid,
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
  async cloneDefaultMilestoneTaskTemplate (accountRid : string, caseRid : string, filing_type_rid : string, taskTypeRid : string, accountNumber : string, transaction : Transaction, caseStartDate : Date) {
    const {CaseTask, CaseMilestone} = await this.caseModelService.getModels(accountNumber);
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const queryResult : any = await this.mainDbSequelize.query(fetchMilestoneTaskTemplate(taskTypeRid, filing_type_rid));
    let clonedData = queryResult[0][0]
    if(clonedData.milestone_data.length > 0) {
      const finalMilestoneData = clonedData.milestone_data.map((d : any) => {
        return {
          ...d,
          account_rid : accountRid,
          case_rid : caseRid
        }
      })
      await CaseMilestone.bulkCreate(finalMilestoneData, {transaction})
      if(clonedData.task_data.length > 0) {
        let startDate : Date;
        let endDate : Date;
        let startDateMap : Map<number, Date> = new Map();
        let endDateMap : Map<number, Date> = new Map();
        let startDateStorage;
        let endDateStorage;
        for(let d of clonedData.task_data) {
          if(d.sequence_no === 1) {
            const conversion = dayjs(caseStartDate)
            const res = conversion.add(d.effort_in_days, 'days').format("YYYY-MM-DD");
            endDate = dayjs(res).toDate()
            startDate = caseStartDate
            startDateStorage = startDate
            endDateStorage = endDate
            startDateMap.set(d.sequence_no, startDateStorage)
            endDateMap.set(d.sequence_no, endDateStorage)
          } 
          else {
            const conversion = dayjs(endDateStorage)
            const res = conversion.add(d.effort_in_days, 'day').format("YYYY-MM-DD");
            endDate = dayjs(res).toDate()
            const newStartDate = conversion.add(1, 'day').format('YYYY-MM-DD')
            startDate = dayjs(newStartDate).toDate()
            startDateStorage = startDate
            endDateStorage = endDate
            startDateMap.set(d.sequence_no, startDateStorage)
            endDateMap.set(d.sequence_no, endDateStorage)
          }
        }
        const finalTaskData = clonedData.task_data.map((d : any) => {
          return {
            ...d,
            effective_start_datetime : startDateMap.get(d.sequence_no),
            effective_end_datetime : endDateMap.get(d.sequence_no),
            account_rid : accountRid,
            case_rid : caseRid
          }
        })
        
        await CaseTask.bulkCreate(finalTaskData, {transaction})
      }
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
  transaction: Transaction
) {
  const result = await CheckListItem.create(
    {
      account_rid: accountRid,
      case_checklist_rid: checklistRid,
      checklist_item_name: item.checklist_item_name,
      description: item.description,
      status_rid: item.status_rid,
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
      rid: checklistRid,
    },
    transaction,
  });

  if (existingItem) {
    // Update existing item
    const result = await existingItem.update(
      {
        checklist_item_name: item.checklist_item_name,
        description: item.description,
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
      rid: checklistRid
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