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
import { errorLog, logMessage } from "../../utils/helpers";
import {
  assignProjectType,
  CaseHeadersColumns,
  filterType,
  ICreateCases,
} from "../../utils/types";

// Define filterType interface
import { Case, setupCaseSequence } from "../../models/caseModel";
import {
  fetchCasesHeadersDatas,
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

class CaseSchemaService {
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;
  private caseModelService: CaseModelService;

  constructor() {
    this.caseModelService = new CaseModelService();
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

      await CaseHistory.bulkCreate(historyChanges);
    } catch (err) {
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
      const caseHistoryModel = await CaseHistory.initialize(
        orgDbSequlize,
        schemaName
      );

      await CaseModel.sync({ force: false });
      await setupCaseSequence(orgDbSequlize, schemaName);
      await caseTimelineModel.sync({ force: false });
      await setupCaseTimelineSequence(orgDbSequlize, schemaName);
      await caseHistoryModel.sync({ force: false });
      await setupCaseHistorySequence(orgDbSequlize, schemaName);
    } catch (err) {
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
      let totalResults: number = 0;
      let disablePagination = false;

      if (data.fiscal_year && data.fiscal_year !== 0) {
        filters.fiscal_year = data.fiscal_year;
      }
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
      if (filters) {
        ["modified_by"].forEach((key) => {
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
      if (data.fiscal_year && data.fiscal_year !== 0) {
        whereConditions.fiscal_year = data.fiscal_year;
      }

      const { rows: caseDetails, count } = await Case.findAndCountAll({
        where: whereConditions,
        order: [[finalSortBy, finalSortOrder]],
        ...(disablePagination ? {} : { limit: limit, offset: offset }),
      });
      // You can now use both technicalSummary (array) and count (number)
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
                account_name: accountInfo?.account_name,
                country_code: accountInfo?.country_code,
                case_name: d.case_name,
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
    accessibleIds: string[]
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
        accessibleIds
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
    await this.createCaseProjectTables(accountNumber);
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
    await this.createCaseProjectTables(accountNumber);
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
    apiType?: string
  ) {
    try {
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

      searchValue = search ? `%${search}%` : `%%`;
      whereKey = `1 = 1`;

      // Optimized conditions joining
      const conditions = [
        globalFiltersQueryConditions,
        fiscalYearQuery,
        filterQueryValues,
      ].filter(Boolean);

      const joinedConditions =
        conditions.length > 0 ? " AND " + conditions.join(" AND ") : "";

      // Optimized sorting logic using extracted utility function
      const sortColumn = getSortColumn(sortBy);
      const sortDirection = sortOrder || "ASC";
      logMessage(`Sorting by column: ${sortColumn}, direction: ${sortDirection}`);
      sortValue = `ORDER BY ${sortColumn} ${sortDirection}`;
      let caseSummaryQuery = await listAllCasesSummaryQuery(
        searchValue,
        whereKey,
        joinedConditions,
        sortValue,
        pagination,
        accessibleIds
      );
      const [result]: any[] = await this.mainDbSequelize.query(caseSummaryQuery,{type: "SELECT"});
      return result;
    } catch (err) {
      logMessage(`Error in fetch cases summary: ${err}`);
      errorLog("Error in fetch cases summary:", (err as Error).message);
      return [];
    }
  }
  async addCaseTimeline(
    accountNumber: string,
    eventName: string,
    caseRequest: ICreateCases,
    caseId: string,
    userId: string,
    transaction: Transaction
  ) {
    try {
      const { CaseTimeline } = await this.caseModelService.getModels(
        accountNumber
      );

      await CaseTimeline.create(
        {
          account_rid: caseRequest.account_rid,
          event_name: eventName,
          event_status: "success",
          event_type: "ui handler",
          entity_rid: caseId,
          created_by: userId,
          event_datetime: new Date(),
          created_datetime: new Date(),
        },
        {
          transaction,
        }
      );
    } catch (err) {
      logMessage(`Error creating case timeline: ${err}`);
      throw new Error("Error creating case timeline");
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
    case_name: "c.case_name",
    createdAt: "c.created_datetime",
    filing_type_name: "c.filing_type_name"
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
  if (Object.keys(filters).length > 0) {
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
            const datetimeCondition = buildDatetimeFilterCondition(
              condition,
              values,
              filteredColumns!
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
// Optimized utility function for handling numeric filter conditions
const buildNumericFilterCondition = (
  condition: string,
  values: any,
  filteredColumns: string,
  tableAlias: string ="cs"
): string => {
  const columnRef = `${tableAlias}.${filteredColumns}`;

  // Use object mapping for better performance instead of switch
  const conditionMap: Record<string, (col: string, val: any) => string> = {
    [ALPHANUMERIC_CONDITIONS.equals]: (col, val) => `${col} = ${val}`,
    [ALPHANUMERIC_CONDITIONS.notEquals]: (col, val) => `${col} != ${val}`,
    [ALPHANUMERIC_CONDITIONS.greater_than]: (col, val) => `${col} > ${val}`,
    [ALPHANUMERIC_CONDITIONS.less_than]: (col, val) => `${col} < ${val}`,
    [ALPHANUMERIC_CONDITIONS.between]: (col, val) =>
      `${col} BETWEEN ${Array.isArray(val) ? val.join(" AND ") : val}`,
    [ALPHANUMERIC_CONDITIONS.isEmpty]: (col) => `${col} IS NULL`,
    [ALPHANUMERIC_CONDITIONS.IN]: (col, val) =>
      `${col} IN (${Array.isArray(val) ? val.join(",") : val})`,
  };

  return conditionMap[condition]?.(columnRef, values) || "";
};

// Optimized utility function for handling string filter conditions
const buildStringFilterCondition = (
  condition: string,
  values: any,
  filteredColumns: string,
  dynamicReference: string
): string => {
  // Optimize column reference determination
  const getColumnRef = (column: string, ref: string): string => {
    const columnMap: Record<string, string> = {
      created_user_name: "(uc.first_name || ' ' || uc.last_name)",
      modified_user_name: "(um.first_name || ' ' || um.last_name)",
    };
    return columnMap[column] || `${ref}.${column}`;
  };

  const columnRef = getColumnRef(filteredColumns, dynamicReference);

  // Use object mapping for conditions
  const conditionMap: Record<string, (col: string, val: any) => string> = {
    [ALPHANUMERIC_CONDITIONS.equals]: (col, val) =>
      `LOWER(${col}) = LOWER('${val}')`,
    [ALPHANUMERIC_CONDITIONS.notEquals]: (col, val) =>
      `(LOWER(${col}) != LOWER('${val}') OR ${col} IS NULL)`,
    [ALPHANUMERIC_CONDITIONS.isEmpty]: (col) => `${col} IS NULL`,
    [ALPHANUMERIC_CONDITIONS.contains]: (col, val) => `${col} ILIKE '%${val}%'`,
    [ALPHANUMERIC_CONDITIONS.IN]: (col, val) =>
      `${col} IN (${
        Array.isArray(val)
          ? val.map((d: any) => `'${d}'`).join(",")
          : `'${val}'`
      })`,
  };

  return conditionMap[condition]?.(columnRef, values) || "";
};

// Optimized utility function for handling datetime filter conditions
const buildDatetimeFilterCondition = (
  condition: string,
  values: any,
  filteredColumns: string,
  tableAlias: string = "i"
): string => {
  const columnRef = `DATE(${tableAlias}.${filteredColumns})`;

  // Use object mapping for better performance
  const conditionMap: Record<string, (col: string, val: any) => string> = {
    [ALPHANUMERIC_CONDITIONS.equals]: (col, val) => `${col} = '${val}'`,
    [ALPHANUMERIC_CONDITIONS.before]: (col, val) => `${col} < '${val}'`,
    [ALPHANUMERIC_CONDITIONS.after]: (col, val) => `${col} > '${val}'`,
    [ALPHANUMERIC_CONDITIONS.between]: (col, val) =>
      `${col} BETWEEN ${
        Array.isArray(val)
          ? val.map((d: any) => `'${d}'`).join(" AND ")
          : `'${val}'`
      }`,
    [ALPHANUMERIC_CONDITIONS.isEmpty]: (col) => `${col} IS NULL`,
  };

  return conditionMap[condition]?.(columnRef, values) || "";
};

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
