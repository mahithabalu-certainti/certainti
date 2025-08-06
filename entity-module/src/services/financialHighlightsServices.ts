import { Op, Sequelize } from "sequelize";
import { initOrgSequelize } from "../config/orgDataSource";
import { initMainDbSequelize } from "../config/mainDataSource";
import {
  HttpStatus,
  MAIN_SCHEMA_NAME,
  rawQueries,
  STATUS_MESSAGE,
  SUMMARY_HIGHLIGHTS_FLAG,
  SUMMARY_HIGHLIGHTS_TYPE_FLAG,
} from "../utils/constants";
import {
  fetchIsRdQualifiedProjectQuery,
  fetchIsRdQualifiedProjectQueryRegion,
  fetchProjectQueryByPrjId,
  summaryHighlightsQuery,
  summaryHighlightsQueryRegion,
} from "../utils/rawQueries";
import SchemaService from "./schemaService";
import { Logger } from "winston";
import { ProjectFiscal } from "../models/projectFiscal";
import { ProjectFiscalSummary } from "../models/projectFiscalSummary";
import { ProjectSummary } from "../models/projectSummary";
import Decimal from "decimal.js";
import currency from "currency.js";

export default class FinancialHighlightsService {
  private mainDbSequelize: Sequelize | null = null;
  private orgDbSequelize: Sequelize | null = null;
  private schemaService: SchemaService;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.schemaService = new SchemaService();
  }

  async getOrgDbSequelize() {
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await initOrgSequelize();
    }
    return this.orgDbSequelize;
  }
  async getMainDbSequelize() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    return this.mainDbSequelize;
  }

  async summaryHighlightsList(data: any) {
    let mainDb = await this.getMainDbSequelize();
    let orgDb = await this.getOrgDbSequelize();
    let result;

    let fetchParent: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    let schemaName = rawQueries.fetchSchemaName(fetchParent[0][0].r_number);

    if (data.summaryType == SUMMARY_HIGHLIGHTS_TYPE_FLAG.summary) {
      if (data.flag == SUMMARY_HIGHLIGHTS_FLAG.all) {
        result = await orgDb.query(
          summaryHighlightsQuery(data.account_rid, data.fiscal_year, schemaName)
        );
      } else {
        result = await orgDb.query(
          fetchIsRdQualifiedProjectQuery(
            data.account_rid,
            schemaName,
            data.fiscal_year
          )
        );
      }
    } else {
      if (data.flag == SUMMARY_HIGHLIGHTS_FLAG.all) {
        result = await orgDb.query(
          summaryHighlightsQueryRegion(
            data.account_rid,
            data.fiscal_year,
            schemaName,
            data.region_rid
          )
        );
      } else {
        result = await orgDb.query(
          fetchIsRdQualifiedProjectQueryRegion(
            data.account_rid,
            schemaName,
            data.fiscal_year,
            data.region_rid
          )
        );
      }
    }
    if (result[0].length > 0) {
      return {
        statusCode: HttpStatus.SUCCESS,
        statusMessage: STATUS_MESSAGE.accountSummaryHighlightsSuccess,
        data: result[0][0],
      };
    } else {
      return {
        statusCode: HttpStatus.SUCCESS,
        statusMessage: STATUS_MESSAGE.accountSummaryHighlightsSuccess,
        data: null,
      };
    }
  }

  async projectFinancialHighlights(data: any) {
    let mainDb = await this.getMainDbSequelize();
    let orgDb = await this.getOrgDbSequelize();

    let fetchParent: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    let schemaName = rawQueries.fetchSchemaName(fetchParent[0][0].r_number);

    let result = await orgDb.query(
      fetchProjectQueryByPrjId(
        data.account_rid,
        schemaName,
        data.fiscal_year,
        data.project_fiscal_rid
      )
    );
    if (result[0].length > 0) {
      return {
        statusCode: HttpStatus.SUCCESS,
        statusMessage: STATUS_MESSAGE.accountSummaryHighlightsSuccess,
        data: result[0][0],
      };
    } else {
      return {
        statusCode: HttpStatus.SUCCESS,
        statusMessage: STATUS_MESSAGE.accountSummaryHighlightsSuccess,
        data: null,
      };
    }
  }

  async listAccountLevelProjectCostFinancialHighlights(
    accountRid: string,
    filters: Record<string, any> = {},
    search?: string,
    fiscalYear: number = 0,
    page: number = 1,
    limit: number = 10,
    sortBy: string = "created_datetime",
    sortOrder: string = "DESC"
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { summaries: any[]; totalCount: number };
  }> {
    try {
      const mainSequelize = await this.getMainDbSequelize();
      const accountData = await this.schemaService.fetchAccountById(accountRid);
      if (!accountData) throw new Error("Invalid account ID");

      const accountRids = [accountData.rid];
      if (accountData.is_parent === true) {
        const childAccounts =
          await this.schemaService.fetchChildAccountRidByParentAccountId(
            mainSequelize,
            accountData.rid
          );
        if (childAccounts && Array.isArray(childAccounts)) {
          accountRids.push(...childAccounts.map((account) => account.rid));
        }
      }

      // ✅ Initialize all models first
      const ProjectSummaryModel = ProjectSummary.initialize(
        mainSequelize,
        MAIN_SCHEMA_NAME
      );
      const ProjectFiscalSummaryModel = ProjectFiscalSummary.initialize(
        mainSequelize,
        ""
      );

      // ✅ Build where clause with project filter
      const { whereClause } = this.buildRawWhereClause(filters, search);
      whereClause[Op.and] = whereClause[Op.and] || [];

      // Add account filter
      whereClause[Op.and].push({ account_rid: { [Op.in]: accountRids } });

      // Add fiscal year filter
      if (fiscalYear && fiscalYear !== 0) {
        whereClause[Op.and].push({ fiscal_year: fiscalYear });
      }
      // ✅ Get all project fiscal summary without pagination first to properly handle sorting of related data
      const allSummary = await ProjectFiscalSummaryModel.findAll({
        where: whereClause,
        // attributes:["project_code","fiscal_year","project_name","r_number","total_cost_fte_prj","total_cost_subcon_prj","total_cost_nonlabor_prj","total_cost_prj","rd_percent_final","qre_final","rd_credits_total"]
      });

      const currencyRids = allSummary
        .map((summary) => summary.currency_rid)
        .filter((rid) => rid);

      const [currencies] = await Promise.all([
        currencyRids.length
          ? mainSequelize.query(rawQueries.GET_CURRENCIES, {
              replacements: { currencyRid: currencyRids },
              type: "SELECT",
            })
          : [],
      ]);

      const currencyMap = new Map(
        currencies.map((currency: any) => [
          currency.rid,
          currency.currency_symbol,
        ])
      );

      // ✅ Format all tasks
      let formattedSummary = allSummary.map((summary) => ({
        rid: summary.rid,
        r_number: summary.r_number,
        account_rid: summary.account_rid,
        project_rid: summary.project_rid,
        project_name: summary.project_name || null,
        project_code: summary.project_code || null,
        fiscal_year: summary.fiscal_year,
        country_rid: summary.country_rid,
        region_rid: summary.region_rid,
        currency_rid: summary.currency_rid,
        currency_symbol: currencyMap.get(summary.currency_rid) || null,
        total_cost_fte_prj: summary.total_cost_fte_prj,
        total_cost_subcon_prj: summary.total_cost_subcon_prj,
        total_cost_nonlabor_prj: summary.total_cost_nonlabor_prj,
        total_cost_prj: summary.total_cost_prj,
        rd_percent_final: summary.rd_percent_final,
        qre_final: summary.qre_final,
        rd_credits_total: summary.rd_credits_total,
        created_by: summary.created_by,
        modified_by: summary.modified_by,
        created_datetime: summary.created_datetime,
        modified_datetime: summary.modified_datetime,
      }));

      // ✅ Handle special sorting cases
      const validSortFields = [
        "project_code",
        "fiscal_year",
        "project_name",
        "r_number",
        "total_cost_fte_prj",
        "total_cost_subcon_prj",
        "total_cost_nonlabor_prj",
        "total_cost_prj",
        "rd_percent_final",
        "qre_final",
        "rd_credits_total",
        "created_datetime",
      ];

      const finalSortBy = validSortFields.includes(sortBy)
        ? sortBy
        : validSortFields[validSortFields.length - 1];
      const finalSortOrder = ["ASC", "DESC"].includes(sortOrder.toUpperCase())
        ? sortOrder.toUpperCase()
        : "DESC";

      // Apply sorting based on finalSortBy and finalSortOrder
      formattedSummary.sort((a, b) => {
        const aVal = a[finalSortBy as keyof typeof a];
        const bVal = b[finalSortBy as keyof typeof b];

        const isEmpty = (val: any) =>
          val === null ||
          val === undefined ||
          (typeof val === "string" && val.trim() === "");

        const aEmpty = isEmpty(aVal);
        const bEmpty = isEmpty(bVal);

        if (finalSortOrder === "ASC") {
          if (aEmpty && !bEmpty) return 1; // a is empty → goes last
          if (!aEmpty && bEmpty) return -1; // b is empty → goes last
        } else {
          if (aEmpty && !bEmpty) return -1; // a is empty → comes first
          if (!aEmpty && bEmpty) return 1; // b is empty → comes first
        }

        // Handle string comparisons
        if (typeof aVal === "string" && typeof bVal === "string") {
          return finalSortOrder === "ASC"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        // Handle numeric/other comparisons
        if (aVal < bVal) return finalSortOrder === "ASC" ? -1 : 1;
        if (aVal > bVal) return finalSortOrder === "ASC" ? 1 : -1;
        return 0;
      });

      // ✅ Apply pagination after sorting
      const total = formattedSummary.length;
      formattedSummary = formattedSummary.slice(
        (page - 1) * limit,
        page * limit
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          summaries: formattedSummary,
          totalCount: total,
        },
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: "Failed to fetch project costs",
        errorMessage:
          error instanceof Error ? error.message : "An unknown error occurred",
        data: { summaries: [], totalCount: 0 },
      };
    }
  }

  async exportListAccountLevelProjectCostFinancialHighlights(
    accountRid: string,
    filters: Record<string, any> = {},
    search?: string,
    fiscalYear: number = 0,
    sortBy: string = "created_datetime",
    sortOrder: string = "DESC"
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { summaries: any[]; totalCount: number };
  }> {
    try {
      const mainSequelize = await this.getMainDbSequelize();
      const accountData = await this.schemaService.fetchAccountById(accountRid);
      if (!accountData) throw new Error("Invalid account ID");

      const accountRids = [accountData.rid];
      if (accountData.is_parent === true) {
        const childAccounts =
          await this.schemaService.fetchChildAccountRidByParentAccountId(
            mainSequelize,
            accountData.rid
          );
        if (childAccounts && Array.isArray(childAccounts)) {
          accountRids.push(...childAccounts.map((account) => account.rid));
        }
      }

      // ✅ Initialize all models first
      const ProjectSummaryModel = ProjectSummary.initialize(
        mainSequelize,
        MAIN_SCHEMA_NAME
      );
      const ProjectFiscalSummaryModel = ProjectFiscalSummary.initialize(
        mainSequelize,
        ""
      );

      // ✅ Build where clause with project filter
      const { whereClause } = this.buildRawWhereClause(filters, search);
      whereClause[Op.and] = whereClause[Op.and] || [];

      // Add account filter
      whereClause[Op.and].push({ account_rid: { [Op.in]: accountRids } });

      // Add fiscal year filter
      if (fiscalYear && fiscalYear !== 0) {
        whereClause[Op.and].push({ fiscal_year: fiscalYear });
      }
      // ✅ Get all project fiscal summary without pagination first to properly handle sorting of related data
      const allSummary = await ProjectFiscalSummaryModel.findAll({
        where: whereClause,
        // attributes:["project_code","fiscal_year","project_name","r_number","total_cost_fte_prj","total_cost_subcon_prj","total_cost_nonlabor_prj","total_cost_prj","rd_percent_final","qre_final","rd_credits_total"]
      });

      const currencyRids = allSummary
        .map((summary) => summary.currency_rid)
        .filter((rid) => rid);
      console.log("CurrencyRids :", currencyRids);

      const [currencies] = await Promise.all([
        currencyRids.length
          ? mainSequelize.query(rawQueries.GET_CURRENCIES, {
              replacements: { currencyRid: currencyRids },
              type: "SELECT",
            })
          : [],
      ]);

      const currencyMap = new Map(
        currencies.map((currency: any) => [
          currency.rid,
          currency.currency_symbol,
        ])
      );

      // ✅ Format all tasks
      let formattedSummary = allSummary.map((summary) => ({
        rid: summary.rid,
        r_number: summary.r_number,
        account_rid: summary.account_rid,
        project_rid: summary.project_rid,
        project_name: summary.project_name || null,
        project_code: summary.project_code || null,
        fiscal_year: summary.fiscal_year,
        country_rid: summary.country_rid,
        region_rid: summary.region_rid,
        currency_rid: summary.currency_rid,
        currency_symbol: currencyMap.get(summary.currency_rid) || null,
        total_cost_fte_prj: summary.total_cost_fte_prj,
        total_cost_subcon_prj: summary.total_cost_subcon_prj,
        total_cost_nonlabor_prj: summary.total_cost_nonlabor_prj,
        total_cost_prj: summary.total_cost_prj,
        rd_percent_final: summary.rd_percent_final,
        qre_final: summary.qre_final,
        rd_credits_total: summary.rd_credits_total,
        created_by: summary.created_by,
        modified_by: summary.modified_by,
        created_datetime: summary.created_datetime,
        modified_datetime: summary.modified_datetime,
      }));

      // ✅ Handle special sorting cases
      const validSortFields = [
        "project_code",
        "fiscal_year",
        "project_name",
        "r_number",
        "total_cost_fte_prj",
        "total_cost_subcon_prj",
        "total_cost_nonlabor_prj",
        "total_cost_prj",
        "rd_percent_final",
        "qre_final",
        "rd_credits_total",
        "created_datetime",
      ];

      const finalSortBy = validSortFields.includes(sortBy)
        ? sortBy
        : validSortFields[validSortFields.length - 1];
      const finalSortOrder = ["ASC", "DESC"].includes(sortOrder.toUpperCase())
        ? sortOrder.toUpperCase()
        : "DESC";

      // Apply sorting based on finalSortBy and finalSortOrder
      formattedSummary.sort((a, b) => {
        const aVal = a[finalSortBy as keyof typeof a];
        const bVal = b[finalSortBy as keyof typeof b];

        const isEmpty = (val: any) =>
          val === null ||
          val === undefined ||
          (typeof val === "string" && val.trim() === "");

        const aEmpty = isEmpty(aVal);
        const bEmpty = isEmpty(bVal);

        if (finalSortOrder === "ASC") {
          if (aEmpty && !bEmpty) return 1; // a is empty → goes last
          if (!aEmpty && bEmpty) return -1; // b is empty → goes last
        } else {
          if (aEmpty && !bEmpty) return -1; // a is empty → comes first
          if (!aEmpty && bEmpty) return 1; // b is empty → comes first
        }

        // Handle string comparisons
        if (typeof aVal === "string" && typeof bVal === "string") {
          return finalSortOrder === "ASC"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        // Handle numeric/other comparisons
        if (aVal < bVal) return finalSortOrder === "ASC" ? -1 : 1;
        if (aVal > bVal) return finalSortOrder === "ASC" ? 1 : -1;
        return 0;
      });

      const total = formattedSummary.length;

      // Label mapping for export headers
      const labelMap: Record<string, string> = {
        project_code: "Project Code",
        fiscal_year: "Fiscal Year",
        project_name: "Project Name",
        r_number: "Project ID",
        total_cost_fte_prj: "FTE Cost",
        total_cost_subcon_prj: "Sub Con Cost",
        total_cost_nonlabor_prj: "Non Labor Cost",
        total_cost_prj: "Project Cost",
        rd_percent_final: "RD %",
        qre_final: "Project QRE",
        rd_credits_total: "RD Credit",
      };

      const exportData = await Promise.all(
        formattedSummary.map(async (row: any) => {
          const mappedRow: Record<string, any> = {};
          for (const key of Object.keys(labelMap)) {
            if (
              [
                "total_cost_fte_prj",
                "total_cost_subcon_prj",
                "total_cost_nonlabor_prj",
                "total_cost_prj",
              ].includes(key)
            ) {
              mappedRow[labelMap[key]] = await this.formatNumberForExport(
                row[key],
                row.currency_symbol
              );
            } else {
              mappedRow[labelMap[key]] = row[key] || "-";
            }
          }
          return mappedRow;
        })
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          summaries: exportData,
          totalCount: total,
        },
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: "Failed to fetch project costs",
        errorMessage:
          error instanceof Error ? error.message : "An unknown error occurred",
        data: { summaries: [], totalCount: 0 },
      };
    }
  }

  async formatNumberForExport(
    value: any,
    currency_symbol: string
  ): Promise<string> {
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
      const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

      const formattedNumber = decPart
        ? `${formattedInt}.${decPart}`
        : formattedInt;
      // Replace "0.00" in pattern with our real number
      return pattern.replace("0.00", formattedNumber);
    } catch (error) {
      console.error("Error formatting number:", error);
      return "-";
    }
  }

  private buildRawWhereClause(
    filters: Record<string, any>,
    search?: string
  ): { whereClause: any } {
    const whereClause: any = {
      [Op.and]: [],
    };

    // Search logic
    if (search) {
      whereClause[Op.and].push({
        [Op.or]: [
          { project_name: { [Op.iLike]: `%${search}%` } },
          { r_number: { [Op.iLike]: `%${search}%` } },
          { project_code: { [Op.iLike]: `%${search}%` } },
        ],
      });
    }

    // Filter logic for your input structure
    Object.entries(filters).forEach(([field, filter]) => {
      if (!filter || typeof filter !== "object") {
        console.log(
          `Skipping filter for field ${field} due to invalid structure`
        );
        return;
      }

      const operator = Object.keys(filter)[0];
      const value = filter[operator];

      if (!operator || value === undefined) {
        console.log(
          `Skipping filter for field ${field} due to missing operator or value`
        );
        return;
      }

      const condition: any = {};

      switch (field) {
        case "fiscal_year":
        case "total_cost_fte_prj":
        case "total_cost_subcon_prj":
        case "total_cost_nonlabor_prj":
        case "total_cost_prj":
        case "rd_percent_final":
        case "qre_final":
        case "rd_credits_total":
          switch (operator.toLowerCase()) {
            case "equals":
              condition[field] = { [Op.eq]: Number(value) };
              break;
            case "not_equals":
              condition[field] = {
                [Op.or]: [{ [Op.ne]: Number(value) }, { [Op.is]: null }],
              };
              break;
            case "less_than":
              condition[field] = { [Op.lt]: Number(value) };
              break;
            case "greater_than":
              condition[field] = { [Op.gt]: Number(value) };
              break;
            case "between":
              if (Array.isArray(value)) {
                condition[field] = {
                  [Op.between]: [Number(value[0]), Number(value[1])],
                };
              }
              break;
            case "is_empty":
              condition[field] = {
                [Op.or]: [{ [Op.is]: null }, { [Op.eq]: 0 }],
              };
              break;
          }
          break;

        case "project_code":
        case "project_name":
        case "r_number":
          switch (operator.toLowerCase()) {
            case "equals":
              condition[field] = { [Op.iLike]: value };
              break;
            case "not_equals":
              condition[field] = {
                [Op.or]: [{ [Op.notILike]: value }, { [Op.is]: null }],
              };
              break;
            case "contains":
              condition[field] = { [Op.iLike]: `%${value}%` };
              break;
            case "is_empty":
              condition[field] = {
                [Op.or]: [{ [Op.is]: null }, { [Op.eq]: "" }],
              };
              break;
          }
          break;

        default:
          console.log(`Unhandled filter field: ${field}`);
      }

      if (Object.keys(condition).length > 0) {
        whereClause[Op.and].push(condition);
      }
    });

    return { whereClause: whereClause[Op.and].length > 0 ? whereClause : {} };
  }

  async fetchRegions(data : any) {
    const mainDb = await this.getMainDbSequelize()
    const orgDb = await this.getOrgDbSequelize()
    let finalData : any

    let fetchParent : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb))
    let schemaName = rawQueries.fetchSchemaName(fetchParent[0][0].r_number)
    let fetchDataBasedRegions = await orgDb.query(rawQueries.fetchStatesIds(schemaName, data.account_rid, data.fiscal_year))
    let validStateIds : string[] = []
    fetchDataBasedRegions[0].filter((d : any) => d.region_rid != '' || null).map((states : any) => {
      validStateIds.push(states.region_rid)
      return validStateIds
    })
    if(validStateIds.length > 0) {
      let fetchStates = await mainDb.query(rawQueries.fetchStates(validStateIds, data.country_rid))
    finalData = fetchStates[0].map((d : any) => {
      return {
        rid : d.rid,
        state_name : d.state_name
      }
    })
    return finalData
    } else {
      finalData = []
      return finalData
    }
    
  }
}
