import { Op, Order, QueryTypes, Sequelize } from "sequelize";
import { initOrgSequelize } from "../config/orgDataSource";
import { initMainDbSequelize } from "../config/mainDataSource";
import {
  HttpStatus,
  MAIN_SCHEMA_NAME,
  rawQueries,
  STATUS_MESSAGE,
} from "../utils/constants";
import {
  fetchImportListByRid,
  listAllImportedDatasQuery,
  listAllStageFailures,
  listAllLoadFailures,
} from "../utils/rawQueries";
import { setInlineForImports } from "../utils/helpers";
import { generateSasUrl } from "../utils/blob";
import { ProjectService } from "./projectService";
import { ResourceService } from "./resourceServices";
import { ProjectTaskService } from "./projectTaskService";
import { ProjectResourceService } from "./projectResource/projectResourceService";
import { ProjectResourceSchemaService } from "./projectResource/schemaService";
import SchemaService from "./schemaService";
import ProjectIngestionService from "./projectIngestionService";
import { Logger } from "winston";
import { raw } from "express";
import moment from "moment";

export default class ImportGraphqlServices {
  private orgSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;
  private projectService: ProjectService;
  private resourceService: ResourceService;
  private projectTaskService: ProjectTaskService;
  private projectResourceService: ProjectResourceService;
  private projectResourceSchema: ProjectResourceSchemaService;
  private schemaService: SchemaService;
  private projectIngestion: ProjectIngestionService;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.projectService = new ProjectService(logger);
    this.resourceService = new ResourceService();
    this.projectTaskService = new ProjectTaskService(logger);
    this.schemaService = new SchemaService();
    this.projectIngestion = new ProjectIngestionService(logger);
    this.projectResourceService = new ProjectResourceService(logger);
    this.projectResourceSchema = new ProjectResourceSchemaService();
  }

  private async getOrgSequelize(): Promise<Sequelize> {
    if (!this.orgSequelize) {
      this.orgSequelize = await initOrgSequelize();
    }
    return this.orgSequelize;
  }

  private async getMainDbSequelize(): Promise<Sequelize> {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    return this.mainDbSequelize;
  }
  async listAllImportedData(
    page: number,
    limit: number,
    sort: string,
    sortBy: string,
    account_rid: string,
    filters: Record<string, any>,
    fiscal_year: number
  ) {
    const orgSequelize = await this.getOrgSequelize();
    const mainSequelize = await this.getMainDbSequelize();
    let disablePagination: boolean = false;

    const fetchParentRnumber: any = await mainSequelize.query(
      await rawQueries.fetchParentAccount(account_rid, mainSequelize)
    );
    let schemaName = rawQueries.fetchSchemaName(
      fetchParentRnumber[0][0].r_number
    );

    if (filters.imported_by) {
      disablePagination = true;
      delete filters.imported_by;
    }
    const result = await orgSequelize.query(
      listAllImportedDatasQuery(
        page,
        limit,
        sort,
        sortBy,
        account_rid,
        filters,
        schemaName,
        disablePagination,
        fiscal_year
      )
    );
    if (result[0].length > 0) {
      return {
        statusCode: HttpStatus.SUCCESS,
        data: result[0],
      };
    } else {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        data: [],
      };
    }
  }

  async listAllStageFailures(
    account_rid: string,
    import_rid: string,
    entity_type: string
  ) {
    const orgSequelize = await this.getOrgSequelize();
    const mainSequelize = await this.getMainDbSequelize();

    const fetchParentRnumber: any = await mainSequelize.query(
      await rawQueries.fetchParentAccount(account_rid, mainSequelize)
    );
    let schemaName = rawQueries.fetchSchemaName(
      fetchParentRnumber[0][0].r_number
    );

    const result = await orgSequelize.query(
      listAllStageFailures(schemaName, import_rid, entity_type)
    );
    if (result[0].length > 0) {
      return {
        statusCode: HttpStatus.SUCCESS,
        data: result[0],
      };
    } else {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        data: [],
      };
    }
  }

  async listAllLoadFailures(
    account_rid: string,
    import_rid: string,
    entity_type: string
  ) {
    const orgSequelize = await this.getOrgSequelize();
    const mainSequelize = await this.getMainDbSequelize();

    const fetchParentRnumber: any = await mainSequelize.query(
      await rawQueries.fetchParentAccount(account_rid, mainSequelize)
    );
    let schemaName = rawQueries.fetchSchemaName(
      fetchParentRnumber[0][0].r_number
    );

    const result = await orgSequelize.query(
      listAllLoadFailures(schemaName, import_rid, entity_type)
    );
    if (result[0].length > 0) {
      return {
        statusCode: HttpStatus.SUCCESS,
        data: result[0],
      };
    } else {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        data: [],
      };
    }
  }
  async fetchUserDetails(userRids: string[]) {
    const mainSequelize = await this.getMainDbSequelize();
    if (!userRids.length) return [];

    const placeholders = userRids.map(() => "?").join(",");
    const query = `SELECT rid, first_name, last_name FROM ${MAIN_SCHEMA_NAME}.user WHERE rid IN (${placeholders})`;

    const [results] = await mainSequelize.query(query, {
      replacements: userRids,
    });

    return results;
  }

  async fetchImportById(account_rid: string, rid: string) {
    let mainSequelize = await this.getMainDbSequelize();
    let orgSequelize = await this.getOrgSequelize();

    let fetchParentAccount: any = await mainSequelize.query(
      await rawQueries.fetchParentAccount(account_rid, mainSequelize)
    );
    let schemaName = rawQueries.fetchSchemaName(
      fetchParentAccount[0][0].r_number
    );

    const result: any = await orgSequelize.query(
      fetchImportListByRid(rid, schemaName)
    );
    if (result[0][0]) {
      const fetchUserDetails: any = await mainSequelize.query(
        rawQueries.fetchUserDetailsById(result[0][0].imports.imported_by)
      );
      delete result[0][0].imports.imported_by;
      result[0][0].imports.document_url = await generateSasUrl(
        result[0][0].imports.document_url
      );
      result[0][0].imports.imported_on = new Date(
        result[0][0].imports.imported_on
      ).toISOString();
      result[0][0].imports.imported_by = fetchUserDetails[0][0].imported_by;

      return {
        statusCode: HttpStatus.SUCCESS,
        data: result[0][0],
      };
    } else {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        data: null,
      };
    }
  }

  async inlineEditImportList(data: any) {
    const mainDb = await this.getMainDbSequelize();
    const orgDb = await this.getOrgSequelize();
    console.log(data);
    const fetchAccountDetails: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    let schemaName = rawQueries.fetchSchemaName(
      fetchAccountDetails[0][0].r_number
    );

    const checkImportDataExists = await this.fetchImportById(
      data.account_rid,
      data.rid
    );
    let importDbData = checkImportDataExists.data;
    const setInlineDetails = setInlineForImports(importDbData, data);
    if (setInlineDetails == null) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        statusMessage: STATUS_MESSAGE.noDataToUpdate,
        data: null,
      };
    }
    const updateImportDetails = await orgDb.query(
      rawQueries.updateImport(schemaName, setInlineDetails, data.rid)
    );
    if (updateImportDetails.length > 0) {
      const latestUpdatedData = await this.fetchImportById(
        data.account_rid,
        data.rid
      );
      return {
        statusCode: HttpStatus.SUCCESS,
        statusMessage: STATUS_MESSAGE.importUpdatedSuccess,
        data: latestUpdatedData.data,
      };
    }
  }

  async fetchAccountLevelImportedProjects(
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
    documentRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projects: any; totalCount: number };
  }> {
    try {
      const mainDb = await this.getMainDbSequelize();
      const orgDb = await this.getOrgSequelize();

      const fetchAccountDetails: any = await mainDb.query(
        await rawQueries.fetchParentAccount(accountId, mainDb)
      );

      const fetchGivenAccountDetails: any = await mainDb.query(
        await rawQueries.fetchAccountDetailsByRid(accountId)
      );

      if (
        fetchGivenAccountDetails[0][0].parent_account_rid === null ||
        fetchGivenAccountDetails[0][0].parent_account_rid === ""
      ) {
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
        accessibleIds = await this.projectService.getAccessibleProjectIds(
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
        accessibleIds = await this.projectService.getAccessibleProjectIds(
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

      const isExists = await this.schemaService.checkIfSchemaAndTableExists(
        fetchAccountDetails[0][0].r_number
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

      const [finalSortBy, finalSortOrder] =
        this.projectService.getSortParameters(sortBy, sortOrder);
      const [finalMetaDataSortBy, finalMetaDataSortOrder] =
        this.projectService.getMetaDataSortParameters(sortBy, sortOrder);

      const { whereClause } = this.projectService.buildWhereClause(
        filters,
        search,
        false,
        bothParentAndChild
      );

      const offset = (page - 1) * limit;

      const order = [[finalSortBy, finalSortOrder]];

      const { projects, count } = await this.projectIngestion.fetchProjectList(
        fetchAccountDetails[0][0].r_number,
        fetchGivenAccountDetails[0][0],
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
        documentRid
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projects: projects,
          totalCount: count,
        },
      };
    } catch (err) {
      throw new Error(
        "Error fetching imported projects: " + (err as Error).message
      );
    }
  }

async exportAccountLevelImportedProjects(
    accountId: string,
    fiscalYear: number = 0,
    search: string,
    filters: Record<string, any> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "ASC",
    bothParentAndChild: boolean = false,
    userId: string,
    timezone: string,
    documentRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projects: any; totalCount: number };
  }> {
    try {
      const mainDb = await this.getMainDbSequelize();
      const orgDb = await this.getOrgSequelize();

      const fetchAccountDetails: any = await mainDb.query(
        await rawQueries.fetchParentAccount(accountId, mainDb)
      );

      const fetchGivenAccountDetails: any = await mainDb.query(
        await rawQueries.fetchAccountDetailsByRid(accountId)
      );

      if (
        fetchGivenAccountDetails[0][0].parent_account_rid === null ||
        fetchGivenAccountDetails[0][0].parent_account_rid === ""
      ) {
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
        accessibleIds = await this.projectService.getAccessibleProjectIds(
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
        accessibleIds = await this.projectService.getAccessibleProjectIds(
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

      const isExists = await this.schemaService.checkIfSchemaAndTableExists(
        fetchAccountDetails[0][0].r_number
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

      const [finalSortBy, finalSortOrder] =
        this.projectService.getSortParameters(sortBy, sortOrder);
      const [finalMetaDataSortBy, finalMetaDataSortOrder] =
        this.projectService.getMetaDataSortParameters(sortBy, sortOrder);

      const { whereClause } = this.projectService.buildWhereClause(
        filters,
        search,
        false,
        bothParentAndChild
      );

      const order = [[finalSortBy, finalSortOrder]];

      const { exportData, count } = await this.projectIngestion.fetchProjectListExport(
        fetchAccountDetails[0][0].r_number,
        fetchGivenAccountDetails[0][0],
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
        documentRid
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
      throw new Error(
        "Error exporting imported projects: " + (err as Error).message
      );
    }
  }


  async fetchAccountLevelImportedResources(
    accountId: string,
    page: number = 1,
    limit: number = 10,
    search: string,
    filters: Record<string, string> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "ASC",
    documentRid: string,
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resources: any; count: number };
  }> {
    try {
      const mainDb = await this.getMainDbSequelize();
      const orgDb = await this.getOrgSequelize();

      const fetchAccountDetails: any = await mainDb.query(
        await rawQueries.fetchParentAccount(accountId, mainDb)
      );

      const isExists = await this.schemaService.checkIfSchemaExists(
        fetchAccountDetails[0][0].r_number
      );

      if (!isExists) {
        throw new Error(
          "Invalid account number: The account number does not exist."
        );
      }

      const offset = (page - 1) * limit;

      const [finalSortBy, finalSortOrder] =
        this.resourceService.getSortParameters(sortBy, sortOrder);

      const { whereClause, havingClause } =
        this.resourceService.buildWhereClause(filters, search);
      const { geoDataSort } = this.resourceService.processGeoDataSort(
        sortBy,
        sortOrder
      );

      const resources = await this.schemaService.fetchResources(
        fetchAccountDetails[0][0].r_number,
        offset,
        limit,
        [[finalSortBy, finalSortOrder]],
        whereClause,
        havingClause,
        geoDataSort,
        accountId,
        documentRid
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resources: resources.resources,
          count: resources.totalCount,
        },
      };
    } catch (err) {
      throw new Error(
        "Error fetching imported resources: " + (err as Error).message
      );
    }
  }

  async exportAccountLevelImportedResources(
    accountId: string,
    search: string,
    filters: Record<string, string> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "ASC",
    documentRid: string,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resources: any; count: number};
  }> {
    try {
      const mainDb = await this.getMainDbSequelize();
      const orgDb = await this.getOrgSequelize();

      const fetchAccountDetails: any = await mainDb.query(
        await rawQueries.fetchParentAccount(accountId, mainDb)
      );

      const isExists = await this.schemaService.checkIfSchemaExists(
        fetchAccountDetails[0][0].r_number
      );

      if (!isExists) {
        throw new Error(
          "Invalid account number: The account number does not exist."
        );
      }


      const [finalSortBy, finalSortOrder] =
        this.resourceService.getSortParameters(sortBy, sortOrder);

      const { whereClause, havingClause } =
        this.resourceService.buildWhereClause(filters, search);
      const { geoDataSort } = this.resourceService.processGeoDataSort(
        sortBy,
        sortOrder
      );

      const resources = await this.schemaService.fetchResourcesForExport(
        fetchAccountDetails[0][0].r_number,
        [[finalSortBy, finalSortOrder]],
        whereClause,
        havingClause,
        geoDataSort,
        accountId,
        documentRid
      );

      const rawResult = resources.resources || [];
      const [
        accountFields,
        resourceFields,
      ] = await Promise.all([
        this.schemaService.getAllowedExportFields(userId, "accounts_view_edit"),
        this.schemaService.getAllowedExportFields(userId, "account_resources_view_edit")
      ]);
     // const allowedFieldsForExport = await this.schemaService.getAllowedExportFields(userId,"account_resources_view_edit");
        const allowedFieldSet = new Set<string>();
        for (const field of resourceFields) {
          if (field.read) {
            allowedFieldSet.add(field.field_name);
          }
        }
        const requiredAccountFields = new Set(["account_name"]); // Add more if needed
      for (const field of accountFields) {
        if (field.read && requiredAccountFields.has(field.field_name)) {
          allowedFieldSet.add(field.field_name);
        }
      }

      const labelMap: Record<string, string> = {
        "account_name": "Account Name",
        "resource_code": "Resource Code",
        "resource_name": "Name",
        "resource_type_rid": "Resource Type",
        "resource_orgname": "Org Name",
        "resource_designation": "Designation",
        "resource_role": "Role",
        "country_rid": "Country",
        "region_rid": "Region",
        "total_project_hours": "Total Project Hours",
        "estimated_rd_hours": "Estimated R&D Hours",
        "status_rid": "Status",
        "comments": "Comments",
        "r_number": "Resource ID",
      };
      const fieldValueMap: Record<string, string> = {
        "resource_type_rid": "resource_type_name",
        "region_rid":"region_name",
        "country_rid":"country_name",
         "status_rid":"status_name",

      };

      const exportData = rawResult.map((resource: any) => {
      const row: Record<string, string> = {};

      for (const [field, label] of Object.entries(labelMap)) {
       if (allowedFieldSet.has(field)) {
      const actualField = fieldValueMap[field] || field; // fallback to same field if not mapped
      row[label] = resource[actualField] ?? "-";
      }
      }

      return row;
    });

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resources: exportData,
          count: resources.totalCount,
        },
      };
    } catch (err) {
      throw new Error(
        "Error fetching imported resources: " + (err as Error).message
      );
    }
  }

  async fetchAccountLevelImportedProjectTasks(
    accountRid: string,
    documentRid: string,
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

      const schemaName = await this.projectTaskService.getSchemaInfo(
        accountRid
      );

      // ✅ Initialize all models first
      const { models } =
        await this.projectTaskService.initializeModelsAndAssociations(
          schemaName
        );

      let resourceFilter: Record<string, any> | undefined;
      if (filters.resource_name) {
        resourceFilter = filters.resource_name;
        delete filters.resource_name;
      }

      // ✅ Build where clause with project filter
      const { whereClause } = this.projectTaskService.buildRawWhereClause(
        filters,
        search
      );

      // ✅ Define includes with ProjectTaskTimeline join
      const includes = [
        {
          model: models.AccountDetailsModel,
          attributes: ["account_name"],
          required: false,
          as: "account",
        },
        {
          model: models.ProjectFiscalModel,
          attributes: ["project_name", "project_code", "currency_rid"],
          required: false,
          as: "project",
        },
        {
          model: models.ResourceModel,
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
        // ✅ New: Join with ProjectTaskTimeline
        {
          model: models.ProjectTaskTimelineModel, // Ensure this model is initialized
          as: "ProjectTimeline",
          required: true, // INNER JOIN (only tasks with matching timeline entries)
          where: {
            document_rid: documentRid, // Filter by the provided documentRid
          },
          attributes: [], // No need to select timeline fields
        },
      ];

      // ✅ Get all tasks without pagination first to properly handle sorting of related data
      const allTasks = await models.ProjectTaskModel.findAll({
        where: whereClause,
        include: includes,
      });

      // ✅ Fetch and map related data
      const { resourceTypeMap, currencyMap } =
        await this.projectTaskService.fetchRelatedData(allTasks, mainSequelize);

      // ✅ Format all tasks
      let formattedTasks = allTasks.map((task) =>
        this.projectTaskService.formatTaskData(
          task,
          resourceTypeMap,
          currencyMap
        )
      );

      if (resourceFilter) {
        formattedTasks = formattedTasks.filter((task) => {
          const resourcePass = resourceFilter
            ? this.projectTaskService.applyTextFilter(
                task.resource_name,
                resourceFilter
              )
            : true;

          return resourcePass;
        });
      }

      // ✅ Handle special sorting cases
      formattedTasks = this.projectTaskService.sortTasks(
        formattedTasks,
        sortBy,
        sortOrder
      );

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
    } catch (err) {
      throw new Error(
        "Error fetching imported project_tasks: " + (err as Error).message
      );
    }
  }

  async exportAccountLevelImportedProjectTasks(
    accountRid: string,
    documentRid: string,
    userId: string,
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

      const schemaName = await this.projectTaskService.getSchemaInfo(
        accountRid
      );

      // ✅ Initialize all models first
      const { models } =
        await this.projectTaskService.initializeModelsAndAssociations(
          schemaName
        );

      let resourceFilter: Record<string, any> | undefined;
      if (filters.resource_name) {
        resourceFilter = filters.resource_name;
        delete filters.resource_name;
      }

      // ✅ Build where clause with project filter
      const { whereClause } = this.projectTaskService.buildRawWhereClause(
        filters,
        search
      );

      // ✅ Define includes with ProjectTaskTimeline join
      const includes = [
        {
          model: models.AccountDetailsModel,
          attributes: ["account_name"],
          required: false,
          as: "account",
        },
        {
          model: models.ProjectFiscalModel,
          attributes: ["project_name", "project_code", "currency_rid"],
          required: false,
          as: "project",
        },
        {
          model: models.ResourceModel,
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
        // ✅ New: Join with ProjectTaskTimeline
        {
          model: models.ProjectTaskTimelineModel, // Ensure this model is initialized
          as: "ProjectTimeline",
          required: true, // INNER JOIN (only tasks with matching timeline entries)
          where: {
            document_rid: documentRid, // Filter by the provided documentRid
          },
          attributes: [], // No need to select timeline fields
        },
      ];

      // ✅ Get all tasks without pagination first to properly handle sorting of related data
      const allTasks = await models.ProjectTaskModel.findAll({
        where: whereClause,
        include: includes,
      });

      // ✅ Fetch and map related data
      const { resourceTypeMap, currencyMap } =
        await this.projectTaskService.fetchRelatedData(allTasks, mainSequelize);

      // ✅ Format all tasks
      let formattedTasks = allTasks.map((task) =>
        this.projectTaskService.formatTaskData(
          task,
          resourceTypeMap,
          currencyMap
        )
      );

      if (resourceFilter) {
        formattedTasks = formattedTasks.filter((task) => {
          const resourcePass = resourceFilter
            ? this.projectTaskService.applyTextFilter(
                task.resource_name,
                resourceFilter
              )
            : true;

          return resourcePass;
        });
      }

      // ✅ Handle special sorting cases
      formattedTasks = this.projectTaskService.sortTasks(
        formattedTasks,
        sortBy,
        sortOrder
      );

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

      const exportData = await Promise.all(
      formattedTasks.map(async (task: any) => {
        const exportRecord: Record<string, any> = {};
        
        // Only add fields that are in the allowedFieldSet
        if (allowedFieldSet.has('resource_code')) {
          exportRecord['Resource Code'] = task.resource_code || "-";
        }
        if (allowedFieldSet.has('resource_name')) {
          exportRecord['Resource Name'] = task.resource_name || "-";
        }
        if (allowedFieldSet.has('resource_type_name')) {
          exportRecord['Resource Type'] = task.resource_type_name || "-";
        }
        if (allowedFieldSet.has('resource_role')) {
          exportRecord['Role'] = task.resource_role || "-";
        }
        if (allowedFieldSet.has('start_date')) {
          exportRecord['Task Date'] = moment(task.start_date).format("YYYY-MM-DD") || "-";
        }
        if (allowedFieldSet.has('total_cost_pro_task')) {
          exportRecord['Cost'] = await this.projectTaskService.formatNumberForExport(
            task.total_cost_pro_task,
            task.currency_symbol
          ) || "-";
        }
        if (allowedFieldSet.has('total_hours_pro_task')) {
          exportRecord['Effort in Hrs'] = task.total_hours_pro_task || "-";
        }
        if (allowedFieldSet.has('comments')) {
          exportRecord['Comments'] = task.comments || "-";
        }
        if (allowedFieldSet.has('r_number')) {
          exportRecord['Project Task ID'] = task.r_number || "-";
        }
        
        return exportRecord;
      })
    );

      // Ensure we always return at least an empty object in the array if there are no tasks
      const finalExportData = exportData.length > 0 ? exportData : [{}];

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          tasks: finalExportData,
          totalCount: total,
        },
      };
    } catch (err) {
      throw new Error(
        "Error fetching imported project_tasks: " + (err as Error).message
      );
    }
  }

  async getAllowedExportFields(
      userId: string,
      permission_name: string
    ): Promise<any[]> {
      const mainDbSequelize = await initMainDbSequelize();
      const [userInfo] = (await mainDbSequelize.query(
        `SELECT profile_rid FROM ${MAIN_SCHEMA_NAME}.user WHERE rid = :userId LIMIT 1;`,
        {
          replacements: { userId },
          type: QueryTypes.SELECT,
        }
      )) as [{ profile_rid: string }] | [];
  
      if (!userInfo?.profile_rid) {
        return [];
      }
  
      const [profileFields, userFields] = await Promise.all([
        mainDbSequelize.query(
          `
        SELECT pf.field_desc, pf.field_name, pfa.read, pfa.edit
        FROM ${MAIN_SCHEMA_NAME}.profile_fields_access pfa
        JOIN ${MAIN_SCHEMA_NAME}.permission_fields pf ON pfa.permission_field_id = pf.rid
        JOIN ${MAIN_SCHEMA_NAME}.module_permission mp ON pf.module_permission_id = mp.rid
        WHERE mp.permission_name = :permissionName
          AND pfa.profile_id = :profileId
        `,
          {
            replacements: {
              permissionName: permission_name,
              profileId: userInfo?.profile_rid,
            },
            type: "SELECT",
          }
        ),
        mainDbSequelize.query(
          `
        SELECT pf.field_desc, pf.field_name, ufa.read, ufa.edit
        FROM ${MAIN_SCHEMA_NAME}.user_fields_access ufa
        JOIN ${MAIN_SCHEMA_NAME}.permission_fields pf ON ufa.permission_field_id = pf.rid
        JOIN ${MAIN_SCHEMA_NAME}.module_permission mp ON pf.module_permission_id = mp.rid
        WHERE mp.permission_name = :permissionName
          AND ufa.user_id = :userId
        `,
          {
            replacements: {
              permissionName: permission_name,
              userId,
            },
            type: QueryTypes.SELECT,
          }
        ),
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
}
