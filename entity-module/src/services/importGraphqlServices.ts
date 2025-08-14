import { Sequelize } from "sequelize";
import { initOrgSequelize } from "../config/orgDataSource";
import { initMainDbSequelize } from "../config/mainDataSource";
import { HttpStatus, MAIN_SCHEMA_NAME, rawQueries, STATUS_MESSAGE } from "../utils/constants";
import { fetchImportListByRid, listAllImportedDatasQuery, listAllStageFailures,listAllLoadFailures } from "../utils/rawQueries";
import { setInlineForImports } from "../utils/helpers";
import { generateSasUrl } from "../utils/blob";


export default class ImportGraphqlServices {
      private orgSequelize: Sequelize | null = null;
      private mainDbSequelize: Sequelize | null = null;
    
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
}