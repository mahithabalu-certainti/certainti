import Configurations from "../config/config";
import { initMainDbSequelize } from "../config/mainDataSource";
import { initOrgSequelize } from "../config/orgDataSource";
import {
  HttpStatus,
  rawQueries,
  STATUS_MESSAGE,
} from "../utils/constants";
import { setResourceFiscal, setResourcesData } from "../utils/helpers";
const services = Configurations.getInstance().getServices()
const resourceServices = services.resourceService

export default class ResourceGraphQlServices {
  async inLineEditResources(data: any) {
    const mainSequelize = await initMainDbSequelize();
    const orgSequelize = await initOrgSequelize();

    const checkAccountExists: any = await mainSequelize.query(
      rawQueries.fetchParentAccount(data.account_rid)
    );

    if (checkAccountExists.length < 1) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        statusMessage: STATUS_MESSAGE.accountNoFound,
        data : null
      };
    } else {
      let schemaName = `"trd365_${checkAccountExists[0][0].r_number.replace(
        "ACC-",
        ""
      )}"`;
      let fetchResources: any = await orgSequelize.query(
        rawQueries.fetchResources(schemaName, data)
      );
      if (fetchResources[0].length < 1) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          statusMessage: STATUS_MESSAGE.accountNoFound,
          data : null
        };
      }
      if (data.resource_type_rid) {
        let isResourceTypeExists = await mainSequelize.query(
          rawQueries.checkResourceTypeExists(data)
        );
        if (isResourceTypeExists[0].length < 1) {
          return {
            statusCode: HttpStatus.NOT_FOUND,
            statusMessage: STATUS_MESSAGE.resourceTypeNotFound,
            data : null
          };
        }
      }
      if (data.country_rid) {
        let isResourceTypeExists = await mainSequelize.query(
          rawQueries.checkCountryExists(data)
        );
        if (isResourceTypeExists[0].length < 1) {
          return {
            statusCode: HttpStatus.NOT_FOUND,
            statusMessage: STATUS_MESSAGE.countryNotFound,
            data : null
          };
        }
      }
      if (data.region_rid) {
        let isResourceTypeExists = await mainSequelize.query(
          rawQueries.checkRegionExists(data)
        );
        if (isResourceTypeExists[0].length < 1) {
          return {
            statusCode: HttpStatus.NOT_FOUND,
            statusMessage: STATUS_MESSAGE.stateNotFound,
            data : null
          };
        }
      }
      if (data.resource_code) {
        let checkDuplicateCode = await orgSequelize.query(
          rawQueries.isResourceCodeDuplicate(schemaName, data)
        );
        if (checkDuplicateCode[0].length > 0) {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            statusMessage: STATUS_MESSAGE.resourceCodeDuplicate,
            data : null
          };
        }
      }
      let setResource = setResourcesData(fetchResources[0][0], data);
      let updateResource: any = await orgSequelize.query(
        rawQueries.updateResourceQuery(schemaName, setResource, data)
      );
      if (updateResource) {
        let fetchResourceFiscal: any = await orgSequelize.query(
          rawQueries.getResourceFiscalQuery(schemaName, data)
        );

        if (fetchResourceFiscal[0].length > 0) {
          let setFiscalData = setResourceFiscal(
            fetchResourceFiscal[0][0],
            data
          );
          await orgSequelize.query(
            rawQueries.updateResourceFiscalQuery(
              schemaName,
              setFiscalData,
              fetchResourceFiscal,
              data
            )
          );
        }
        let insertQuery = rawQueries.insertQueryResTimeline(schemaName, data);
        await orgSequelize.query(insertQuery);

        for (let history of setResource) {
          let key = history.split("=")[0];
          let finalTrimmedKey = key.trim();
          if (
            finalTrimmedKey != "modified_by" &&
            finalTrimmedKey != "modified_datetime"
          ) {
            let oldValue;
            let newValue;
            let attributeName;
            if (finalTrimmedKey == "resource_firstname")
              newValue = data["resource_name"].split(" ")[0];
            else if (finalTrimmedKey == "resource_lastname")
              newValue = data["resource_name"].split(" ")[1];
            else newValue = data[finalTrimmedKey];
            attributeName = finalTrimmedKey;
            oldValue = fetchResources[0][0][finalTrimmedKey];
            
            if(newValue == undefined) newValue = ''
            else newValue = newValue
            if (oldValue !== newValue) {
              let query = rawQueries.insertQueryResHistory(
                schemaName,
                data,
                attributeName,
                oldValue,
                newValue
              );
              await orgSequelize.query(query);
            }
          }
        }
        let fetchResourcesList = await resourceServices.resourceById(checkAccountExists[0][0].r_number, data.resource_rid)
        if(fetchResourcesList.data?.resourceDetails) {
          let data = fetchResourcesList.data?.resourceDetails
          let finalData = {
            rid : data.rid, 
            r_number : data.r_number,
            resource_code : data.resource_code,
            resource_name : data.resource_name,
            resource_firstname : data.resource_firstname,
            resource_lastname : data.resource_lastname,
            resource_type_rid : data.resource_type_rid,
            status_rid : data.status_rid,
            resource_role : data.resource_role,
            resource_designation : data.resource_designation,
            resource_orgname : data.resource_orgname,
            comments : data.comments,
            resource_total_experience : data.resource_total_experience,
            country_rid : data.country_rid,
            region_rid : data.region_rid,
            city_rid : data.city_rid,
            account_name : checkAccountExists[0][0].account_name,
            total_project_hours : data.total_effort_for_year_project,
            estimated_rd_hours : data.estimated_rd_hours,
            country_name : data.country_name,
            region_name : data.region_name,
            city_name : data.city_name,
            resource_type_name : data.resource_type_name,
            status_name : data.status_name
          }
          return {
            statusCode: HttpStatus.SUCCESS,
            statusMessage: STATUS_MESSAGE.resourceUpdateSuccess,
            data : finalData
        }
        }
      }
    }
  }
}
