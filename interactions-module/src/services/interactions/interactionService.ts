import { Logger } from "winston";
import {
  ICreateInteraction,
  InteractionResponse,
  IUpdateInteraction,
} from "../../utils/types";
import InteractionSchemaService from "./schemaService";
import { InteractionModelService } from "../interactionModelsService";
import SchemaService from "./schemaService";
import { ALPHANUMERIC_CONDITIONS, HttpStatus, mainTableFilters, rawQueries,interactionSource,statusAction } from "../../utils/constants";
import { Sequelize } from "sequelize";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { fetchInteractionForProjectLevelQuery, listAllInteractionSummary, listResponseHistory } from "../../utils/rawQueries";

// Assuming there is an interface named IInteractionService to implement
export class InteractionService {
  private interactionSchemaService: InteractionSchemaService;
  private interactionModelService: InteractionModelService; // Assuming this is defined somewhere in your code
  private logger: Logger;
  private orgDbSequelize : Sequelize | null = null
  private mainDbSequelize : Sequelize | null = null 

  constructor(logger: Logger) {
    this.logger = logger;
    this.interactionSchemaService = new InteractionSchemaService();
    this.interactionModelService = new InteractionModelService(); // Initialize your model service here
  }

  async createInteraction(
    interactionData: ICreateInteraction,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactions: any };
  }> {
    const dbInit = await this.interactionModelService.getSequelize();
    const transaction = await dbInit.transaction();
    try {
      interactionData.created_by = userId;
      const { accountNumber } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          interactionData.account_rid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }

      const { interactionStatus, intSource } =
        await this.getInteractionStatusAndSource(interactionData.status_action);
      interactionData.interaction_status_rid = interactionStatus || "";
      interactionData.interaction_source_rid = intSource || "";

      const interaction =
        await this.interactionSchemaService.createInteractions(
          accountNumber,
          interactionData,
          transaction
        );
      if (interaction) {
        await this.interactionSchemaService.addInteractionItems(
          accountNumber,
          interactionData,
          interaction.rid,
          transaction,
          userId
        );
        console.log("Interaction created successfully", interaction.rid);
        await this.interactionSchemaService.addInteractionSummary(
          accountNumber,
          interactionData,
          interaction.rid,
          interaction.get("r_number") || ""
        );
        await this.interactionSchemaService.addInteractionTimeline(
          accountNumber,
          "create",
          interactionData,
          interaction.rid,
          userId,
          transaction
        );
      }
      await transaction.commit();
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          interactions: interaction,
        },
      };
    } catch (err) {
      await transaction.rollback();
      console.log("Error creatng resource", err);
      throw this.throwServiceError(err as Error);
    }
  }
  async getInteractionStatusAndSource(status_action: string) {
    const status = statusAction[status_action as keyof typeof statusAction];
    if (!status) {
      throw new Error("Invalid status_action value");
    }
    const [interactionStatus, intSource] = await Promise.all([
      this.interactionSchemaService.getInteractionStatusByType(status),
      this.interactionSchemaService.getInteractionSourceByType(
        interactionSource.MANUAL
      ),
    ]);
    return { interactionStatus, intSource };
  }

  async updateInteraction(
    interactionData: IUpdateInteraction,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactions: any };
  }> {
    const dbInit = await this.interactionModelService.getSequelize();
    const transaction = await dbInit.transaction();
    try {
      const { accountNumber } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          interactionData?.account_rid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }
      const existingInteractionData =
        await this.interactionSchemaService.fetchInteractionById(
          accountNumber,
          interactionData.interaction_rid
        );
      const { interactionStatus, intSource } =
        await this.getInteractionStatusAndSource(interactionData.status_action);
      interactionData.interaction_status_rid = interactionStatus || "";
      interactionData.interaction_source_rid = intSource || "";
      const updatedInteraction =
        await this.interactionSchemaService.updateInteraction(
          accountNumber,
          interactionData,
          userId,
          transaction
        );
      if (updatedInteraction) {
        await this.interactionSchemaService.addInteractionItems(
          accountNumber,
          interactionData,
          interactionData.interaction_rid,
          transaction,
          userId
        );
        await this.interactionSchemaService.addInteractionTimeline(
          accountNumber,
          "update",
          interactionData,
          interactionData.interaction_rid,
          userId,
          transaction
        );

        // await this.interactionSchemaService.addInteractionHistory(
        //   accountNumber,
        //   interactionData,
        //   existingInteractionData,
        //   interactionData.interaction_rid,
        //   userId,
        //   transaction
        // );
      }

      await transaction.commit();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          interactions: null,
        },
      };
    } catch (err) {
      await transaction.rollback();
      console.log("Error creatng resource", err);
      throw this.throwServiceError(err as Error);
    }
  }

  async updateInteractionResponse(
    interactionData: InteractionResponse,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactions: any };
  }> {
    const dbInit = await this.interactionModelService.getSequelize();
    const transaction = await dbInit.transaction();
    try {
      const { accountNumber } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          interactionData?.account_rid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }
      const updatedInteractionResponse =
        await this.interactionSchemaService.updateInteractionResponse(
          accountNumber,
          interactionData,
          userId,
          transaction
        );
      await transaction.commit();
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          interactions: updatedInteractionResponse,
        },
      };
    } catch (err) {
      await transaction.rollback();
      console.log("Error creatng resource", err);
      throw this.throwServiceError(err as Error);
    }
  }
  async getInteractionDetailsById(
    interactionRid: string,
    accountRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionDetails: any };
  }> {
    try {
      const { accountNumber } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          accountRid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }
      const interactionDetails =
        await this.interactionSchemaService.fetchInteractionDetailsById(
          accountNumber,
          interactionRid
        );

      if (!interactionDetails) {
        throw new Error("Invalid interaction ID");
      }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          interactionDetails,
        },
      };
    } catch (err) {
      console.log("Error creatng resource", err);
      throw this.throwServiceError(err as Error);
    }
  }

  async getInteractionQuestionsById(
    interactionRid: string,
    accountRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionQuestions: any };
  }> {
    try {
      const { accountNumber } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          accountRid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }
      const interactionQuestions =
        await this.interactionSchemaService.fetchInteractionQuestionsById(
          accountNumber,
          interactionRid
        );

      if (!interactionQuestions) {
        throw new Error("Invalid interaction ID");
      } else {
      }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          interactionQuestions,
        },
      };
    } catch (err) {
      console.log("Error creatng resource", err);
      throw this.throwServiceError(err as Error);
    }
  }

  async getInteractionStatus(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionStatus: any };
  }> {
    try {
      const interactionStatus =
        await this.interactionSchemaService.getInteractionStatus();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          interactionStatus,
        },
      };
    } catch (err) {
      throw this.throwServiceError(err as Error);
    }
  }

  async getInteractionTypes(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionTypes: any };
  }> {
    try {
      const interactionTypes =
        await this.interactionSchemaService.getInteractionTypes();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          interactionTypes,
        },
      };
    } catch (err) {
      throw this.throwServiceError(err as Error);
    }
  }

  async getInteractionSource(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionSource: any };
  }> {
    try {
      const interactionSource =
        await this.interactionSchemaService.getInteractionSource();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          interactionSource,
        },
      };
    } catch (err) {
      throw this.throwServiceError(err as Error);
    }
  }

  async sendInteraction(
    interactionRid: string[],
    accountRid: string,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { interactionResponse: any };
  }> {
    try {
      const interactionResponse: any[] = [];
       const { accountNumber } =
        await this.interactionSchemaService.fetchValidAccountNumberById(
          accountRid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }
      // for (const rid of interactionRid) {
      //   const interactionItems = await this.interactionSchemaService.fetchInteractionQuestionsById(accountNumber,rid);
      // }
     /* for (const rid of interactionRid) {
        const interactionItems = await this.interactionSchemaService.fetchInteractionItemsById(rid);
        const latestResponses = await this.interactionSchemaService.fetchLatestResponsesByInteractionId(rid);

        const csvRows: string[] = [];
        csvRows.push("Item,Latest Response");

        for (const item of interactionItems) {
          const response = latestResponses.find((resp: any) => resp.item_rid === item.rid);
          csvRows.push(`"${item.name}","${response ? response.value : ""}"`);
        }

        const csvContent = csvRows.join('\n');
        const interactionDetails = await this.interactionSchemaService.fetchInteractionDetailsById(undefined, rid);
        if (!interactionDetails) continue;

        // Assuming sendEmailWithAttachment is a method to send email with attachment
        await this.interactionSchemaService.sendEmailWithAttachment(
          interactionDetails,
          userId,
          {
            filename: `interaction_${rid}.csv`,
            content: csvContent,
            contentType: 'text/csv'
          }
        );

        interactionResponse.push({
          interactionRid: rid,
          csvSent: true
        });
      }
  //  const interactionResponse = [];
  /*  for (const rid of interactionRid) {
      const interactionResponse: any[] = [];
      const interactionItems = await this.interactionSchemaService.fetchInteractionItemsById(rid);
      const latestResponses = await this.interactionSchemaService.fetchLatestResponsesByInteractionId(rid);

      const csvRows: string[] = [];
      csvRows.push("Item,Latest Response");

      for (const item of interactionItems) {
        const response = latestResponses.find((resp: any) => resp.item_rid === item.rid);
        csvRows.push(`"${item.name}","${response ? response.value : ""}"`);
      }

      // You can write csvRows.join('\n') to a file or return as needed
      interactionResponse.push({
        interactionRid: rid,
        csv: csvRows.join('\n')
      });
      const interactionDetails = await this.interactionSchemaService.fetchInteractionDetailsById(undefined, rid);
      if (!interactionDetails) continue;
      // Assuming sendEmail is a method to send email for an interaction
      // const emailResult = await this.interactionSchemaService.sendEmail(interactionDetails, userId);
      // interactionResponse.push({
      //   interactionRid: rid,
      //   emailStatus: emailResult?.status || "sent",
      //   message: emailResult?.message || "Email sent successfully"
      // });
    }
    */  

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          interactionResponse:null,
        },
      };
    } catch (err) {
      throw this.throwServiceError(err as Error);
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
  private async getMainDb() {
    if(!this.mainDbSequelize) this.mainDbSequelize = await initMainDbSequelize()
    return this.mainDbSequelize
  }
  private async getOrgDb() {
    if(!this.orgDbSequelize) this.orgDbSequelize = await initOrgSequelize()
    return this.orgDbSequelize
  }

  // Implement all methods required by IInteractionService
  // Example method (replace with actual interface methods)
  public async interact(): Promise<void> {
    this.logger.info("Interact method called.");
    // Implementation here
  }
  async listInteractionPrjAccount(data : any) {
    const mainDb = await this.getMainDb()
    const orgDb = await this.getOrgDb()
    let fetchParentAccount : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb))
    let schemaName = rawQueries.fetchSchemaName(fetchParentAccount[0][0].r_number)
    let createdByFilter;
    let createdByConditions;
    let modifiedByFilter;
    let modifiedByConditions;
    let typeFilter;
    let typeCondition;
    let sourceFilter;
    let sourceConditions;
    let statusFilter;
    let statusConditions;
    let filterKeyName;
    let disablePagination : boolean = false
    let totalResults : number = 0

    const detectConditions = (filters : any) => {
      if(!filters) return null
      for(let conditions of Object.values(ALPHANUMERIC_CONDITIONS)) {
        if(filters[conditions] !== undefined) return conditions
      }
      return null
    }
    if(data.filters?.created_user_name) {
      createdByFilter = data.filters.created_user_name
      createdByConditions = detectConditions(createdByFilter)
    }
    if(data.filters?.updated_user_name) {
      modifiedByFilter = data.filters.updated_user_name
      modifiedByConditions = detectConditions(modifiedByFilter)
    }
    if(data.filters?.interaction_type_name) {
      typeFilter = data.filters.interaction_type_name
      typeCondition = detectConditions(typeFilter)
    }
    if(data.filters?.interaction_source_name) {
      sourceFilter = data.filters.interaction_source_name
      sourceConditions = detectConditions(sourceFilter)
    }
     if(data.filters?.status_name) {
      statusFilter = data.filters.status_name
      statusConditions = detectConditions(sourceFilter)
    }

    ["created_user_name", "updated_user_name", "interaction_type_name", "interaction_source_name", "status_name"].forEach(key => {
      if(data.filters[key]) {
        disablePagination = true
        delete data.filters[key]
      }
    })
    
    const result : any = await orgDb.query(fetchInteractionForProjectLevelQuery(
      data.account_rid, 
      data.project_rid,
      data.project_fiscal_rid,
      data.fiscal_year,
      data.sort,
      data.sort_by,
      data.filters,
      data.page, 
      data.limit,
      data.flag, 
      schemaName,
      disablePagination
    ))
    if(result[0][0].interactions != null) {
      let statusIds : any[] = [...new Set(result[0][0].interactions.map((d : any) => d.status))]
      let typeIds : any[] = [...new Set(result[0][0].interactions.map((d : any) => d.interaction_type))]
      let sourceIds : any[] = [...new Set(result[0][0].interactions.map((d : any)=> d.interaction_source))]
      let createdByIds : any[] = [...new Set(result[0][0].interactions.map((user : any) => user.created_by))]
      let modifiedByIds : any[] = [...new Set(result[0][0].interactions.map((user : any) => user.modified_by))]
      
      let fetchStatus = await mainDb.query(rawQueries.fetchInteractionStatus(statusIds))
      let fetchTypes = await mainDb.query(rawQueries.fetchInteractionTypes(typeIds))
      let fetchSource = await mainDb.query(rawQueries.fetchInteractionSource(sourceIds))
      let fetchCreatedByUsers = await mainDb.query(rawQueries.fetchUser(createdByIds))
      let fetchModifiedByUsers = await mainDb.query(rawQueries.fetchUser(modifiedByIds))
      
      let statusMap : Map<string, string> = new Map(fetchStatus[0].map((status : any) => [status.rid, status.status_name]))
      let typeMap : Map<string, string> = new Map(fetchTypes[0].map((types : any) => [types.rid, types.interaction_type_name]))
      let sourceMap : Map<string, string> = new Map(fetchSource[0].map((source : any) => [source.rid, source.interaction_source_name]))
      let createdMap : Map<string, string> = new Map(fetchCreatedByUsers[0].map((user : any) => [user.rid, `${user.first_name} ${user.last_name}`]))
      let modifiedMap : Map<string, string> = new Map(fetchModifiedByUsers[0].map((user : any) => [user.rid, `${user.first_name} ${user.last_name}`]))

      let finalData = result[0][0].interactions == null ? [] : result[0][0].interactions.map((d : any) => {
        return {
          ...d,
          status_rid : d.status,
          status_name : statusMap.get(d.status),
          interaction_type_rid : d.interaction_type,
          interaction_type_name : typeMap.get(d.interaction_type),
          interaction_source_rid : d.interaction_source,
          interaction_source_name : sourceMap.get(d.interaction_source),
          created_by : d.created_by,
          created_user_name : createdMap.get(d.created_by) || null,
          modified_by : d.modified_by,
          updated_user_name : modifiedMap.get(d.modified_by) || null
        }
      })
      const applyFilters = (data : any[], conditions : any, value : any, field : any) => {
        if(!conditions || !field) return data
        const val = value[conditions]
        switch(conditions) {
          case ALPHANUMERIC_CONDITIONS.equals : 
            return data.filter((d : any) => d[field]?.toLowerCase() === val?.toLowerCase())
          case ALPHANUMERIC_CONDITIONS.notEquals :
            return data.filter((d : any) => d[field]?.toLowerCase() != val?.toLowerCase())
          case ALPHANUMERIC_CONDITIONS.contains : 
            return data.filter((d : any) => d[field]?.toLowerCase().includes(val?.toLowerCase()))
          case ALPHANUMERIC_CONDITIONS.isEmpty :
            return data.filter((d : any) => d[field] == null)
          default :
            return data
        }
      }
      if(createdByConditions != null && createdByConditions != undefined)
        finalData = applyFilters(finalData, createdByConditions, createdByFilter, "created_user_name")
      if(modifiedByConditions != null && modifiedByConditions != undefined)
        finalData = applyFilters(finalData, modifiedByConditions, modifiedByFilter, "updated_user_name")
      if(sourceConditions != null && sourceConditions != undefined)
        finalData = applyFilters(finalData, sourceConditions, sourceFilter, "interaction_source_name")
      if(typeCondition != undefined && typeCondition != null) {
        finalData = applyFilters(finalData, typeCondition, typeFilter, "interaction_type_name")
      }
      if(statusConditions != undefined && statusConditions != null) {
        finalData = applyFilters(finalData, statusConditions, statusFilter, "status_name")
      }
      if(mainTableFilters[data.sort] != undefined && data.sort_by.toLowerCase() == 'asc') {
        finalData = finalData.sort((a : any, b : any) => {
          return a[data.sort].localeCompare(b[data.sort])
        })
      } else {
        finalData = finalData.sort((a : any, b : any) => {
          return b[data.sort].localeCompare(a[data.sort])
        })
      }
      totalResults = disablePagination ? finalData.length : finalData[0].total_records
      let finalPaginatedData = disablePagination ? finalData.slice((data.page - 1) * data.limit, data.page * data.limit) : finalData
      let organizedData = {
        page : data.page,
        limit : data.limit,
        totalCount : totalResults,
        interactions : finalPaginatedData
      }
      return {
        status : HttpStatus.SUCCESS,
        data : organizedData
      }
    }
    else {
      let organizedData = {
        page : data.page,
        limit : data.limit,
        totalCount : 0,
        interactions : []
      }
      return {
        status : HttpStatus.NOT_FOUND,
        data : organizedData
      }
    }
  }
  async fetchInteractionSummary (data : any) {
    const mainDb = await this.getMainDb()
    const result : any = await mainDb.query(listAllInteractionSummary(data.page, data.limit, 
      data.filters, data.globalFilters, data.fiscal_year, data.sort, data.sort_by
    ))
    if(result[0][0].interactions != null) {
      return {
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        data : result[0][0].interactions
      }
    } else {
      return {
        statusCodeValue : HttpStatus.NOT_FOUND_MESSAGE,
        data : []
      }
    }
  }

  async listInteractionResponseHistory (data : any) {
    const mainDb = await this.getMainDb()
    const orgDb = await this.getOrgDb();
    let fetchParent : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb))
    let schemaName = rawQueries.fetchSchemaName(fetchParent[0][0].r_number)
    const responseHistoryresult : any = await orgDb.query(listResponseHistory(data.interaction_rid, schemaName, data.page, data.limit, data.sort, data.sort_by))
    if(responseHistoryresult[0][0].response_history !== null) {
      let finalData = responseHistoryresult[0][0].response_history
      let fetchSourceIds : any = [...new Set(finalData.map((d : any) => d.interaction_source_rid))]
      let fetchUserIds : any = [...new Set(finalData.map((d : any) => d.response_by_rid))]
      let fetchUserDetails : any = await mainDb.query(rawQueries.fetchUser(fetchUserIds))
      let fetchInteractionSource : any = await mainDb.query(rawQueries.fetchInteractionSource(fetchSourceIds))
      let mapSources = new Map(fetchInteractionSource[0].map((source : any) => [source.rid, source.interaction_source_name]))
      let userMap = new Map(fetchUserDetails[0].map((d : any) => [d.rid, `${d.first_name} ${d.last_name}`]))
      let updatedFinalData = finalData.map((d : any) => {
        return {
          ...d,
          interaction_source_name : mapSources.get(d.interaction_source_rid),
          response_by : userMap.get(d.response_by_rid)
        }
      })
      
      if(data.sort.toLowerCase() == "interaction_source_name" && data.sort_by.toLowerCase() == 'asc') {
        updatedFinalData = updatedFinalData.sort((a : any, b : any) => {
          return a.interaction_source_name.localeCompare(b.interaction_source_name)
        })
      } else if(data.sort.toLowerCase() == "interaction_source_name" && data.sort_by.toLowerCase() == 'desc'){
         updatedFinalData = updatedFinalData.sort((a : any, b : any) => {
          return b.interaction_source_name.localeCompare(a.interaction_source_name)
        })
      }
      return {
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        data : updatedFinalData
      }
    } else {
      return {
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        data : []
      }
    }
  }
}
