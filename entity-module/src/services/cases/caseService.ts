import { Op, QueryTypes, Sequelize } from "sequelize";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { Logger } from "winston";
import  CaseSchemaService from "./schemaService";
import { CaseModelService } from "./caseModelsService";
import {
  UpdateCaseTaskType,
} from "../../utils/types";
import {
  HttpStatus,
  STATUS_MESSAGE,
  rawQueries,

} from "../../utils/constants";

export class CaseService {
  private caseSchemaService: CaseSchemaService;
  private caseModelService: CaseModelService; // Assuming this is defined somewhere in your code
  private logger: Logger;
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;

  constructor(logger: Logger) {
    this.logger = logger;
    this.caseSchemaService = new CaseSchemaService();
    this.caseModelService = new CaseModelService(); // Initialize your model service here
  }

  private async getMainDb() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    return this.mainDbSequelize;
  }

  private async getOrgDb() {
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await initOrgSequelize();
    }
    return this.orgDbSequelize;
  }


async updateUserLevelTask (data : UpdateCaseTaskType) {
    const mainDb = await this.getMainDb();
    const dbInit = await this.caseModelService.getSequelize()
    const transaction = await dbInit.transaction()
    try {
      const fetchParentNumber : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
      if(fetchParentNumber[0].length > 0) {
        const findTask : any = await this.caseSchemaService.findTaskById(data.rid, data.account_rid, data.case_rid, fetchParentNumber[0][0].r_number, "milestone");
        let eid;
        if(findTask) eid = findTask.eid
        else eid = null
        
        const isTaskNameExists = await this.caseSchemaService.checkTaskNameExistsForUpdate(data, fetchParentNumber[0][0].r_number, eid);
        if(isTaskNameExists) {
          return {
            statusCode : HttpStatus.BAD_REQUEST,
            statusMessage : STATUS_MESSAGE.taskNameExistsAlready
          }         
        }
        else {
          const getActiveStatusId : any = await mainDb.query(rawQueries.getActiveStatusId());
          const result = await this.caseSchemaService.updateUserLevelTask(data, fetchParentNumber[0][0].r_number, transaction, getActiveStatusId[0][0].rid);
          if(result.statusCode === HttpStatus.SUCCESS) {
            await transaction.commit()
          } else {
            await transaction.rollback()
          }
          return {
            statusCode : result.statusCode,
            statusMessage : result.statusMessage
          }
        }
      } else {
        return {
          statusCode : HttpStatus.FAILED,
          statusMessage : STATUS_MESSAGE.accountNotFound
        }
      }
    } catch (error) {
      await transaction.rollback()
      return {
        statusCode : HttpStatus.FAILED,
        statusMessage : STATUS_MESSAGE.taskUpdatedFailed
      }
    }  
}
}