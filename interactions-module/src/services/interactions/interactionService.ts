import { Logger } from "winston";
import SchemaService from "./schemaService";
import { ALPHANUMERIC_CONDITIONS, HttpStatus, mainTableFilters, rawQueries } from "../../utils/constants";
import { Sequelize } from "sequelize";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { fetchInteractionForProjectLevelQuery, listAllInteractionSummary } from "../../utils/rawQueries";

// Assuming there is an interface named IInteractionService to implement
export class InteractionService {
  private schemaService: SchemaService;
  private logger: Logger;
  private orgDbSequelize : Sequelize | null = null
  private mainDbSequelize : Sequelize | null = null 

  constructor(logger: Logger) {
    this.logger = logger;
    this.schemaService = new SchemaService();
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
}
