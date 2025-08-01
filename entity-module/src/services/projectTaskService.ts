import moment, { Moment } from "moment";
import "moment-timezone";
import { initOrgSequelize } from "../config/orgDataSource";
import { HttpStatus, MAIN_SCHEMA_NAME, rawQueries } from "../utils/constants";
import { Op, Sequelize } from "sequelize";
import { initMainDbSequelize } from "../config/mainDataSource";
import SchemaService from "./schemaService";
import { Logger } from "winston";

import ProjectIngestionService from "./projectIngestionService";
import { ResourceService } from "./resourceServices";
import { ProjectTask } from "../models/projectTask";
import AccountDetails from "../models/accountDetails";
import { Project } from "../models/project";
import { Resources } from "../models/resource";
import { ProjectFiscal } from "../models/projectFiscal";
import currency from "currency.js";
import Decimal from "decimal.js";

export class ProjectTaskService {
  schemaService: SchemaService;
  projectIngestionService: ProjectIngestionService;
  resourceService: ResourceService;
  logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.schemaService = new SchemaService();
    this.projectIngestionService = new ProjectIngestionService(logger);
    this.resourceService = new ResourceService();
  }

  async listProjectTasks(
    accountRid: string,
    projectRid: string,
    filters: Record<string, any> = {},
    search?: string,
    page: number = 1,
    limit: number = 10,
    sortBy: string = "created_datetime",
    sortOrder: string = "DESC"
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { tasks: any[]; totalCount: number };
  }> {
    try {
      const sequelize = await initOrgSequelize();
      const mainSequelize = await initMainDbSequelize();

      const accountData = await this.schemaService.fetchAccountById(accountRid);
      if (!accountData) throw new Error("Invalid account ID");

      let schemaNumber = accountData.r_number;
      if (accountData.storage_type === "store_in_parent") {
        schemaNumber = await this.schemaService.fetchParentAccount(
          accountData.parent_account_rid
        );
      }

      const schemaName = `${MAIN_SCHEMA_NAME}_${schemaNumber.replace(
        /\D/g,
        ""
      )}`;

      // ✅ Initialize all models first
      const AccountDetailsModel = AccountDetails.initialize(
        sequelize,
        schemaName
      );
      const ProjectFiscalModel = ProjectFiscal.initialize(
        sequelize,
        schemaName
      );
      const ResourceModel = Resources.initialize(sequelize, schemaName);
      const ProjectTaskModel = ProjectTask.initialize(sequelize, schemaName);

      // ✅ Define associations after initialization
      ProjectTaskModel.belongsTo(AccountDetailsModel, {
        foreignKey: "account_rid",
        targetKey: "account_rid",
        as: "account",
      });

      ProjectTaskModel.belongsTo(ProjectFiscalModel, {
        foreignKey: "project_fiscal_rid",
        targetKey: "rid",
        as: "project",
      });

      ProjectTaskModel.belongsTo(ResourceModel, {
        foreignKey: "resource_rid",
        targetKey: "rid",
        as: "resource",
      });

      let resourceFilter: Record<string, any> | undefined;
      if (filters.resource_name) {
        resourceFilter = filters.resource_name;
        delete filters.resource_name;
      }

      // ✅ Build where clause with project filter
      const { whereClause } = this.buildRawWhereClause(filters, search);
      whereClause[Op.and] = whereClause[Op.and] || [];
      whereClause[Op.and].push({ project_fiscal_rid: projectRid });

      // ✅ Get all tasks without pagination first to properly handle sorting of related data
      const allTasks = await ProjectTaskModel.findAll({
        where: whereClause,
        include: [
          {
            model: AccountDetailsModel,
            attributes: ["account_name"],
            required: false,
            as: "account",
          },
          {
            model: ProjectFiscalModel,
            attributes: ["project_name", "project_code", "currency_rid"],
            required: false,
            as: "project",
          },
          {
            model: ResourceModel,
            attributes: [
              "resource_code",
              "resource_name",
              "resource_type_rid",
              "resource_role",
              "resource_orgname",
            ],
            required: false,
            as: "resource",
          },
        ],
      });

      // ✅ Fetch and map related data
      const resourceTypeRids = allTasks
        .map((task) => (task as any)?.resource.resource_type_rid)
        .filter((rid) => rid);

      const resourceTypes = resourceTypeRids.length
        ? await mainSequelize.query(
            `SELECT rid, resource_type_name FROM ${MAIN_SCHEMA_NAME}.resource_type WHERE rid IN (:resourceTypeRids)`,
            { replacements: { resourceTypeRids }, type: "SELECT" }
          )
        : [];
      const resourceTypeMap = new Map(
        resourceTypes.map((type: any) => [type.rid, type.resource_type_name])
      );

      const currencyRids = allTasks
        .map((task) => (task as any)?.project?.currency_rid)
        .filter((rid) => rid);

      const [currencies] = await Promise.all([
        currencyRids.length
          ? mainSequelize.query(
              `SELECT rid, currency_symbol FROM ${MAIN_SCHEMA_NAME}.currency WHERE rid IN (:currencyRids)`,
              { replacements: { currencyRids }, type: "SELECT" }
            )
          : [],
      ]);

      const currencyMap = new Map(
        currencies.map((currency: any) => [
          currency.rid,
          currency.currency_symbol,
        ])
      );

      // ✅ Format all tasks
      let formattedTasks = allTasks.map((task) => ({
        rid: task.rid,
        r_number: task.r_number,
        account_rid: task.account_rid,
        account_name: (task as any).account?.account_name || null,
        project_rid: task.project_rid,
        project_fiscal_rid: task.project_fiscal_rid,
        project_name: (task as any).project?.project_name || null,
        project_code: (task as any).project?.project_code || null,
        project_resource_code: task.project_resource_code,
        resource_rid: task.resource_rid,
        resource_code: (task as any).resource?.resource_code || null,
        fiscal_year: task.fiscal_year,
        start_date: task.start_date,
        end_date: task.end_date,
        resource_name: (task as any).resource?.resource_name || null,
        resource_type_rid: (task as any).resource?.resource_type_rid || null,
        resource_type_name:
          resourceTypeMap.get((task as any).resource?.resource_type_rid) ||
          null, // FIXED
        resource_role: (task as any).resource?.resource_role || null,
        currency_rid: (task as any).project?.currency_rid,
        currency_symbol:
          currencyMap.get((task as any).project?.currency_rid) || null,
        resource_orgname: (task as any).resource?.resource_orgname || null,
        total_hours_pro_task: task.total_hours_pro_task,
        total_cost_pro_task: task.total_cost_pro_task,
        comments: task.comments,
        created_by: task.created_by,
        modified_by: task.modified_by,
        created_datetime: task.created_datetime,
        modified_datetime: task.modified_datetime,
      }));

      if (resourceFilter) {
        formattedTasks = formattedTasks.filter((task) => {
          const resourcePass = resourceFilter
            ? this.applyTextFilter(task.resource_name, resourceFilter)
            : true;

          return resourcePass;
        });
      }

      // ✅ Handle special sorting cases
      const validSortFields = [
        "resource_code",
        "r_number",
        "resource_name",
        "resource_type",
        "resource_role",
        "start_date",
        "total_cost_pro_task",
        "total_hours_pro_task",
        "comments",
        "created_datetime",
        "modified_datetime",
      ];
      const finalSortBy = validSortFields.includes(sortBy)
        ? sortBy
        : "created_datetime";
      const finalSortOrder = ["ASC", "DESC"].includes(sortOrder.toUpperCase())
        ? sortOrder.toUpperCase()
        : "DESC";

      // Sort based on the mapped names for special fields
      if (finalSortBy === "resource_type") {
        const priorityMap: Record<string, number> = {
          "Full-Time": 1,
          "Non-Labor": 2,
          "Sub Con": 3,
        };

        formattedTasks.sort((a, b) => {
          return finalSortOrder === "ASC"
            ? priorityMap[a.resource_type_name] -
                priorityMap[b.resource_type_name]
            : priorityMap[b.resource_type_name] -
                priorityMap[a.resource_type_name];
        });
      } else if (finalSortBy === "resource_code") {
        formattedTasks.sort((a, b) => {
          const aName = a.resource_code;
          const bName = b.resource_code;

          if (finalSortOrder === "ASC") {
            if (!aName && bName) return 1;
            if (aName && !bName) return -1;
            return aName?.localeCompare(bName ?? "") ?? 0;
          } else {
            if (!aName && bName) return -1;
            if (aName && !bName) return 1;
            return bName?.localeCompare(aName ?? "") ?? 0;
          }
        });
      } else if (finalSortBy === "resource_name") {
        formattedTasks.sort((a, b) => {
          const aName = a.resource_name;
          const bName = b.resource_name;

          if (finalSortOrder === "ASC") {
            if (!aName && bName) return 1;
            if (aName && !bName) return -1;
            return aName?.localeCompare(bName ?? "") ?? 0;
          } else {
            if (!aName && bName) return -1;
            if (aName && !bName) return 1;
            return bName?.localeCompare(aName ?? "") ?? 0;
          }
        });
      } else {
        formattedTasks.sort((a, b) => {
          const aVal = a[finalSortBy as keyof typeof a];
          const bVal = b[finalSortBy as keyof typeof b];

          if (finalSortOrder === "ASC") {
            if ((aVal === null || aVal === undefined) && bVal != null) return 1;
            if (aVal != null && (bVal === null || bVal === undefined))
              return -1;
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          } else {
            if ((aVal === null || aVal === undefined) && bVal != null)
              return -1;
            if (aVal != null && (bVal === null || bVal === undefined)) return 1;
            return bVal < aVal ? -1 : bVal > aVal ? 1 : 0;
          }
        });
      }

      // ✅ Apply pagination after sorting
      const total = formattedTasks.length;
      formattedTasks = formattedTasks.slice((page - 1) * limit, page * limit);

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          tasks: formattedTasks,
          totalCount: total,
        },
      };
    } catch (error) {
      this.logger.error("Error in listProjectTasks:", error);
      return {
        statusCode: 500,
        message: "Failed to fetch attachments",
        errorMessage:
          error instanceof Error ? error.message : "An unknown error occurred",
        data: { tasks: [], totalCount: 0 },
      };
    }
  }

  async listProjectTasksExport(
    userId: string,
    accountRid: string,
    projectRid: string,
    filters: Record<string, any> = {},
    search?: string,
    sortBy: string = "created_datetime",
    sortOrder: string = "DESC"
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { tasks: any[]; totalCount: number };
  }> {
    try {
      const sequelize = await initOrgSequelize();
      const mainSequelize = await initMainDbSequelize();

      const accountData = await this.schemaService.fetchAccountById(accountRid);
      if (!accountData) throw new Error("Invalid account ID");

      let schemaNumber = accountData.r_number;
      if (accountData.storage_type === "store_in_parent") {
        schemaNumber = await this.schemaService.fetchParentAccount(
          accountData.parent_account_rid
        );
      }

      const schemaName = `${MAIN_SCHEMA_NAME}_${schemaNumber.replace(
        /\D/g,
        ""
      )}`;

      // ✅ Initialize all models first
      const AccountDetailsModel = AccountDetails.initialize(
        sequelize,
        schemaName
      );
      const ProjectFiscalModel = ProjectFiscal.initialize(
        sequelize,
        schemaName
      );
      const ResourceModel = Resources.initialize(sequelize, schemaName);
      const ProjectTaskModel = ProjectTask.initialize(sequelize, schemaName);

      // ✅ Define associations after initialization
      ProjectTaskModel.belongsTo(AccountDetailsModel, {
        foreignKey: "account_rid",
        targetKey: "account_rid",
        as: "account",
      });

      ProjectTaskModel.belongsTo(ProjectFiscalModel, {
        foreignKey: "project_fiscal_rid",
        targetKey: "rid",
        as: "project",
      });

      ProjectTaskModel.belongsTo(ResourceModel, {
        foreignKey: "resource_rid",
        targetKey: "rid",
        as: "resource",
      });

      let resourceFilter: Record<string, any> | undefined;
      if (filters.resource_name) {
        resourceFilter = filters.resource_name;
        delete filters.resource_name;
      }

      // ✅ Build where clause with project filter
      const { whereClause } = this.buildRawWhereClause(filters, search);
      whereClause[Op.and] = whereClause[Op.and] || [];
      whereClause[Op.and].push({ project_fiscal_rid: projectRid });

      // ✅ Get all tasks without pagination first to properly handle sorting of related data
      const allTasks = await ProjectTaskModel.findAll({
        where: whereClause,
        include: [
          {
            model: AccountDetailsModel,
            attributes: ["account_name"],
            required: false,
            as: "account",
          },
          {
            model: ProjectFiscalModel,
            attributes: ["project_name", "project_code", "currency_rid"],
            required: false,
            as: "project",
          },
          {
            model: ResourceModel,
            attributes: [
              "resource_code",
              "resource_name",
              "resource_type_rid",
              "resource_role",
              "resource_orgname",
            ],
            required: false,
            as: "resource",
          },
        ],
      });

      // ✅ Fetch and map related data
      const resourceTypeRids = allTasks
        .map((task) => (task as any)?.resource.resource_type_rid)
        .filter((rid) => rid);
      const resourceTypes = resourceTypeRids.length
        ? await mainSequelize.query(
            `SELECT rid, resource_type_name FROM ${MAIN_SCHEMA_NAME}.resource_type WHERE rid IN (:resourceTypeRids)`,
            { replacements: { resourceTypeRids }, type: "SELECT" }
          )
        : [];
      const resourceTypeMap = new Map(
        resourceTypes.map((type: any) => [type.rid, type.resource_type_name])
      );

      const currencyRids = allTasks
        .map((task) => (task as any)?.project?.currency_rid)
        .filter((rid) => rid);

      const [currencies] = await Promise.all([
        currencyRids.length
          ? mainSequelize.query(
              `SELECT rid, currency_symbol FROM ${MAIN_SCHEMA_NAME}.currency WHERE rid IN (:currencyRids)`,
              { replacements: { currencyRids }, type: "SELECT" }
            )
          : [],
      ]);

      const currencyMap = new Map(
        currencies.map((currency: any) => [
          currency.rid,
          currency.currency_symbol,
        ])
      );

      // ✅ Format all tasks
      let formattedTasks = allTasks.map((task) => ({
        rid: task.rid,
        r_number: task.r_number,
        account_rid: task.account_rid,
        account_name: (task as any).account?.account_name || null,
        project_rid: task.project_rid,
        project_fiscal_rid: task.project_fiscal_rid,
        project_name: (task as any).project?.project_name || null,
        project_code: (task as any).project?.project_code || null,
        project_resource_code: task.project_resource_code,
        resource_rid: task.resource_rid,
        resource_code: (task as any).resource?.resource_code || null,
        fiscal_year: task.fiscal_year,
        start_date: task.start_date,
        end_date: task.end_date,
        resource_name: (task as any).resource?.resource_name || null,
        resource_type_rid: (task as any).resource?.resource_type_rid || null,
        resource_type_name:
          resourceTypeMap.get((task as any).resource?.resource_type_rid) ||
          null, // FIXED
        resource_role: (task as any).resource?.resource_role || null,
        currency_rid: (task as any).project?.currency_rid,
        currency_symbol:
          currencyMap.get((task as any).project?.currency_rid) || null,
        resource_orgname: (task as any).resource?.resource_orgname || null,
        total_hours_pro_task: task.total_hours_pro_task,
        total_cost_pro_task: task.total_cost_pro_task,
        comments: task.comments,
        created_by: task.created_by,
        modified_by: task.modified_by,
        created_datetime: task.created_datetime,
        modified_datetime: task.modified_datetime,
      }));

      if (resourceFilter) {
        formattedTasks = formattedTasks.filter((task) => {
          const resourcePass = resourceFilter
            ? this.applyTextFilter(task.resource_name, resourceFilter)
            : true;

          return resourcePass;
        });
      }

      // ✅ Handle special sorting cases
      const validSortFields = [
        "resource_code",
        "r_number",
        "resource_name",
        "resource_type",
        "resource_role",
        "start_date",
        "total_hours_pro_task",
        "total_cost_pro_task",
        "comments",
        "created_datetime",
        "modified_datetime",
      ];
      const finalSortBy = validSortFields.includes(sortBy)
        ? sortBy
        : "created_datetime";
      const finalSortOrder = ["ASC", "DESC"].includes(sortOrder.toUpperCase())
        ? sortOrder.toUpperCase()
        : "DESC";

      // Sort based on the mapped names for special fields
      if (finalSortBy === "resource_type") {
        const priorityMap: Record<string, number> = {
          "Full-Time": 1,
          "Non-Labor": 2,
          "Sub Con": 3,
        };

        formattedTasks.sort((a, b) => {
          return finalSortOrder === "ASC"
            ? priorityMap[a.resource_type_name] -
                priorityMap[b.resource_type_name]
            : priorityMap[b.resource_type_name] -
                priorityMap[a.resource_type_name];
        });
      } else if (finalSortBy === "resource_code") {
        formattedTasks.sort((a, b) => {
          const aName = a.resource_code;
          const bName = b.resource_code;

          if (finalSortOrder === "ASC") {
            if (!aName && bName) return 1;
            if (aName && !bName) return -1;
            return aName?.localeCompare(bName ?? "") ?? 0;
          } else {
            if (!aName && bName) return -1;
            if (aName && !bName) return 1;
            return bName?.localeCompare(aName ?? "") ?? 0;
          }
        });
      } else if (finalSortBy === "resource_name") {
        formattedTasks.sort((a, b) => {
          const aName = a.resource_name;
          const bName = b.resource_name;

          if (finalSortOrder === "ASC") {
            if (!aName && bName) return 1;
            if (aName && !bName) return -1;
            return aName?.localeCompare(bName ?? "") ?? 0;
          } else {
            if (!aName && bName) return -1;
            if (aName && !bName) return 1;
            return bName?.localeCompare(aName ?? "") ?? 0;
          }
        });
      } else {
        formattedTasks.sort((a, b) => {
          const aVal = a[finalSortBy as keyof typeof a];
          const bVal = b[finalSortBy as keyof typeof b];

          if (finalSortOrder === "ASC") {
            if ((aVal === null || aVal === undefined) && bVal != null) return 1;
            if (aVal != null && (bVal === null || bVal === undefined))
              return -1;
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          } else {
            if ((aVal === null || aVal === undefined) && bVal != null)
              return -1;
            if (aVal != null && (bVal === null || bVal === undefined)) return 1;
            return bVal < aVal ? -1 : bVal > aVal ? 1 : 0;
          }
        });
      }

      // ✅ Apply pagination after sorting
      const total = formattedTasks.length;

      const [projectTaskFields] = await Promise.all([
        this.schemaService.getAllowedExportFields(
          userId,
          "projects_task_view_edit"
        ),
      ]);

      const allowedFieldSet = new Set<string>();
      for (const field of projectTaskFields) {
        if (field.read) {
          allowedFieldSet.add(field.field_name);
        }
      }

      const labelMap: Record<string, string> = {
        resource_code: "Resource Code",
        resource_name: "Resource Name",
        resource_type_name: "Resource Type",
        resource_role: "Role",
        start_date: "Task Date",
        total_cost_pro_task: "Cost",
        total_hours_pro_task: "Effort in Hrs",
        comments: "Comments",
        r_number: "Project Task ID",
      };
      const fieldValueMap: Record<string, string> = {
        resource_type_rid: "resource_type_name",
        resource_rid: "resource_name",
        currency_rid: "currency_symbol",
      };

      const exportDataPromises = formattedTasks.map(async (task: any) => {
        const row: Record<string, string> = {};

        for (const [field, label] of Object.entries(labelMap)) {
          if (allowedFieldSet.has(field)) {
            const actualField = fieldValueMap[field] || field;
            if (field === "total_cost_pro_task") {
              row[label] = await this.formatNumberForExport(
                task[actualField],
                task.currency_symbol
              );
            } else {
              row[label] = task[actualField] ?? "-";
            }
          }
        }
        return row;
      });

      const exportData = await Promise.all(exportDataPromises);

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          tasks: exportData,
          totalCount: total,
        },
      };
    } catch (error) {
      this.logger.error("Error in listProjectTasks:", error);
      return {
        statusCode: 500,
        message: "Failed to fetch project tasks",
        errorMessage:
          error instanceof Error ? error.message : "An unknown error occurred",
        data: { tasks: [], totalCount: 0 },
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

  async getProjectTaskById(
    accountRid: string,
    taskRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: any;
  }> {
    try {
      const sequelize = await initOrgSequelize();
      const mainSequelize = await initMainDbSequelize();

      const accountData = await this.schemaService.fetchAccountById(accountRid);
      if (!accountData) throw new Error("Invalid account ID");

      let schemaNumber = accountData.r_number;
      if (accountData.storage_type === "store_in_parent") {
        schemaNumber = await this.schemaService.fetchParentAccount(
          accountData.parent_account_rid
        );
      }

      const schemaName = `${MAIN_SCHEMA_NAME}_${schemaNumber.replace(
        /\D/g,
        ""
      )}`;

      // Initialize models
      const AccountDetailsModel = AccountDetails.initialize(
        sequelize,
        schemaName
      );
      const ProjectFiscalModel = ProjectFiscal.initialize(
        sequelize,
        schemaName
      );
      const ResourceModel = Resources.initialize(sequelize, schemaName);
      const ProjectTaskModel = ProjectTask.initialize(sequelize, schemaName);

      // Define associations
      ProjectTaskModel.belongsTo(AccountDetailsModel, {
        foreignKey: "account_rid",
        targetKey: "account_rid",
        as: "account",
      });

      ProjectTaskModel.belongsTo(ProjectFiscalModel, {
        foreignKey: "project_fiscal_rid",
        targetKey: "rid",
        as: "project",
      });

      ProjectTaskModel.belongsTo(ResourceModel, {
        foreignKey: "resource_rid",
        targetKey: "rid",
        as: "resource",
      });

      const task = await ProjectTaskModel.findOne({
        where: { rid: taskRid },
        include: [
          {
            model: AccountDetailsModel,
            attributes: ["account_name"],
            required: false,
            as: "account",
          },
          {
            model: ProjectFiscalModel,
            attributes: ["project_name", "project_code", "currency_rid"],
            required: false,
            as: "project",
          },
          {
            model: ResourceModel,
            attributes: [
              "resource_code",
              "resource_type_rid",
              "resource_name",
              "resource_role",
              "resource_orgname",
            ],
            required: false,
            as: "resource",
          },
        ],
      });

      if (!task) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: "Task not found",
          errorMessage: "The requested task could not be found",
        };
      }

      const [resourceTypeData, currencyData] = await Promise.all([
        (task as any).dataValues.resource?.resource_type_rid
          ? mainSequelize.query(rawQueries.GET_RESOURCE_TYPES, {
              replacements: {
                resourceTypeRid: (task as any).dataValues.resource?.resource_type_rid,
              },
              type: "SELECT",
            })
          : Promise.resolve([]),
        (task as any).dataValues.project?.currency_rid
          ? mainSequelize.query(rawQueries.GET_CURRENCIES, {
              replacements: { currencyRid: (task as any).dataValues.project?.currency_rid },
              type: "SELECT",
            })
          : Promise.resolve([]),
      ]);

      const [resourceType] = resourceTypeData;
      const [currency] = currencyData;

      const attachments = await this.fetchAttachmentsBytaskId(taskRid);
      let mappedAttachments = [];

      if (attachments.length > 0) {
        const documentTypeIds = [
          ...new Set(
            attachments.map((attachment) => attachment.document_type_rid)
          ),
        ];
        const documentCategoryIds = [
          ...new Set(
            attachments.map((attachment) => attachment.document_category_rid)
          ),
        ];
        const userIds = [
          ...new Set(attachments.map((attachment) => attachment.created_by)),
        ];

        const [documentTypes, documentCategories, users] = await Promise.all([
          documentTypeIds.length > 0
            ? mainSequelize.query(rawQueries.GET_DOCUMENT_TYPES, {
                replacements: { documentTypeIds },
                type: "SELECT",
              })
            : Promise.resolve([]),

          documentCategoryIds.length > 0
            ? mainSequelize.query(rawQueries.GET_DOCUMENT_CATEGORIES, {
                replacements: { documentCategoryIds },
                type: "SELECT",
              })
            : Promise.resolve([]),

          userIds.length > 0
            ? mainSequelize.query(rawQueries.GET_USERS, {
                replacements: { userIds },
                type: "SELECT",
              })
            : Promise.resolve([]),
        ]);

        mappedAttachments = attachments.map((attachment) => ({
          ...attachment,
          document_type:
            (
              documentTypes.find(
                (dt: any) => dt.rid === attachment.document_type_rid
              ) as { type_name: string }
            )?.type_name || "",
          document_category:
            (
              documentCategories.find(
                (dc: any) => dc.rid === attachment.document_category_rid
              ) as { category_name: string }
            )?.category_name || "",
          uploaded_by:
            (
              users.find((u: any) => u.rid === attachment.created_by) as {
                full_name: string;
              }
            )?.full_name || "",
          attached_to: task.r_number,
        }));
      }

      const taskWithUserDetails = await this.insertUserDetails(task);

      const formattedTask = {
        rid: taskWithUserDetails.dataValues.rid,
        r_number: taskWithUserDetails.dataValues.r_number,
        account_rid: taskWithUserDetails.dataValues.account_rid,
        account_name:
          taskWithUserDetails.dataValues.account?.account_name || null,
        project_rid: taskWithUserDetails.dataValues.project_rid,
        project_fiscal_rid: taskWithUserDetails.dataValues.project_fiscal_rid,
        project_name:
          taskWithUserDetails.dataValues.project?.project_name || null,
        project_code:
          taskWithUserDetails.dataValues.project?.project_code || null,
        project_resource_rid:
          taskWithUserDetails.dataValues.project_resource_rid,
        resource_rid: taskWithUserDetails.dataValues.resource_rid,
        resource_code:
          taskWithUserDetails.dataValues.resource?.resource_code || null,
        fiscal_year: taskWithUserDetails.dataValues.fiscal_year,
        start_date: taskWithUserDetails.dataValues.start_date,
        end_date: taskWithUserDetails.dataValues.end_date,
        resource_name: taskWithUserDetails.dataValues.resource?.resource_name,
        resource_type_rid:
          taskWithUserDetails.dataValues.resource?.resource_type_rid,
        resource_type_name: (resourceType as any)?.resource_type_name || null,
        resource_role: taskWithUserDetails.dataValues.resource?.resource_role,
        currency_rid: taskWithUserDetails.dataValues.project?.currency_rid,
        currency_symbol: (currency as any)?.currency_symbol || null,
        currency_name: (currency as any)?.currency_name || null,
        resource_orgname:
          taskWithUserDetails.dataValues.resource?.resource_orgname,
        total_hours_pro_task:
          taskWithUserDetails.dataValues.total_hours_pro_task,
        total_cost_pro_task: taskWithUserDetails.dataValues.total_cost_pro_task,
        comments: taskWithUserDetails.dataValues.comments,
        attachment: mappedAttachments,
        created_datetime: taskWithUserDetails.dataValues.created_datetime,
        modified_datetime: taskWithUserDetails.dataValues.modified_datetime,
        created_by: taskWithUserDetails.created_name,
        modified_by: taskWithUserDetails.modified_name,
      };

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: formattedTask,
      };
    } catch (error) {
      this.logger.error("Error in getProjectTaskById:", error);
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage:
          error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  }

  buildRawWhereClause(
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
          { resource_name: { [Op.iLike]: `%${search}%` } },
          { r_number: { [Op.iLike]: `%${search}%` } },
          { comments: { [Op.iLike]: `%${search}%` } },
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
        case "total_cost_pro_task":
        case "total_hours_pro_task":
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

        case "resource_code":
          switch (operator.toLowerCase()) {
            case "equals":
              condition["$resource.resource_code$"] = { [Op.iLike]: value };
              break;
            case "not_equals":
              condition["$resource.resource_code$"] = {
                [Op.or]: [{ [Op.notILike]: value }, { [Op.is]: null }],
              };
              break;
            case "contains":
              condition["$resource.resource_code$"] = {
                [Op.iLike]: `%${value}%`,
              };
              break;
            case "is_empty":
              condition["$resource.resource_code$"] = {
                [Op.or]: [{ [Op.is]: null }, { [Op.eq]: "" }],
              };
              break;
          }
          break;
        case "resource_role":
          switch (operator.toLowerCase()) {
            case "equals":
              condition["$resource.resource_role$"] = { [Op.iLike]: value };
              break;
            case "not_equals":
              condition["$resource.resource_role$"] = {
                [Op.or]: [{ [Op.notILike]: value }, { [Op.is]: null }],
              };
              break;
            case "contains":
              condition["$resource.resource_role$"] = {
                [Op.iLike]: `%${value}%`,
              };
              break;
            case "is_empty":
              condition["$resource.resource_role$"] = {
                [Op.or]: [{ [Op.is]: null }, { [Op.eq]: "" }],
              };
              break;
          }
          break;
        case "comments":
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

        case "start_date":
          switch (operator.toLowerCase()) {
            case "equals": {
              const date = new Date(value);
              condition[field] = Sequelize.literal(
                `DATE("${field}") = DATE('${date.toISOString()}')`
              );
              break;
            }
            case "before": {
              const date = new Date(value);
              condition[field] = Sequelize.literal(
                `DATE("${field}") < DATE('${date.toISOString()}')`
              );
              break;
            }
            case "after": {
              const date = new Date(value);
              condition[field] = Sequelize.literal(
                `DATE("${field}") > DATE('${date.toISOString()}')`
              );
              break;
            }
            case "between": {
              if (Array.isArray(value)) {
                const startDate = new Date(value[0]);
                const endDate = new Date(value[1]);
                condition[field] = Sequelize.literal(
                  `DATE("${field}") BETWEEN DATE('${startDate.toISOString()}') AND DATE('${endDate.toISOString()}')`
                );
              }
              break;
            }
            case "is_empty":
              condition[field] = { [Op.is]: null };
              break;
          }
          break;

        case "resource_type_rid":
          switch (operator.toLowerCase()) {
            case "equals":
              condition["$resource.resource_type_rid$"] = { [Op.eq]: value };
              break;
            case "not_equals":
              condition["$resource.resource_type_rid$"] = {
                [Op.or]: [{ [Op.ne]: value }, { [Op.is]: null }],
              };
              break;
            case "in":
              condition["$resource.resource_type_rid$"] = {
                [Op.in]: Array.isArray(value) ? value : [value],
              };
              break;
            case "is_empty":
              condition["$resource.resource_type_rid$"] = {
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

  async fetchAttachmentsBytaskId(task_rid: string): Promise<any[]> {
    try {
      const sequelize = await initMainDbSequelize();

      const result = await sequelize.query(
        `
      SELECT 
        a.*
      FROM "${MAIN_SCHEMA_NAME}"."attachment_summary" a
      WHERE a.attach_to = :task_rid
      ORDER BY a.created_datetime DESC
    `,
        {
          replacements: { task_rid },
          type: "SELECT",
        }
      );

      return result;
    } catch (error) {
      console.error("Error fetching attachments:", error);
      throw new Error("Failed to fetch attachments");
    }
  }

  async insertUserDetails(taskData: any): Promise<any> {
    try {
      const mainDbInit = await initMainDbSequelize();

      const createdById = taskData.created_by;
      const modifiedById = taskData.modified_by;

      const getUserFullName = async (userId: string) => {
        if (!userId) return null;

        const [results] = await mainDbInit.query(
          `SELECT first_name, middle_name, last_name FROM ${MAIN_SCHEMA_NAME}."user" WHERE rid = :userId`,
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
        ...taskData,
        created_name: createdName || null,
        modified_name: modifiedName || null,
      };
    } catch (err) {
      throw new Error("Error adding user details" + (err as Error).message);
    }
  }

  applyTextFilter(fieldValue: string, filter: any): boolean {
    const value = (fieldValue ?? "").trim().toLowerCase();

    if (filter.equals !== undefined) {
      return value === filter.equals.trim().toLowerCase();
    }
    if (filter.not_equals !== undefined) {
      return (
        value !== filter.not_equals.trim().toLowerCase() ||
        value === null ||
        value === ""
      );
    }
    if (filter.contains !== undefined) {
      return value.includes(filter.contains.trim().toLowerCase());
    }
    if (filter.is_empty !== undefined) {
      return filter.is_empty ? value === "" : value !== "";
    }

    return true; // No filtering if no valid operator is provided
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
}
