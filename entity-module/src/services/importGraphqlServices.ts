import { Sequelize } from "sequelize";
import { initOrgSequelize } from "../config/orgDataSource";
import { initMainDbSequelize } from "../config/mainDataSource";
import { HttpStatus, MAIN_SCHEMA_NAME, rawQueries } from "../utils/constants";
import { listAllImportedDatasQuery } from "../utils/rawQueries";

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
}