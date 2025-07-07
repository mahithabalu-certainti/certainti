import { initSequelize } from "../config/mainDataSource";
import { initOrgSequelize } from "../config/orgDataSource";
import { HttpStatus, MAIN_SCHEMA_NAME, rawQueries, STATUS_MESSAGE } from "../utils/constants";
import { setResFiscalForResCost, setResourceCostDatas } from "../utils/helpers";

export default class ResourceCostGraphQlService {
      async inlineEditResourceCost (data : any) {
    const mainDbSequelize = await initSequelize();
    const orgDbSequelize = await initOrgSequelize();
    let fetchParentAcc : any = await mainDbSequelize.query(rawQueries.fetchParentAccount(data.account_rid))
    
    if(fetchParentAcc[0].length < 1) {
      return {
        statusCode : HttpStatus.NOT_FOUND,
        statusMesage : STATUS_MESSAGE.accountNoFound
      }
    }
    else {
      let schemaName = `"${MAIN_SCHEMA_NAME}_${fetchParentAcc[0][0].r_number.replace('ACC-', '')}"`
      let checkResourceCostExists : any = await orgDbSequelize.query(rawQueries.isResourceCostExists(schemaName, data))
      if(checkResourceCostExists[0].length < 1) {
        return {
          statusCode : HttpStatus.NOT_FOUND,
          statusMesage : STATUS_MESSAGE.resourceCostNotFound          
        }
      }
      else {
        if(data.currency_rid) {
          let checkCurrencyExist = await mainDbSequelize.query(rawQueries.isCurrencyExists(data))
          if(checkCurrencyExist[0].length < 1) 
            return {
              statusCode : HttpStatus.NOT_FOUND,
              statusMesage : STATUS_MESSAGE.currencyInvalid          
            }
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
              newValue = data[finalData]
              attribute_name = finalData

              await orgDbSequelize.query(rawQueries.insertResCostHisQuery(schemaName, data, attribute_name, oldValue, newValue))
            }
          }
          return {
            statusCode : HttpStatus.SUCCESS,
            statusMessage : STATUS_MESSAGE.resourceCostUpdSuccess
          }
        }
      }
    }
  }
}