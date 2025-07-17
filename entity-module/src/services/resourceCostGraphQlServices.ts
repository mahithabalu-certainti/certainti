import { initMainDbSequelize } from "../config/mainDataSource";
import { initOrgSequelize } from "../config/orgDataSource";
import { HttpStatus, MAIN_SCHEMA_NAME, rawQueries, STATUS_MESSAGE } from "../utils/constants";
import { setResFiscalForResCost, setResourceCostDatas } from "../utils/helpers";
import resourceCostSchemaService from "../services/resourceCostSchemaService";
import { getCurrencyThreshold, getResourceStatuses } from "./resourceCostService";
import Decimal from "decimal.js";


export default class ResourceCostGraphQlService {
  async inlineEditResourceCost (data : any) {
    let bonus;
    let deductions;
    let insurance;
    let resource_cost;
    let salary;
    let effort_in_hrs;
    let status : string | undefined

    const mainDbSequelize = await initMainDbSequelize();
    const orgDbSequelize = await initOrgSequelize();
    let fetchParentAcc : any = await mainDbSequelize.query(await rawQueries.fetchParentAccount(data.account_rid, mainDbSequelize))
    
    if(fetchParentAcc[0].length < 1) {
      return {
        statusCode : HttpStatus.NOT_FOUND,
        statusMesage : STATUS_MESSAGE.accountNoFound,
        data : null
      }
    }
    else {
      const statusMap = await getResourceStatuses(mainDbSequelize);
      let schemaName = `${MAIN_SCHEMA_NAME}_${fetchParentAcc[0][0].r_number.replace('ACC-', '')}`
      let checkResourceCostExists : any = await orgDbSequelize.query(rawQueries.isResourceCostExists(schemaName, data))
      if(checkResourceCostExists[0].length < 1) {
        return {
          statusCode : HttpStatus.NOT_FOUND,
          statusMesage : STATUS_MESSAGE.resourceCostNotFound,
          data : null          
        }
      }
      else {
        if(data.currency_rid) {
          let checkCurrencyExist = await mainDbSequelize.query(rawQueries.isCurrencyExists(data))
          if(checkCurrencyExist[0].length < 1) 
            return {
              statusCode : HttpStatus.NOT_FOUND,
              statusMesage : STATUS_MESSAGE.currencyInvalid,
              data : null          
            }
          }
        if(checkResourceCostExists[0][0].currency_rid) {
          if(data.salary) salary = data.salary
          else salary = checkResourceCostExists[0][0].salary

          if(data.bonus) bonus = data.bonus
          else bonus = checkResourceCostExists[0][0].bonus

          if(data.insurance) insurance = data.insurance
          else insurance = checkResourceCostExists[0][0].insurance

          if(data.resource_cost) resource_cost = data.resource_cost
          else resource_cost = checkResourceCostExists[0][0].resource_cost

          if(data.deductions) deductions = data.deductions
          else deductions = checkResourceCostExists[0][0].deductions

          if(data.effort_in_hrs) effort_in_hrs = data.effort_in_hrs
          else effort_in_hrs = checkResourceCostExists[0][0].effort_in_hrs

          let currencyThreshold = await getCurrencyThreshold(mainDbSequelize, checkResourceCostExists[0][0].currency_rid)
          const calculatedResourceCost = Number(
            new Decimal(salary || 0)
              .plus(bonus || 0)
              .plus(insurance || 0)
              .plus(resource_cost || 0)
              .minus(deductions || 0)
          );
          const statusNameMap = new Map<string, string>();
          statusMap?.forEach((value, key) => {
            statusNameMap.set(value, key);
          });
          let resourceCostStatus = statusNameMap.get(status?.toString() || '') || 'Active';

          if (effort_in_hrs!== undefined && Number(effort_in_hrs) > 3000) {
            resourceCostStatus = "Anomaly";
          } 
          else if (
            (resource_cost !== undefined && currencyThreshold !== null && Number(resource_cost) > currencyThreshold) ||
            (salary !== undefined && currencyThreshold !== null && Number(salary) > currencyThreshold)
          ) {
            resourceCostStatus = "Anomaly";
          }
          const status_rid = statusMap?.get(resourceCostStatus);
          data.status_rid = status_rid
          data.net_resource_cost = calculatedResourceCost
        }
        
        let setResourceCost = setResourceCostDatas(checkResourceCostExists[0][0], data)
        let updateResourceCost = await orgDbSequelize.query(rawQueries.updateResourceCostQuery(schemaName, setResourceCost, data))
        if(updateResourceCost) {
          let fetchResFiscal = await orgDbSequelize.query(rawQueries.getResourceFiscalQuery(schemaName, data)) 
          if(fetchResFiscal[0].length > 0) {
            if(data.fiscal_year) {
                let setFiscal = setResFiscalForResCost(fetchResFiscal[0][0], data)
                await orgDbSequelize.query(rawQueries.setFiscalYear(schemaName, setFiscal, data))
            } 
          }
          await orgDbSequelize.query(rawQueries.insertResCostTimelineQuery(schemaName, data))
          for(let history of setResourceCost) {
            let splittedObj = history.split('=')[0]
            let finalData = splittedObj.trim()
            if(finalData != 'modified_by' && finalData !== 'modified_datetime') {
              let oldValue;
              let newValue;
              let attribute_name;
              oldValue = checkResourceCostExists[0][0][finalData]
              if (oldValue !== null && oldValue !== undefined && typeof oldValue === 'string') {
                oldValue = oldValue.replace(/'/g, "''");
              }
              newValue = data[finalData]
              if (newValue !== null && newValue !== undefined && typeof newValue === 'string') {
                newValue = newValue.replace(/'/g, "''");
              }
              attribute_name = finalData
              if(newValue == undefined) newValue = ''
              else newValue = newValue
              if(oldValue != newValue) {
                await orgDbSequelize.query(rawQueries.insertResCostHisQuery(schemaName, data, attribute_name, oldValue, newValue))
              }
            }
          }
          let graphQlData : any = {};
          graphQlData.is_graphQl = true
          graphQlData.rid = data.resource_cost_rid
          let result : any = await resourceCostSchemaService.executeQueries(
            schemaName,
            '',
            '',
            'resource_name',
            'ASC',
            data.resource_rid,
            1,
            0,
            '',
            data.account_rid,
            graphQlData
          )
          let d = result.data.resourceCost[0]
          let finalData = {
            rid: d.rid,
            r_number: d.r_number,
            eid: d.eid,
            created_by: d.created_by,
            modified_by: d.modified_by,
            created_datetime: d.created_datetime,
            modified_datetime: d.modified_datetime,
            account_rid: d.account_rid,
            resource_rid: d.resource_rid,
            resource_code: d.resource_code,
            resource_number: d.resource_number,
            fiscal_year: d.fiscal_year,
            effective_from: d.effective_from,
            end_date: d.end_date,
            effort_in_hrs: d.effort_in_hrs,
            currency_rid: d.currency_rid,
            comments: d.comments,
            deductions: d.deductions,
            insurance: d.insurance,
            bonus: d.bonus,
            resource_cost: d.resource_cost,
            salary: d.salary,
            net_resource_cost: d.net_resource_cost,
            status_rid: d.status_rid,
            resource_type_rid: d.resource_type_rid,
            resource_name: d.resource_name,
            resource_orgname: d.resource_orgname,
            resource_designation: d.resource_designation,
            resource_role: d.resource_role,
            account_name: d.account_name,
            status_name: d.status_name,
            resource_type_name: d.resource_type_name,
            currency_code: d.currency_code,
            currency_name: d.currency_name,
            currency_symbol: d.currency_symbol
          }
          return {
            statusCode : HttpStatus.SUCCESS,
            statusMessage : STATUS_MESSAGE.resourceCostUpdSuccess,
            data : finalData
          }
        }
      }
    }
  }
}