import { initMainDbSequelize } from "../config/mainDataSource";
import { initOrgSequelize } from "../config/orgDataSource";
import {
  HttpStatus,
  rawQueries,
  STATUS_MESSAGE,
} from "../utils/constants";
import { setResourceFiscal, setResourcesData } from "../utils/helpers";

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
        };
      }
      let isResourceActive: any = await mainSequelize.query(
        rawQueries.checkResourceActive(fetchResources)
      );
      if (data.resource_type_rid) {
        let isResourceTypeExists = await mainSequelize.query(
          rawQueries.checkResourceTypeExists(data)
        );
        if (isResourceTypeExists[0].length < 1) {
          return {
            statusCode: HttpStatus.NOT_FOUND,
            statusMessage: STATUS_MESSAGE.resourceTypeNotFound,
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
          };
        }
      }
      if (isResourceActive[0][0].status_name == STATUS_MESSAGE.inactive) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          statusMessage: STATUS_MESSAGE.resourceInactive,
        };
      }
      if (data.resource_code) {
        let checkDuplicateCode = await orgSequelize.query(
          rawQueries.isResourceCodeDuplicate(schemaName, data)
        );
        if (checkDuplicateCode[0].length > 0) {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            statusMessage: STATUS_MESSAGE.resourceCodeDuplicate,
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
        return {
          statusCode: HttpStatus.SUCCESS,
          statusMessage: STATUS_MESSAGE.resourceUpdateSuccess,
        };
      }
    }
  }
}
