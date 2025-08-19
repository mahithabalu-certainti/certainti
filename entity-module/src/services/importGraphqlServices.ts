import { Sequelize } from "sequelize";
import { initOrgSequelize } from "../config/orgDataSource";
import { initMainDbSequelize } from "../config/mainDataSource";
import { HttpStatus, MAIN_SCHEMA_NAME, rawQueries, STATUS_MESSAGE } from "../utils/constants";
import { fetchImportListByRid, listAllImportedDatasQuery, listAllStageFailures,listAllLoadFailures } from "../utils/rawQueries";
import { setInlineForImports } from "../utils/helpers";
import { generateSasUrl } from "../utils/blob";
import { ProjectService } from "./projectService";
import { ResourceService } from "./resourceServices";
import { ProjectTaskService } from "./projectTaskService";
import SchemaService from "./schemaService";
import ProjectIngestionService from "./projectIngestionService";
import { Logger } from "winston";
import { raw } from "express";


export default class ImportGraphqlServices {
      private orgSequelize: Sequelize | null = null;
      private mainDbSequelize: Sequelize | null = null;
      private projectService: ProjectService;
      private resourceService: ResourceService;
      private projectTaskService: ProjectTaskService;
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
    async listAllImportedData (page : number, limit : number, sort : string, sortBy : string, account_rid : string, filters : Record<string, any>, fiscal_year : number) {
        const orgSequelize = await this.getOrgSequelize()
        const mainSequelize = await this.getMainDbSequelize()
        let disablePagination : boolean = false

        const fetchParentRnumber : any = await mainSequelize.query(await rawQueries.fetchParentAccount(account_rid, mainSequelize))
        let schemaName = rawQueries.fetchSchemaName(fetchParentRnumber[0][0].r_number)

        if (filters.imported_by) {
          disablePagination = true
          delete filters.imported_by;
        }
        const result = await orgSequelize.query(listAllImportedDatasQuery(page, limit, sort, sortBy, account_rid, filters, schemaName, disablePagination, fiscal_year))
       if(result[0].length > 0) {
            return {
                statusCode : HttpStatus.SUCCESS,
                data : result[0]
            }
        }
        else {
            return {
                statusCode : HttpStatus.NOT_FOUND,
                data : []
            }
        }
    }

    async listAllStageFailures (account_rid : string,import_rid:string,entity_type:string) {
        const orgSequelize = await this.getOrgSequelize()
        const mainSequelize = await this.getMainDbSequelize()

        const fetchParentRnumber : any = await mainSequelize.query(await rawQueries.fetchParentAccount(account_rid, mainSequelize))
        let schemaName = rawQueries.fetchSchemaName(fetchParentRnumber[0][0].r_number)

        const result = await orgSequelize.query(listAllStageFailures(schemaName,import_rid,entity_type))
        if(result[0].length > 0) {
            return {
                statusCode : HttpStatus.SUCCESS,
                data : result[0]
            }
        }
        else {
            return {
                statusCode : HttpStatus.NOT_FOUND,
                data : []
            }
        }
    }

    async listAllLoadFailures (account_rid : string,import_rid:string,entity_type:string) {
        const orgSequelize = await this.getOrgSequelize()
        const mainSequelize = await this.getMainDbSequelize()

        const fetchParentRnumber : any = await mainSequelize.query(await rawQueries.fetchParentAccount(account_rid, mainSequelize))
        let schemaName = rawQueries.fetchSchemaName(fetchParentRnumber[0][0].r_number)

        const result = await orgSequelize.query(listAllLoadFailures(schemaName,import_rid,entity_type))
        if(result[0].length > 0) {
            return {
                statusCode : HttpStatus.SUCCESS,
                data : result[0]
            }
        }
        else {
            return {
                statusCode : HttpStatus.NOT_FOUND,
                data : []
            }
        }
    }
    async fetchUserDetails(userRids: string[]) {
      const mainSequelize = await this.getMainDbSequelize();
      if (!userRids.length) return [];

      const placeholders = userRids.map(() => '?').join(',');
      const query = `SELECT rid, first_name, last_name FROM ${MAIN_SCHEMA_NAME}.user WHERE rid IN (${placeholders})`;

      const [results] = await mainSequelize.query(query, {
          replacements: userRids
      });

      return results;
  }
    
    async fetchImportById (account_rid : string, rid : string) {
      let mainSequelize = await this.getMainDbSequelize()
      let orgSequelize = await this.getOrgSequelize()

      let fetchParentAccount : any = await mainSequelize.query(await rawQueries.fetchParentAccount(account_rid, mainSequelize))
      let schemaName = rawQueries.fetchSchemaName(fetchParentAccount[0][0].r_number)

      const result : any = await orgSequelize.query(fetchImportListByRid(rid, schemaName))
      if(result[0][0]) {
        const fetchUserDetails : any = await mainSequelize.query(rawQueries.fetchUserDetailsById(result[0][0].imports.imported_by))
        delete result[0][0].imports.imported_by
        result[0][0].imports.document_url = await generateSasUrl(result[0][0].imports.document_url)
        result[0][0].imports.imported_on = new Date(result[0][0].imports.imported_on).toISOString()
        result[0][0].imports.imported_by = fetchUserDetails[0][0].imported_by

        return {
          statusCode : HttpStatus.SUCCESS,
          data : result[0][0]
        }
      } else {
        return {
          statusCode : HttpStatus.NOT_FOUND,
          data : null
        }
      }
    }

    async inlineEditImportList (data : any) {
      const mainDb = await this.getMainDbSequelize()
      const orgDb = await this.getOrgSequelize()
      console.log(data)
      const fetchAccountDetails : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb))
      let schemaName = rawQueries.fetchSchemaName(fetchAccountDetails[0][0].r_number)

      const checkImportDataExists = await this.fetchImportById(data.account_rid, data.rid)
      let importDbData = checkImportDataExists.data
      const setInlineDetails = setInlineForImports(importDbData, data)
      if(setInlineDetails == null) {
        return {
          statusCode : HttpStatus.BAD_REQUEST,
          statusMessage : STATUS_MESSAGE.noDataToUpdate,
          data : null
        }        
      }
      const updateImportDetails = await orgDb.query(rawQueries.updateImport(schemaName, setInlineDetails, data.rid))
      if(updateImportDetails.length > 0) {
        const latestUpdatedData = await this.fetchImportById(data.account_rid, data.rid)
        return {
          statusCode : HttpStatus.SUCCESS,
          statusMessage : STATUS_MESSAGE.importUpdatedSuccess,
          data : latestUpdatedData.data
        }
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
        fetchAccountDetails[0][0].r_number,
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

      const [finalSortBy, finalSortOrder] = this.projectService.getSortParameters(
        sortBy,
        sortOrder
      );
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
      throw new Error("Error fetching imported projects: " + (err as Error).message);
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

      const [finalSortBy, finalSortOrder] = this.resourceService.getSortParameters(
        sortBy,
        sortOrder
      );

      const { whereClause, havingClause } = this.resourceService.buildWhereClause(filters, search);
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
      throw new Error("Error fetching imported resources: " + (err as Error).message);
      }
    }
}